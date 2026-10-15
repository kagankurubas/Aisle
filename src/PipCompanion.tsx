import { X, ArrowUpRight } from "lucide-react";
import type { Product } from "./catalog";
import "./pip-companion.css";
export default function PipCompanion({
  product,
  onOpen,
  onHide,
  raised,
}: {
  product?: Product;
  onOpen: () => void;
  onHide: () => void;
  raised: boolean;
}) {
  return (
    <aside
      className={`pip-companion ${raised ? "above-shortlist" : ""}`}
      aria-label="Pip shopping companion"
    >
      <button
        className="pip-companion-open"
        onClick={onOpen}
        aria-label={
          product
            ? `Ask Pip about ${product.name}`
            : "Open Pip shopping assistant"
        }
      >
        <span className="pip tiny" aria-hidden="true">
          <i />
          <i />
        </span>
        <span>
          <strong>
            {product ? "A little help with this?" : "Pip is here to help."}
          </strong>
          <small>{product ? product.name : "Continue your conversation"}</small>
        </span>
        <ArrowUpRight size={15} />
      </button>
      <button
        className="pip-companion-hide"
        aria-label="Hide Pip companion"
        title="Hide Pip · restore from the footer"
        onClick={onHide}
      >
        <X size={15} />
      </button>
    </aside>
  );
}
