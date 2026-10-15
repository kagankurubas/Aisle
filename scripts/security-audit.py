"""Read-only pattern audit. Reports locations and fingerprints, never matched values.

Scans unique reachable Git blobs, uncommitted tracked files and fetched public web
assets. This complements, rather than replaces, GitHub secret scanning/manual review.
Raw fetched assets remain under ignored .capture-state; reports contain no secrets.
"""
import hashlib
import json
import pathlib
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '.capture-state' / 'security-audit'
OUT.mkdir(parents=True, exist_ok=True)
PATTERNS = {
    'google-web-api-key': re.compile(rb'AIza[0-9A-Za-z_-]{35}'),
    'iyzico-sandbox-key': re.compile(rb'\bsandbox-[0-9A-Za-z]{20,}'),
    'github-token': re.compile(rb'\b(?:gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,})'),
    'private-key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'openai-secret': re.compile(rb'\bsk-(?:proj-|svcacct-)?[0-9A-Za-z_-]{30,}'),
    'aws-access-id': re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'jwt': re.compile(rb'\beyJ[0-9A-Za-z_-]{10,}\.eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{30,}'),
    'sensitive-env-literal': re.compile(rb'(?:IYZICO_SANDBOX_(?:API_KEY|SECRET_KEY)|PAYMENT_SESSION_KEY|OPENAI_API_KEY|GEMINI_API_KEY|UPSTASH_REDIS_REST_TOKEN)\s*=\s*[\x22\x27]?[0-9A-Za-z_-]{24,}'),
}
findings = []
def scan(data, location, revision=None):
    if b'\0' in data[:8192]:
        return
    for kind, pattern in PATTERNS.items():
        for match in pattern.finditer(data):
            findings.append({'kind': kind, 'location': location,
                'line': data[:match.start()].count(b'\n') + 1,
                'fingerprint': hashlib.sha256(match.group()).hexdigest()[:12],
                **({'blob': revision} if revision else {})})

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

objects = git('rev-list', '--objects', '--all').decode().splitlines()
blob_count = 0
for entry in objects:
    oid, _, name = entry.partition(' ')
    if not name:
        continue
    if git('cat-file', '-t', oid).strip() != b'blob':
        continue
    data = git('cat-file', 'blob', oid)
    blob_count += 1
    scan(data, name, oid)
tracked = git('ls-files', '-z').decode().split('\0')
for name in filter(None, tracked):
    path = ROOT / name
    if path.is_file():
        scan(path.read_bytes(), 'working-tree:' + name)

network = []
def fetch(url, method='GET', headers=None, body=None):
    req = urllib.request.Request(url, data=body, method=method,
        headers={'User-Agent': 'Aisle-security-audit/1.0', **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.status, dict(response.headers), response.read(10_000_000)
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read(100000)
    except Exception as error:
        network.append({'url':url,'error':type(error).__name__})
        return 0, {}, b''

asset_count = 0
for home in ['https://kagankurubas.github.io/Aisle/', 'https://aisle-roan.vercel.app/']:
    status, headers, html = fetch(home)
    network.append({'url':home,'status':status,'headers':{
        key: value for key,value in headers.items() if key.lower() in ['content-security-policy','x-content-type-options','referrer-policy','strict-transport-security','x-frame-options']}})
    if status != 200:
        continue
    scan(html,home)
    urls = set()
    for path in re.findall(rb'(?:src|href)=[\x22\x27]([^\x22\x27]+)', html):
        path = path.decode()
        if path.endswith(('.js','.css')):
            urls.add(urllib.parse.urljoin(home,path))
    visited = set()
    while urls and len(visited)<80:
        url = urls.pop()
        if url in visited or urllib.parse.urlparse(url).netloc != urllib.parse.urlparse(home).netloc:
            continue
        visited.add(url)
        code, _, data = fetch(url)
        if code != 200:
            network.append({'url':url,'status':code})
            continue
        asset_count += 1
        (OUT / (hashlib.sha256(url.encode()).hexdigest() + '.asset')).write_bytes(data)
        scan(data,url)
        for ref in re.findall(rb'[\x22\x27]([^\x22\x27\n]+\.(?:js|css))[\x22\x27]', data):
            path = ref.decode(errors='replace')
            # Vite dependency maps use basenames as well as ./relative imports.
            if not any(char in path for char in ['{','}',' ',':']):
                urls.add(urllib.parse.urljoin(home if path.startswith('assets/') else url,path))
        for ref in re.findall(rb'sourceMappingURL=([^\s*]+)',data):
            map_url=urllib.parse.urljoin(url,ref.decode())
            map_status,_,map_data=fetch(map_url)
            network.append({'source_map':map_url,'status':map_status})
            if map_status==200: scan(map_data,map_url)

probes = [
    ('OPTIONS', 'https://aisle-roan.vercel.app/api/payment?action=start', {'Origin':'https://kagankurubas.github.io','Access-Control-Request-Method':'POST'}, None),
    ('POST', 'https://aisle-roan.vercel.app/api/payment?action=start', {'Origin':'https://untrusted.example','Content-Type':'application/json'}, b'{}'),
    ('POST', 'https://aisle-roan.vercel.app/api/payment?action=start', {'Origin':'https://kagankurubas.github.io','Content-Type':'application/json'}, b'{}'),
]
for method,url,headers,body in probes:
    status,response_headers,data=fetch(url,method,headers,body)
    # Only unauthenticated requests, never initializes provider sessions.
    network.append({'method':method,'url':url,'origin':headers.get('Origin'),'status':status,
                    'allow_origin':response_headers.get('Access-Control-Allow-Origin'),
                    'cache_control':response_headers.get('Cache-Control')})
    scan(data,'probe:'+url)

status,_,data=fetch('https://api.github.com/repos/kagankurubas/Aisle/actions/runs?per_page=5')
workflow_runs=[]
if status==200:
    workflow_runs=[{key:run.get(key) for key in ['id','head_sha','status','conclusion','html_url']} for run in json.loads(data).get('workflow_runs',[])]
summary={'scope':{'reachable_commits':int(git('rev-list','--count','--all')),'unique_blobs':blob_count,'public_assets':asset_count,
                  'local_head':git('rev-parse','HEAD').decode().strip(),'remote_main':git('rev-parse','origin/main').decode().strip()},
         'findings':findings,'network':network,'workflow_runs':workflow_runs}
(OUT / 'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps({'scope':summary['scope'],'counts':{kind:sum(f['kind']==kind for f in findings) for kind in PATTERNS},
                  'distinct_fingerprints':{kind:len({f['fingerprint'] for f in findings if f['kind']==kind}) for kind in PATTERNS},
                  'network':network,'workflow_runs':workflow_runs},indent=2))
