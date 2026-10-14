"""Automatically export allowlisted Codex Desktop prompts and final responses.

Raw session databases never enter the repository. Existing entries are immutable.
Run with --watch before chatting; add another session ID to capture.config.json
to include a second session. This uses Desktop's actual paginated history store.
"""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex')))


def timestamp(ms):
    return dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def snapshot():
    # Copy DB + WAL together, then let SQLite read the local snapshot. Source is
    # never modified; immutable=1 would silently miss recent WAL transactions.
    folder = tempfile.TemporaryDirectory(prefix='snapshot-', dir=ROOT / '.capture-state')
    target = Path(folder.name) / 'history.sqlite'
    for suffix in ('', '-wal'):
        source = SOURCE / ('thread_history_1.sqlite' + suffix)
        if source.exists():
            shutil.copyfile(source, str(target) + suffix)
    return folder, sqlite3.connect(target)


def capture():
    config = json.loads((ROOT / 'capture.config.json').read_text(encoding='utf-8'))
    output = ROOT / '.agent-logs'
    state_dir = ROOT / '.capture-state'
    output.mkdir(exist_ok=True)
    state_dir.mkdir(exist_ok=True)
    folder, db = snapshot()
    try:
        for sid in config['session_ids']:
            rows = db.execute('SELECT item_id, created_at_ms, item_json FROM thread_items WHERE thread_id=? AND item_type IN (?, ?) ORDER BY rollout_ordinal', (sid, 'userMessage', 'agentMessage')).fetchall()
            entries = []
            number = 0
            for item_id, ms, raw in rows:
                item = json.loads(raw)
                if item['type'] == 'userMessage':
                    number += 1
                    kind = 'PROMPT'
                    parts = []
                    for part in item.get('content', []):
                        if part.get('type') == 'text':
                            parts.append(part['text'])
                        elif part.get('type') in ('image', 'localImage'):
                            parts.append('[Image attachment: ' + json.dumps(part, ensure_ascii=False) + ']')
                    body = '\n'.join(parts)
                elif item.get('phase') in ('final', 'final_answer'):
                    kind, body = 'RESPONSE', item.get('text', '')
                else:
                    continue
                entries.append((item_id, ms, kind, number, body))
            if not entries:
                continue
            first = timestamp(entries[0][1])
            filename = first[:19].replace('T', '_').replace(':', '-') + '_' + sid + '.md'
            logfile = output / filename
            statefile = state_dir / (sid + '.json')
            seen = json.loads(statefile.read_text()) if statefile.exists() else {}
            if logfile.exists() and not statefile.exists():
                raise RuntimeError('Log exists without exporter state; refusing to duplicate or overwrite it.')
            if not logfile.exists():
                logfile.write_text('---\nsession_id: ' + sid + '\ndate: ' + first[:10] + '\nauthor: ' + config['author'] + '\nmodel: ' + config['model'] + '\ntool: ' + config['tool'] + '\nproject: aisle\nfirst_prompt_time: ' + first + '\n---\n\n# Session Log - ' + first[:10] + '\n\n', encoding='utf-8')
            for item_id, ms, kind, num, body in entries:
                digest = hashlib.sha256(body.encode()).hexdigest()
                if item_id in seen:
                    if seen[item_id] != digest:
                        raise RuntimeError('Previously captured entry changed: ' + item_id)
                    continue
                entry = '\n[LOG_ENTRY type=' + kind + ' num=' + str(num) + ' session=' + sid[:8] + ']\ntimestamp: ' + timestamp(ms) + '\nmodel: ' + config['model'] + '\n\n' + body + '\n\n'
                with logfile.open('a', encoding='utf-8', newline='\n') as file:
                    file.write(entry)
                seen[item_id] = digest
                statefile.write_text(json.dumps(seen), encoding='utf-8')
    finally:
        db.close()
        folder.cleanup()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    while True:
        try:
            capture()
        except (OSError, sqlite3.Error) as error:
            if not args.watch:
                raise
            print('Capture snapshot retry: ' + str(error), flush=True)
        if not args.watch:
            break
        time.sleep(2)
