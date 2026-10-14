import { useState } from "react";
import { X, ShoppingBag, Check } from "lucide-react";
import { imageFor, money, type Product } from "./catalog";
import { differences } from "./shop";
export default function Compare({
  items,
  remove,
  add,
}: {
  items: Product[];
  remove: (id: number) => void;
  add: (p: Product) => void;
}) {
  const [only, setOnly] = useState(false);
  return (
    <div className="compare-content">
      <div className="compare-intro">
        <p>Good choices start with the little differences.</p>
        <label className="switch">
          <input
            type="checkbox"
            checked={only}
            onChange={(e) => setOnly(e.target.checked)}
          />
          Only show differences
        </label>
      </div>
      <div className="compare-scroll">
        <table className="compare-table">
          <caption className="sr-only">
            Compare selected {items[0]?.kind.toLowerCase()}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Your shortlist
                <span className="muted">{items.length} of 3 places</span>
              </th>
              {items.map((p) => (
                <th scope="col" key={p.id}>
                  <button
                    className="remove-product icon-button"
                    aria-label={`Remove ${p.name} from comparison`}
                    onClick={() => remove(p.id)}
                  >
                    <X size={17} />
                  </button>
                  <img src={imageFor(p)} alt={p.name} />
                  <span className="eyebrow">{p.brand}</span>
                  <h3>{p.name}</h3>
                  <span className="compare-price">{money(p.price)}</span>
                  <button className="primary" onClick={() => add(p)}>
                    <ShoppingBag size={16} /> Add to bag
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Color</th>
              {items.map((p) => (
                <td key={p.id}>{p.color}</td>
              ))}
            </tr>
            {differences(items, only).map((key) => (
              <tr key={key}>
                <th scope="row">{key}</th>
                {items.map((p) => (
                  <td key={p.id}>{p.specs[key] ?? "—"}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Availability</th>
              {items.map((p) => (
                <td key={p.id}>
                  <Check size={14} /> In stock
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small muted">
        Demonstration catalog. Specifications and prices are sample data, not
        live retail offers.
      </p>
    </div>
  );
}
