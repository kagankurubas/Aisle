import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Headphones,
  Leaf,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  X,
  Scale,
} from "lucide-react";
import {
  products,
  productById,
  imageFor,
  money,
  type Product,
} from "./catalog";
import {
  comparable,
  normalizeCart,
  searchCatalog,
  totals,
  subtractPurchased,
  type CartLine,
  type DemoOrder,
} from "./shop";
import Modal from "./Modal";
import { authAvailable, subscribeAuth, type SessionUser } from "./auth";
import useShoppingData from "./useShoppingData";
import useLists from "./useLists";
import { ListPicker } from "./Lists";
const Account = lazy(() => import("./Account"));
const AccountPage = lazy(() => import("./AccountPage"));
const Compare = lazy(() => import("./Compare"));
const Checkout = lazy(() => import("./Checkout"));
const DemoTools = lazy(() => import("./DemoTools"));
const Pip = lazy(() => import("./Pip"));
type Panel =
  | "bag"
  | "compare"
  | "account"
  | "orders"
  | "checkout"
  | "guide"
  | "success"
  | "demo-tools"
  | null;
function Stars({ p }: { p: Product }) {
  return (
    <span className="rating">
      <span aria-hidden="true">★★★★★</span>
      <span>
        {p.rating} <small>({p.reviews.toLocaleString()})</small>
      </span>
    </span>
  );
}
export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accountPage, setAccountPage] = useState(
    window.location.hash.startsWith("#account"),
  );
  const [authReady, setAuthReady] = useState(!authAvailable);
  const {
    cart,
    setCart,
    favorites,
    setFavorites,
    orders,
    setOrders,
    ready: shoppingReady,
    syncStatus,
    retry: retrySync,
  } = useShoppingData(user, authReady);
  const signedIn = Boolean(user);
  const listStore = useLists(user);
  const [selected, setSelected] = useState<number[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [max, setMax] = useState(200000);
  const [sort, setSort] = useState("featured");
  const [savedOnly, setSavedOnly] = useState(false);
  const [filters, setFilters] = useState(false);
  const [toast, setToast] = useState("");
  const [demo, setDemo] = useState(false);
  const [authError, setAuthError] = useState("");
  const [lastOrder, setLastOrder] = useState<DemoOrder | null>(null);
  const catalogRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedPayments = useRef(new Set<string>());
  useEffect(() => {
    const route = () => {
      setAccountPage(window.location.hash.startsWith("#account"));
      setPanel(null);
      setDetail(null);
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    if (user && panel === "account") {
      close();
      setAccountPage(false);
      setCategory("All");
      setQuery("");
      setSavedOnly(false);
      setMax(200000);
      setSort("featured");
      setFilters(false);
      setDemo(false);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
    }
    if (authReady && !user && accountPage) leaveAccount();
  }, [user?.uid, panel, authReady, accountPage]);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    subscribeAuth((next) => {
      if (!cancelled) {
        setUser(next);
        setAuthReady(true);
      }
    })
      .then((dispose) => {
        if (cancelled) dispose();
        else unsubscribe = dispose;
      })
      .catch(() => {
        if (!cancelled) {
          setAuthError(
            "Account connection is unavailable. You can still explore the demo.",
          );
          setAuthReady(true);
        }
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const selectedProducts = selected
    .map((id) => productById(id)!)
    .filter(Boolean);
  const sum = totals(cart);
  const count = cart.reduce((n, l) => n + l.quantity, 0);
  const results = searchCatalog(
    query,
    category,
    max,
    sort,
    savedOnly ? favorites : undefined,
  );
  const browsing =
    !query &&
    category === "All" &&
    max === 200000 &&
    !savedOnly &&
    sort === "featured";
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }
  function add(p: Product) {
    if (!shoppingReady) {
      notify(
        user && !user.emailVerified
          ? "Verify your email before saving your finds."
          : "Your account is not ready. Check the account notice and retry.",
      );
      return;
    }
    const current = cart.find((l) => l.id === p.id)?.quantity ?? 0;
    if (current >= p.stock) {
      notify("You have reached the available stock for this item.");
      return;
    }
    setCart((prev) => normalizeCart([...prev, { id: p.id, quantity: 1 }]));
    notify(`${p.name} is in your bag.`);
  }
  function save(p: Product) {
    if (!shoppingReady) {
      notify(
        user && !user.emailVerified
          ? "Verify your email before saving your finds."
          : "Your account is not ready. Check the account notice and retry.",
      );
      return;
    }
    setFavorites((prev) =>
      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
    );
  }
  function select(p: Product) {
    if (selected.includes(p.id)) {
      setSelected((prev) => prev.filter((id) => id !== p.id));
      return;
    }
    if (!comparable(selectedProducts, p)) {
      notify(
        selected.length === 3
          ? "Three is a good shortlist. Remove one to add another."
          : `Choose another ${selectedProducts[0].kind.toLowerCase()} to make a useful comparison.`,
      );
      return;
    }
    setSelected((prev) => [...prev, p.id]);
  }
  function browse(c = "All") {
    leaveAccount();
    setCategory(c);
    setSavedOnly(false);
    setQuery("");
    setMax(200000);
    setSort("featured");
    requestAnimationFrame(() =>
      catalogRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }
  function close() {
    setPanel(null);
    setDetail(null);
  }
  function leaveAccount() {
    if (window.location.hash.startsWith("#account")) {
      setAccountPage(false);
      window.location.hash = "catalog";
    }
  }
  function openAccount(section = "account") {
    close();
    if (user) {
      setAccountPage(true);
      window.location.hash = section;
    } else setPanel("account");
  }
  function orderHistory() {
    return (
      <div className="orders-content">
        <p className="demo-notice">
          Browser-local demonstration orders · No real purchases
        </p>
        {!orders.length ? (
          <div className="empty">
            <Package size={36} />
            <h3>A good story starts with a first find.</h3>
            <p>You haven’t placed a demo order yet.</p>
            <button
              className="primary"
              onClick={() => {
                close();
                browse();
              }}
            >
              Explore the shelves <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          orders.map((o) => (
            <article className="order" key={o.id}>
              <div className="order-meta">
                <strong>{o.id}</strong>
                <span>
                  {new Date(o.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className={`order-status ${o.status === "Cancelled" ? "cancelled" : ""}`}
                >
                  {o.status}
                </span>
              </div>
              {normalizeCart(o.lines).map((l) => {
                const p = productById(l.id)!;
                return (
                  <div className="summary-item" key={l.id}>
                    <img src={imageFor(p)} alt="" />
                    <span>
                      {p.name}
                      <small>Qty {l.quantity}</small>
                    </span>
                  </div>
                );
              })}
              <div className="order-bottom">
                <strong>{money(o.total)}</strong>
                {o.status === "Confirmed" && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setOrders((prev) =>
                        prev.map((x) =>
                          x.id === o.id ? { ...x, status: "Cancelled" } : x,
                        ),
                      );
                      notify("Demo order cancelled. No refund was needed.");
                    }}
                  >
                    Cancel demo order
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() => {
                    setCart((prev) => normalizeCart([...prev, ...o.lines]));
                    notify("Available items added to your bag.");
                  }}
                >
                  Buy again
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    );
  }
  function product(p: Product, index: number) {
    return (
      <article className="shelf-product" key={p.id}>
        <div className="product-art">
          <button
            className="image-link"
            onClick={() => setDetail(p)}
            aria-label={`View ${p.name}`}
          >
            <img
              src={imageFor(p)}
              alt={p.name}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
              width="300"
              height="300"
            />
          </button>
          <button
            className={`save-button icon-button ${favorites.includes(p.id) ? "saved" : ""}`}
            aria-label={`${favorites.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
            aria-pressed={favorites.includes(p.id)}
            onClick={() => save(p)}
          >
            <Heart
              size={19}
              fill={favorites.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="product-info">
          <span className="eyebrow">
            {p.brand} <span className="dot">·</span> {p.color}
          </span>
          <button className="product-title" onClick={() => setDetail(p)}>
            <h3>{p.name}</h3>
            <ArrowUpRight size={17} />
          </button>
          <Stars p={p} />
          <div className="price-line">
            <strong>{money(p.price)}</strong>
            {p.original && <del>{money(p.original)}</del>}
            <button
              className="add-button"
              aria-label={`Add ${p.name} to bag`}
              onClick={() => add(p)}
            >
              <Plus size={19} />
            </button>
          </div>
          <button
            className={`compare-choice ${selected.includes(p.id) ? "chosen" : ""}`}
            onClick={() => select(p)}
            aria-pressed={selected.includes(p.id)}
          >
            {selected.includes(p.id) ? <Check size={15} /> : <Plus size={15} />}{" "}
            {selected.includes(p.id) ? "On your shortlist" : "Compare"}
          </button>
        </div>
      </article>
    );
  }
  return (
    <>
      <a
        href={accountPage ? "#account-details" : "#catalog"}
        className="skip-link"
      >
        {accountPage ? "Skip to account details" : "Skip to products"}
      </a>
      <div className="announcement">
        <span>
          <Leaf size={13} /> A little more thoughtful. A little less endless
          scrolling.
        </span>
        <span className="announcement-right">
          A concept store · Demo prices
        </span>
      </div>
      <header className="site-header">
        <div className="header-main">
          <button
            className="wordmark"
            onClick={() => {
              close();
              browse();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Aisle home"
          >
            aisle<span>®</span>
          </button>
          <div className="header-search">
            <Search size={18} />
            <input
              aria-label="Search products"
              placeholder="Find your next good thing"
              value={query}
              onChange={(e) => {
                leaveAccount();
                setQuery(e.target.value);
                setSavedOnly(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  catalogRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
            {query ? (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={16} />
              </button>
            ) : (
              <kbd>↵</kbd>
            )}
          </div>
          <div className="header-actions">
            <button
              className="account-button"
              aria-label={
                signedIn
                  ? `My account${user?.displayName ? `: ${user.displayName}` : ""}`
                  : demo
                    ? "Demo account"
                    : "Sign in"
              }
              title={user?.displayName || undefined}
              onClick={() => openAccount()}
            >
              <UserRound size={20} />
              <span>
                {signedIn
                  ? user?.displayName || "My account"
                  : demo
                    ? "Demo shopper"
                    : "Sign in"}
              </span>
            </button>
            <button
              className={`icon-button favorite-nav ${savedOnly ? "active" : ""}`}
              aria-label={`Saved items (${favorites.length})`}
              onClick={() => {
                leaveAccount();
                setSavedOnly((v) => !v);
                setCategory("All");
                setQuery("");
                catalogRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Heart size={21} />
              {favorites.length > 0 && <i>{favorites.length}</i>}
            </button>
            <button
              className="bag-button"
              onClick={() => setPanel("bag")}
              aria-label={`Shopping bag (${count} items)`}
            >
              <ShoppingBag size={21} />
              <span>Bag</span>
              <b>{count}</b>
            </button>
          </div>
        </div>
        <div className="header-bottom">
          <nav aria-label="Shop categories">
            {["All", "Audio", "Workspace", "Everyday"].map((c) => (
              <button
                key={c}
                className={category === c && !savedOnly ? "active" : ""}
                onClick={() => browse(c)}
              >
                {c === "All" ? "The whole aisle" : c}
              </button>
            ))}
            <button
              onClick={() => {
                browse();
                setMax(7500);
              }}
            >
              Little finds <span>↗</span>
            </button>
          </nav>
          <span className="delivery-note">
            <MapPin size={14} /> Demo delivery · US
          </span>
        </div>
      </header>
      {(authError ||
        (user && syncStatus !== "saved" && syncStatus !== "local")) && (
        <div className="account-sync-banner" role="status">
          <span>
            {authError ||
              (syncStatus === "verify"
                ? "Verify your email to save your bag and favorites."
                : syncStatus === "error"
                  ? "Your account could not sync. Your changes have not been saved."
                  : syncStatus === "saving"
                    ? "Saving your bag and favorites…"
                    : "Loading your bag and favorites…")}
          </span>
          {syncStatus === "error" ? (
            <button className="text-button" onClick={retrySync}>
              Retry
            </button>
          ) : syncStatus === "verify" ? (
            <button
              className="text-button"
              onClick={() => openAccount("account-details")}
            >
              Open account
            </button>
          ) : null}
        </div>
      )}
      <main>
        {accountPage && user ? (
          <Suspense
            fallback={
              <div className="empty" role="status">
                Opening your account…
              </div>
            }
          >
            <AccountPage
              key={user.uid}
              user={user}
              favorites={favorites}
              listStore={listStore}
              orderCount={orders.length}
              bagCount={count}
              onBrowse={() => browse()}
              onAdd={add}
              onSave={save}
              onProduct={setDetail}
              onBag={() => setPanel("bag")}
              orders={orderHistory()}
              settings={
                <Account
                  page
                  user={user}
                  onUser={setUser}
                  syncStatus={syncStatus}
                  savedCount={favorites.length}
                  onDemo={() => {}}
                  onOrders={() => openAccount("account-orders")}
                  onSaved={() => openAccount("account-saved")}
                />
              }
            />
          </Suspense>
        ) : (
          <>
            {browsing && (
              <section className="hero" aria-label="Welcome to Aisle">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="tiny-line" /> GOOD THINGS, THOUGHTFULLY
                    FOUND
                  </div>
                  <h1>
                    Less scrolling.
                    <br />
                    More <em>finding.</em>
                  </h1>
                  <p>
                    A few things you’ll love. Room to discover them.
                    <br />
                    Welcome to a different kind of everyday store.
                  </p>
                  <button className="primary" onClick={() => browse()}>
                    Explore the shelves <ArrowDown size={17} />
                  </button>
                  <button
                    className="hero-guide"
                    onClick={() => setPanel("guide")}
                  >
                    <span className="pip tiny">
                      <i />
                      <i />
                    </span>{" "}
                    A little help choosing?{" "}
                    <span className="underline">
                      Meet Pip <ArrowUpRight size={13} />
                    </span>
                  </button>
                </div>
                <div className="hero-display">
                  <span className="hero-index">
                    THE LISTENING EDIT <span>01 / 03</span>
                  </span>
                  <button
                    className="hero-product"
                    onClick={() => setDetail(products[0])}
                    aria-label="Discover AirPods Max"
                  >
                    <img
                      src={imageFor(products[0])}
                      alt="Silver Apple AirPods Max headphones"
                      fetchPriority="high"
                      width="500"
                      height="500"
                    />
                  </button>
                  <div className="hero-seal">
                    <Headphones size={22} />
                    <span>
                      Find your
                      <br />
                      <em>quiet.</em>
                    </span>
                  </div>
                  <div className="hero-product-caption">
                    <div>
                      <span className="eyebrow">APPLE</span>
                      <button onClick={() => setDetail(products[0])}>
                        AirPods Max <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div>
                      <del>$549.00</del>
                      <strong>$449.00</strong>
                    </div>
                  </div>
                </div>
                <span className="hero-bottom-label">
                  CURATED, NOT COMPLICATED.
                </span>
              </section>
            )}
            <section id="catalog" ref={catalogRef} className="catalog">
              <div className="catalog-top">
                <div>
                  <span className="eyebrow">MAKE YOURSELF AT HOME</span>
                  <h2>
                    {savedOnly
                      ? "Your good finds."
                      : query
                        ? `Finds for “${query}”`
                        : category === "All"
                          ? "Take a look around."
                          : `${category}, thoughtfully picked.`}
                  </h2>
                </div>
                <div className="catalog-tools">
                  <span className="results-count">
                    {results.length} good{" "}
                    {results.length === 1 ? "find" : "finds"}
                  </span>
                  <button
                    className={`filter-button ${filters ? "active" : ""}`}
                    aria-expanded={filters}
                    onClick={() => setFilters((v) => !v)}
                  >
                    <SlidersHorizontal size={16} /> Filter
                  </button>
                  <label className="sort-label">
                    <span className="sr-only">Sort products</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="featured">Our favorites</option>
                      <option value="low">Price: low to high</option>
                      <option value="high">Price: high to low</option>
                      <option value="rating">Highest rated</option>
                    </select>
                    <ChevronDown size={14} />
                  </label>
                </div>
              </div>
              {filters && (
                <div className="filter-panel">
                  <label>
                    Budget: {money(max)}
                    <input
                      type="range"
                      min="2000"
                      max="200000"
                      step="1000"
                      value={max}
                      onChange={(e) => setMax(Number(e.target.value))}
                    />
                  </label>
                  <div>
                    {["All", "Audio", "Workspace", "Everyday"].map((c) => (
                      <button
                        key={c}
                        aria-pressed={category === c}
                        className={category === c ? "chip active" : "chip"}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setMax(200000);
                      setCategory("All");
                      setSort("featured");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
              {results.length === 0 ? (
                <div className="empty">
                  <Search size={32} />
                  <h3>
                    {savedOnly
                      ? "A shelf of your own."
                      : "Nothing on this shelf just yet."}
                  </h3>
                  <p>
                    {savedOnly
                      ? "Tap the heart on something you like. We’ll keep it here."
                      : "Try a different search or give your budget a little more room."}
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      browse();
                      setFilters(false);
                    }}
                  >
                    Explore all finds <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                ["Audio", "Workspace", "Everyday"].map((c, si) => {
                  const list = results.filter((p) => p.category === c);
                  if (!list.length) return null;
                  return (
                    <section
                      className="shelf"
                      key={c}
                      aria-labelledby={`shelf-${c}`}
                    >
                      <div className="shelf-heading">
                        <div>
                          <span className="shelf-number">0{si + 1}</span>
                          <h3 id={`shelf-${c}`}>
                            {c === "Audio"
                              ? "Sound, in good company."
                              : c === "Workspace"
                                ? "Make room for your next idea."
                                : "Little things. Better days."}
                          </h3>
                        </div>
                        <span>
                          {c === "Audio"
                            ? "For tuning in. Or switching off."
                            : c === "Workspace"
                              ? "A desk that works for you."
                              : "The essentials, considered."}
                        </span>
                      </div>
                      <div className="product-shelf">
                        {list.map((p, i) => product(p, si * 4 + i))}
                      </div>
                    </section>
                  );
                })
              )}
            </section>
            <section className="guide-banner">
              <div className="pip large">
                <i />
                <i />
                <span />
              </div>
              <div>
                <span className="eyebrow">
                  A LITTLE GUIDANCE GOES A LONG WAY
                </span>
                <h2>Good taste. No guesswork.</h2>
                <p>
                  Tell Pip what you’re looking for. Find a few things worth a
                  closer look.
                </p>
              </div>
              <button className="secondary" onClick={() => setPanel("guide")}>
                Let’s find your thing <ArrowUpRight size={18} />
              </button>
            </section>
            <div className="promises">
              <div>
                <Truck />
                <span>
                  Delivery, without surprises
                  <small>Free standard delivery from $75</small>
                </span>
              </div>
              <div>
                <Scale />
                <span>
                  Details that make a difference
                  <small>A proper side-by-side comparison</small>
                </span>
              </div>
              <div>
                <ShieldCheck />
                <span>
                  A safe place to explore
                  <small>No real payments in this demo</small>
                </span>
              </div>
            </div>
          </>
        )}
      </main>
      <footer>
        <div>
          <span className="wordmark">
            aisle<span>®</span>
          </span>
          <p>A little store. A better way to find.</p>
        </div>
        <div className="footer-links">
          <button
            onClick={() =>
              user ? openAccount("account-orders") : setPanel("orders")
            }
          >
            Your orders
          </button>
          <button
            onClick={() => {
              openAccount();
            }}
          >
            Your account
          </button>
          <button
            onClick={() =>
              notify(
                "Aisle is a concept storefront. Catalog, reviews, delivery, and orders are demonstration data.",
              )
            }
          >
            About this demo
          </button>
          <span>© {new Date().getFullYear()} Aisle</span>
          <button onClick={() => setPanel("demo-tools")}>Demo tools</button>
        </div>
      </footer>
      {selected.length > 0 && !panel && !detail && (
        <aside className="compare-dock" aria-label="Comparison shortlist">
          <div className="dock-label">
            <Scale size={19} />
            <span>
              Your shortlist
              <small>
                {selected.length}/3 · {selectedProducts[0]?.kind}
              </small>
            </span>
          </div>
          <div className="dock-products">
            {selectedProducts.map((p) => (
              <div key={p.id}>
                <img src={imageFor(p)} alt={p.name} />
                <button
                  aria-label={`Remove ${p.name} from shortlist`}
                  onClick={() => select(p)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="primary"
            disabled={selected.length < 2}
            onClick={() => setPanel("compare")}
          >
            Compare {selected.length} <ArrowRight size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Clear comparison"
            onClick={() => setSelected([])}
          >
            <X size={17} />
          </button>
        </aside>
      )}
      <div
        className={`toast ${toast && !detail && !panel ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && !detail && !panel && (
          <>
            <Check size={17} />
            {toast}
          </>
        )}
      </div>
      {detail && (
        <Modal title={detail.name} onClose={close} notification={toast} wide>
          <div className="product-detail">
            <div className="detail-image">
              <img src={imageFor(detail)} alt={detail.name} />
              <span className="eyebrow">
                A CLOSER LOOK / {detail.brand.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="eyebrow">
                {detail.kind} · {detail.color}
              </span>
              <h3>{detail.description.split(".")[0]}.</h3>
              <Stars p={detail} />
              <p>{detail.description}</p>
              <div className="detail-price">
                <strong>{money(detail.price)}</strong>
                {detail.original && <del>{money(detail.original)}</del>}
              </div>
              <p className="stock">
                <span /> In stock · {detail.stock} available
              </p>
              <p className="small">
                <Truck size={15} /> Standard demo delivery{" "}
                {detail.price >= 7500 ? "is free" : "$5.99 · free from $75"}
              </p>
              <div className="detail-actions">
                <button className="primary" onClick={() => add(detail)}>
                  <ShoppingBag size={17} /> Add to bag
                </button>
                <button className="secondary" onClick={() => save(detail)}>
                  <Heart
                    size={17}
                    fill={
                      favorites.includes(detail.id) ? "currentColor" : "none"
                    }
                  />{" "}
                  {favorites.includes(detail.id) ? "Saved" : "Save"}
                </button>
              </div>
              <button className="compare-choice" onClick={() => select(detail)}>
                {selected.includes(detail.id) ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {selected.includes(detail.id)
                  ? "On your shortlist"
                  : "Add to comparison"}
              </button>
              <ListPicker
                onNotice={notify}
                key={`${user?.uid ?? "guest"}:${detail.id}`}
                store={listStore}
                product={detail}
                onSignIn={() => openAccount("account-lists")}
              />
              <dl className="spec-list">
                {Object.entries(detail.specs).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="small muted">
                Sample specifications and review scores for demonstration. Check
                the manufacturer for actual compatibility.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {panel && (
        <Modal
          title={
            panel === "demo-tools"
              ? "The little test lab."
              : panel === "bag"
                ? "Your bag."
                : panel === "compare"
                  ? "The comparison workbench."
                  : panel === "account"
                    ? "Make yourself at home."
                    : panel === "orders"
                      ? "Your orders."
                      : panel === "guide"
                        ? "Meet Pip."
                        : panel === "success"
                          ? "A good find, indeed."
                          : "A thoughtful checkout."
          }
          onClose={close}
          notification={toast}
          wide={["compare", "checkout", "demo-tools"].includes(panel)}
        >
          <Suspense fallback={<p className="loading">Making a little room…</p>}>
            {panel === "demo-tools" && (
              <DemoTools
                key={user?.uid ?? "demo"}
                cart={cart}
                onOrders={() => setPanel("orders")}
                onComplete={(order) => {
                  setOrders((prev) => [order, ...prev]);
                  setLastOrder(order);
                  setPanel("success");
                }}
              />
            )}
            {panel === "bag" && (
              <div className="bag-content">
                {cart.length ? (
                  <>
                    <p className="muted">
                      {count} {count === 1 ? "thing" : "things"} worth making
                      room for.
                    </p>
                    <div className="shipping-progress">
                      <span>
                        {sum.subtotal >= 7500
                          ? "Your standard delivery is on us."
                          : `${money(7500 - sum.subtotal)} away from free standard delivery.`}
                      </span>
                      <progress
                        value={Math.min(sum.subtotal, 7500)}
                        max={7500}
                      />
                    </div>
                    {cart.map((l) => {
                      const p = productById(l.id)!;
                      return (
                        <div className="bag-item" key={l.id}>
                          <button
                            className="image-link"
                            aria-label={`View ${p.name}`}
                            onClick={() => {
                              setPanel(null);
                              setDetail(p);
                            }}
                          >
                            <img src={imageFor(p)} alt={p.name} />
                          </button>
                          <div>
                            <span className="eyebrow">{p.brand}</span>
                            <h3>{p.name}</h3>
                            <small>{p.color} · In stock</small>
                            <div className="quantity">
                              <button
                                aria-label={`Decrease ${p.name} quantity`}
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.flatMap((x) =>
                                      x.id !== p.id
                                        ? [x]
                                        : x.quantity > 1
                                          ? [{ ...x, quantity: x.quantity - 1 }]
                                          : [],
                                    ),
                                  )
                                }
                              >
                                {l.quantity === 1 ? (
                                  <Trash2 size={14} />
                                ) : (
                                  <Minus size={14} />
                                )}
                              </button>
                              <span aria-label={`Quantity of ${p.name}`}>
                                {l.quantity}
                              </span>
                              <button
                                disabled={l.quantity >= p.stock}
                                aria-label={`Increase ${p.name} quantity`}
                                onClick={() => add(p)}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="bag-item-end">
                            <strong>{money(p.price * l.quantity)}</strong>
                            <button
                              className="text-button"
                              onClick={() => {
                                setFavorites((prev) =>
                                  prev.includes(p.id) ? prev : [...prev, p.id],
                                );
                                setCart((prev) =>
                                  prev.filter((x) => x.id !== p.id),
                                );
                                notify("Saved for another day.");
                              }}
                            >
                              Save for later
                            </button>
                            <button
                              className="text-button"
                              onClick={() => {
                                setCart((prev) =>
                                  prev.filter((x) => x.id !== p.id),
                                );
                                notify(`${p.name} removed from your bag.`);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <dl className="total-list">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{money(sum.subtotal)}</dd>
                      </div>
                      <div>
                        <dt>Standard delivery</dt>
                        <dd>{sum.shipping ? money(sum.shipping) : "On us"}</dd>
                      </div>
                      <div className="grand-total">
                        <dt>Total</dt>
                        <dd>{money(sum.total)}</dd>
                      </div>
                    </dl>
                    <button
                      className="primary full"
                      onClick={() => setPanel("checkout")}
                    >
                      Continue to test checkout <ArrowRight size={17} />
                    </button>
                    <p className="small muted centered">
                      No real payment will be taken.
                    </p>
                  </>
                ) : (
                  <div className="empty">
                    <ShoppingBag size={36} />
                    <h3>A little room for something good.</h3>
                    <p>
                      Your bag is empty. The shelves are a good place to start.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        close();
                        browse();
                      }}
                    >
                      Back to the shelves <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </div>
            )}
            {panel === "compare" &&
              (selectedProducts.length >= 2 ? (
                <Compare
                  items={selectedProducts}
                  add={add}
                  remove={(id) => {
                    setSelected((prev) => prev.filter((x) => x !== id));
                    if (selected.length <= 2) setPanel(null);
                  }}
                />
              ) : (
                <div className="empty">
                  Choose at least two products of the same kind.
                </div>
              ))}
            {panel === "checkout" && (
              <Checkout
                key={user?.uid ?? "demo"}
                cart={cart}
                onPaid={(receipt) => {
                  const key = `${user?.uid}:${receipt.paymentId}`;
                  if (appliedPayments.current.has(key)) return;
                  appliedPayments.current.add(key);
                  setCart((previous) =>
                    subtractPurchased(previous, receipt.lines),
                  );
                }}
                continueShopping={() => setPanel(null)}
              />
            )}
            {panel === "success" && lastOrder && (
              <div className="success">
                <span className="success-icon">
                  <Check size={35} />
                </span>
                <span className="eyebrow">DEMO ORDER CONFIRMED</span>
                <h3>Consider it thoughtfully found.</h3>
                <p>
                  Your test order is ready to explore. No payment was taken and
                  nothing will be shipped.
                </p>
                <div className="confirmation">
                  <span>Order reference</span>
                  <strong>{lastOrder.id}</strong>
                  <span>Demo total</span>
                  <strong>{money(lastOrder.total)}</strong>
                </div>
                <button className="primary" onClick={() => setPanel("orders")}>
                  View your demo orders <ArrowRight size={16} />
                </button>
              </div>
            )}
            {panel === "account" && (
              <Account
                user={user}
                onUser={setUser}
                syncStatus={syncStatus}
                savedCount={favorites.length}
                onDemo={() => {
                  setDemo(true);
                  close();
                  notify(
                    "Welcome, demo shopper. No personal information needed.",
                  );
                }}
                onOrders={() =>
                  user ? openAccount("account-orders") : setPanel("orders")
                }
                onSaved={() => {
                  close();
                  setSavedOnly(true);
                  setCategory("All");
                  setQuery("");
                  catalogRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            )}
            {panel === "orders" && orderHistory()}
            {panel === "guide" && (
              <Pip
                key={user?.uid ?? "guest"}
                user={user}
                onSignIn={() => {
                  setPanel(null);
                  openAccount();
                }}
                onView={(p) => {
                  setPanel(null);
                  setDetail(p);
                }}
                onAdd={add}
                onCompare={select}
              />
            )}
          </Suspense>
        </Modal>
      )}
    </>
  );
}
