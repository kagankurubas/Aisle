import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ListPlus,
  Package,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import type { SessionUser } from "./auth";
import { imageFor, money, productById, type Product } from "./catalog";
import "./account-page.css";
import { ListManager } from "./Lists";
import type { ListStore } from "./useLists";

export default function AccountPage({
  user,
  favorites,
  orderCount,
  bagCount,
  settings,
  orders,
  onBrowse,
  onAdd,
  onSave,
  onProduct,
  onBag,
  listStore,
}: {
  user: SessionUser;
  favorites: number[];
  orderCount: number;
  bagCount: number;
  settings: ReactNode;
  orders: ReactNode;
  onBrowse: () => void;
  onAdd: (p: Product) => void;
  onSave: (p: Product) => void;
  onProduct: (p: Product) => void;
  onBag: () => void;
  listStore: ListStore;
}) {
  const sections = [
    "account",
    "account-saved",
    "account-orders",
    "account-lists",
    "account-details",
  ];
  const currentSection = () =>
    sections.includes(window.location.hash.slice(1))
      ? window.location.hash.slice(1)
      : "account";
  const [active, setActive] = useState(currentSection);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const route = () => setActive(currentSection());
    window.addEventListener("hashchange", route);
    const previousTitle = document.title;
    document.title = "Your account — Aisle";
    return () => {
      window.removeEventListener("hashchange", route);
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => {
    if (active === "account") heading.current?.focus({ preventScroll: true });
    else
      requestAnimationFrame(() => {
        const section = document.getElementById(active);
        section?.focus({ preventScroll: true });
        section?.scrollIntoView({ block: "start", behavior: "instant" });
      });
  }, [active]);
  const saved = favorites
    .map(productById)
    .filter((p): p is Product => Boolean(p));
  const name = user.displayName?.split(/\s+/)[0];
  return (
    <div className="account-page" id="account">
      <div className="account-page-intro">
        <button className="text-button" onClick={onBrowse}>
          <ArrowLeft size={16} /> Back to the aisle
        </button>
        <span className="eyebrow">YOUR LITTLE CORNER OF AISLE</span>
        <h1 ref={heading} tabIndex={-1}>
          {name ? (
            <>
              Make yourself at home, <em>{name}.</em>
            </>
          ) : (
            <>
              Make yourself <em>at home.</em>
            </>
          )}
        </h1>
        <p>
          Your saved finds, everyday details, and the stories behind your next
          good thing.
        </p>
        <div className="account-page-facts">
          <a
            href="#account-saved"
            aria-current={active === "account-saved" ? "page" : undefined}
          >
            <Heart size={17} />
            <strong>{saved.length}</strong> saved finds
          </a>
          <a
            href="#account-orders"
            aria-current={active === "account-orders" ? "page" : undefined}
          >
            <Package size={17} />
            <strong>{orderCount}</strong> demo orders
          </a>
          <button onClick={onBag}>
            <ShoppingBag size={17} />
            <strong>{bagCount}</strong> in your bag <ArrowRight size={15} />
          </button>
          <a
            href="#account-lists"
            aria-current={active === "account-lists" ? "page" : undefined}
          >
            <ListPlus size={17} />
            <strong>{listStore.lists.length}</strong> shopping lists
          </a>
        </div>
      </div>
      <div className="account-page-layout">
        <nav className="account-page-nav" aria-label="Account sections">
          <span className="eyebrow">A PLACE FOR EVERYTHING</span>
          <a
            href="#account"
            aria-current={active === "account" ? "page" : undefined}
          >
            00 <span>Overview</span>
            <ArrowRight size={16} />
          </a>
          <a
            href="#account-saved"
            aria-current={active === "account-saved" ? "page" : undefined}
          >
            01 <span>Saved finds</span>
            <ArrowRight size={16} />
          </a>
          <a
            href="#account-orders"
            aria-current={active === "account-orders" ? "page" : undefined}
          >
            02 <span>Demo orders</span>
            <ArrowRight size={16} />
          </a>
          <a
            href="#account-lists"
            aria-current={active === "account-lists" ? "page" : undefined}
          >
            03 <span>Shopping lists</span>
            <ArrowRight size={16} />
          </a>
          <a
            href="#account-details"
            aria-current={active === "account-details" ? "page" : undefined}
          >
            04 <span>Account details</span>
            <ArrowRight size={16} />
          </a>
          <p>
            <ShieldCheck size={17} /> Your bag and saved finds belong to your
            account.
          </p>
        </nav>
        <div className="account-page-sections">
          <section
            hidden={active !== "account"}
            className="account-overview"
            aria-labelledby="overview-heading"
          >
            <span className="eyebrow">EVERYTHING IN ITS PLACE</span>
            <h2 id="overview-heading">Your space, at a glance.</h2>
            {user.isAnonymous && (
              <p className="account-session-note">
                <ShieldCheck size={18} />
                Private demo session. Other browsers start a separate account;
                keep this session to return to your finds.
              </p>
            )}
            <div className="account-overview-cards">
              <a href="#account-saved">
                <Heart size={22} />
                <strong>{saved.length}</strong>
                <span>Saved finds</span>
                <small>A little inspiration for later</small>
                <ArrowRight size={16} />
              </a>
              <a href="#account-lists">
                <ListPlus size={22} />
                <strong>
                  {listStore.status === "loading"
                    ? "…"
                    : listStore.lists.length}
                </strong>
                <span>Shopping lists</span>
                <small>Keep each plan in its own place</small>
                <ArrowRight size={16} />
              </a>
              <a href="#account-orders">
                <Package size={22} />
                <strong>{orderCount}</strong>
                <span>Demo orders</span>
                <small>Browser-local practice orders</small>
                <ArrowRight size={16} />
              </a>
            </div>
            <div className="account-overview-preview">
              <div>
                <h3>A few worth keeping.</h3>
                <a href="#account-saved">
                  View saved finds <ArrowRight size={15} />
                </a>
              </div>
              {saved.length ? (
                <div className="account-preview-products">
                  {saved.slice(0, 3).map((p) => (
                    <button key={p.id} onClick={() => onProduct(p)}>
                      <img src={imageFor(p)} alt={p.name} />
                      <span>{p.name}</span>
                      <small>{money(p.price)}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  Tap a product’s heart to keep it here. Your lists and bag stay
                  separate.
                </p>
              )}
            </div>
            <button className="secondary" onClick={onBag}>
              <ShoppingBag size={17} />
              Open your bag · {bagCount} items
            </button>
          </section>
          <section
            id="account-saved"
            hidden={active !== "account-saved"}
            className="account-page-section"
            tabIndex={-1}
            aria-labelledby="saved-heading"
          >
            <div className="account-section-heading">
              <div>
                <span className="eyebrow">01 / KEEP A LITTLE INSPIRATION</span>
                <h2 id="saved-heading">Worth coming back to.</h2>
              </div>
              <span>{saved.length} finds</span>
            </div>
            {saved.length ? (
              <div className="account-saved-list">
                {saved.map((p) => (
                  <article key={p.id} className="account-saved-item">
                    <button
                      className="account-saved-image"
                      aria-label={`View ${p.name}`}
                      onClick={() => onProduct(p)}
                    >
                      <img
                        src={imageFor(p)}
                        alt={p.name}
                        width="100"
                        height="100"
                        loading="lazy"
                      />
                    </button>
                    <div>
                      <span className="eyebrow">{p.brand}</span>
                      <button
                        className="account-saved-title"
                        onClick={() => onProduct(p)}
                      >
                        {p.name}
                      </button>
                      <span>{money(p.price)}</span>
                    </div>
                    <div className="account-saved-actions">
                      <button className="secondary" onClick={() => onAdd(p)}>
                        Add to bag <ShoppingBag size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${p.name} from saved finds`}
                        onClick={() => onSave(p)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="account-page-empty">
                <Heart size={27} />
                <h3>A few favorites make it yours.</h3>
                <p>
                  Save anything that catches your eye. It will be waiting right
                  here.
                </p>
                <button className="text-button" onClick={onBrowse}>
                  Find your first favorite <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
          <section
            id="account-orders"
            hidden={active !== "account-orders"}
            className="account-page-section"
            tabIndex={-1}
            aria-labelledby="orders-heading"
          >
            <div className="account-section-heading">
              <div>
                <span className="eyebrow">02 / YOUR SHOPPING STORIES</span>
                <h2 id="orders-heading">Your demo orders.</h2>
              </div>
              <Package size={23} />
            </div>
            <p className="muted">
              Offline demo orders are kept in this browser. Verified iyzico
              Sandbox receipts are shown at checkout and do not appear here.
            </p>
            {orders}
          </section>
          <section
            id="account-lists"
            hidden={active !== "account-lists"}
            className="account-page-section"
            tabIndex={-1}
            aria-labelledby="lists-heading"
          >
            <div className="account-section-heading">
              <div>
                <span className="eyebrow">03 / MAKE ROOM FOR A PLAN</span>
                <h2 id="lists-heading">A list for every little thing.</h2>
              </div>
              <ListPlus size={23} />
            </div>
            <ListManager
              store={listStore}
              onAdd={onAdd}
              onProduct={onProduct}
            />
          </section>
          <section
            id="account-details"
            hidden={active !== "account-details"}
            className="account-page-section"
            tabIndex={-1}
            aria-labelledby="details-heading"
          >
            <div className="account-section-heading">
              <div>
                <span className="eyebrow">04 / THE EVERYDAY DETAILS</span>
                <h2 id="details-heading">A little about you.</h2>
              </div>
              <ShieldCheck size={23} />
            </div>
            {user.displayName && (
              <p className="account-profile-name">{user.displayName}</p>
            )}
            {settings}
          </section>
        </div>
      </div>
    </div>
  );
}
