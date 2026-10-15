import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Package,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import type { SessionUser } from "./auth";
import { imageFor, money, productById, type Product } from "./catalog";
import "./account-page.css";

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
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const focusSection = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target && target.id !== "account") {
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0 });
        heading.current?.focus({ preventScroll: true });
      }
    };
    focusSection();
    window.addEventListener("hashchange", focusSection);
    const previousTitle = document.title;
    document.title = "Your account — Aisle";
    return () => {
      window.removeEventListener("hashchange", focusSection);
      document.title = previousTitle;
    };
  }, []);
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
          <a href="#account-saved">
            <Heart size={17} />
            <strong>{saved.length}</strong> saved finds
          </a>
          <a href="#account-orders">
            <Package size={17} />
            <strong>{orderCount}</strong> demo orders
          </a>
          <button onClick={onBag}>
            <ShoppingBag size={17} />
            <strong>{bagCount}</strong> in your bag <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div className="account-page-layout">
        <nav className="account-page-nav" aria-label="Account sections">
          <span className="eyebrow">A PLACE FOR EVERYTHING</span>
          <a href="#account-saved">
            01 <span>Saved finds</span>
            <ArrowRight size={16} />
          </a>
          <a href="#account-orders">
            02 <span>Demo orders</span>
            <ArrowRight size={16} />
          </a>
          <a href="#account-details">
            03 <span>Account details</span>
            <ArrowRight size={16} />
          </a>
          <p>
            <ShieldCheck size={17} /> Your bag and saved finds belong to your
            account.
          </p>
        </nav>
        <div className="account-page-sections">
          <section
            id="account-saved"
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
            id="account-details"
            className="account-page-section"
            tabIndex={-1}
            aria-labelledby="details-heading"
          >
            <div className="account-section-heading">
              <div>
                <span className="eyebrow">03 / THE EVERYDAY DETAILS</span>
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
