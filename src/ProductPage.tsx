import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  Scale,
  Truck,
  Star,
} from "lucide-react";
import { type Product, imageFor, money } from "./catalog";
import { ListPicker } from "./Lists";
import type { ListStore } from "./useLists";
import "./product-page.css";
export default function ProductPage({
  product: p,
  onBrowse,
  onAdd,
  onSave,
  onCompare,
  saved,
  selected,
  listStore,
  onSignIn,
  onNotice,
}: {
  product: Product | undefined;
  onBrowse: () => void;
  onAdd: (p: Product) => void;
  onSave: (p: Product) => void;
  onCompare: (p: Product) => void;
  saved: boolean;
  selected: boolean;
  listStore: ListStore;
  onSignIn: () => void;
  onNotice: (message: string) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const old = document.title;
    document.title = p ? `${p.name} — Aisle` : "Product not found — Aisle";
    if (window.location.hash.endsWith("/reviews"))
      document.getElementById("product-reviews")?.focus();
    else {
      window.scrollTo({ top: 0, behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
    }
    return () => {
      document.title = old;
    };
  }, [p?.id, window.location.hash]);
  if (!p)
    return (
      <div className="product-page">
        <h1 ref={heading} tabIndex={-1}>
          That find isn’t here.
        </h1>
        <p>This product link doesn’t match our sample catalog.</p>
        <button className="primary" onClick={onBrowse}>
          Back to the aisle
          <ArrowRight size={17} />
        </button>
      </div>
    );
  const specs = Object.entries(p.specs);
  const reviews = [
    {
      name: "Demo reader A",
      score: 5,
      title: "A considered choice",
      text: `The ${p.name} is an interesting option in this sample collection. ${specs[0] ? `${specs[0][0]}: ${specs[0][1]}.` : ""} I would compare the details with similar products before choosing.`,
    },
    {
      name: "Demo reader B",
      score: 4,
      title: "Worth comparing the details",
      text: `The listed ${specs[1]?.[0].toLowerCase() ?? "color"} (${specs[1]?.[1] ?? p.color}) helps narrow down the options. Check the full specification and compatibility for your needs.`,
    },
  ];
  return (
    <article className="product-page">
      <nav className="product-breadcrumb" aria-label="Product breadcrumb">
        <button className="text-button" onClick={onBrowse}>
          <ArrowLeft size={16} />
          The aisle
        </button>
        <span>/</span>
        <span>{p.category}</span>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="product-page-overview">
        <div className="product-page-art">
          <img src={imageFor(p)} alt={`${p.color} ${p.brand} ${p.name}`} />
          <span className="eyebrow">
            A CLOSER LOOK / {p.brand.toUpperCase()}
          </span>
        </div>
        <div className="product-page-buy">
          <span className="eyebrow">
            {p.brand} · {p.kind} · {p.color}
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {p.name}
          </h1>
          <a className="product-review-link" href={`#product/${p.id}/reviews`}>
            <Star size={16} fill="currentColor" />
            {p.rating} · {p.reviews.toLocaleString()} sample ratings · Read
            reviews
          </a>
          <p>{p.description}</p>
          <div className="detail-price">
            <strong>{money(p.price)}</strong>
            {p.original && <del>{money(p.original)}</del>}
          </div>
          <p className="stock">In stock · {p.stock} available in this demo</p>
          <p className="small muted">
            <Truck size={16} />
            Standard demo delivery{" "}
            {p.price >= 7500 ? "is free" : "$5.99 · free from $75"}
          </p>
          <div className="detail-actions">
            <button className="primary" onClick={() => onAdd(p)}>
              <ShoppingBag size={17} />
              Add to bag
            </button>
            <button className="secondary" onClick={() => onSave(p)}>
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <button className="compare-choice" onClick={() => onCompare(p)}>
            <Scale size={16} />
            {selected ? "On your shortlist" : "Add to comparison"}
          </button>
          <ListPicker
            key={p.id}
            store={listStore}
            product={p}
            onSignIn={onSignIn}
            onNotice={onNotice}
          />
        </div>
      </div>
      <section className="product-page-section" aria-labelledby="product-specs">
        <span className="eyebrow">THE DETAILS THAT MATTER</span>
        <h2 id="product-specs">A closer look.</h2>
        <dl className="product-page-specs">
          {specs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted">
          Sample specifications for this exam project. Check the manufacturer
          for actual compatibility.
        </p>
      </section>
      <section
        className="product-page-section product-reviews"
        id="product-reviews"
        tabIndex={-1}
        aria-labelledby="reviews-title"
      >
        <span className="eyebrow">A LITTLE MORE PERSPECTIVE</span>
        <h2 id="reviews-title">Reviews</h2>
        <div className="review-demo-notice">
          <strong>Illustrative reviews · demonstration only</strong>
          <p>
            These two written examples, the rating score and the review count
            are sample content. They are not real customer submissions or
            verified purchases.
          </p>
        </div>
        <div className="review-overview">
          <strong>
            {p.rating}
            <small>/ 5</small>
          </strong>
          <span>{p.reviews.toLocaleString()} sample ratings</span>
        </div>
        <div className="review-list">
          {reviews.map((r) => (
            <article className="review-item" key={r.name}>
              <div>
                <strong>{r.name}</strong>
                <span
                  className="review-stars"
                  aria-label={`${r.score} out of 5 stars`}
                >
                  {"★".repeat(r.score)}
                  {"☆".repeat(5 - r.score)}
                </span>
                <small>Illustrative review</small>
              </div>
              <div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
