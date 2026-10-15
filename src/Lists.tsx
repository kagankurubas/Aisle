import { useState } from "react";
import { ArrowRight, ListPlus, ShoppingBag, Trash2, X } from "lucide-react";
import { imageFor, money, productById, type Product } from "./catalog";
import type { ListStore } from "./useLists";
export function ListPicker({
  store,
  product,
  onSignIn,
  onNotice,
}: {
  store: ListStore;
  product: Product;
  onSignIn: () => void;
  onNotice: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const busy = store.status !== "ready";
  return (
    <div className="list-picker">
      <h4>
        <ListPlus size={17} /> Save to a shopping list
      </h4>
      {store.status === "signed-out" ? (
        <button className="text-button" onClick={onSignIn}>
          Sign in with a verified account <ArrowRight size={15} />
        </button>
      ) : (
        <>
          <form
            className="list-add-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const target = store.lists.find((list) => list.id === selected);
              if (!target || target.products.includes(product.id)) return;
              setMessage("");
              if (await store.add(target.id, product.id)) {
                const notice = `${product.name} added to “${target.name}”.`;
                setMessage(notice);
                onNotice(notice);
                setSelected("");
              }
            }}
          >
            <label>
              Choose a list
              <select
                disabled={busy}
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setMessage("");
                }}
              >
                <option value="">Choose a list…</option>
                {store.lists.map((list) => (
                  <option
                    key={list.id}
                    value={list.id}
                    disabled={list.products.includes(product.id)}
                  >
                    {list.name}
                    {list.products.includes(product.id)
                      ? " · already added"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              type="submit"
              disabled={
                busy ||
                !selected ||
                !store.lists.some(
                  (list) =>
                    list.id === selected && !list.products.includes(product.id),
                )
              }
            >
              <ListPlus size={17} />
              {store.status === "saving" ? "Adding…" : "Add to list"}
            </button>
          </form>
          <form
            className="list-create"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await store.create(name, product.id)) {
                setName("");
                setMessage("List created and product added.");
                onNotice(`${product.name} added to your new list.`);
              }
            }}
          >
            <label>
              Or create a list
              <input
                maxLength={60}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Desk refresh"
                disabled={busy}
              />
            </label>
            <button className="secondary" disabled={busy}>
              Create & add
            </button>
          </form>
          {store.status === "loading" && <p role="status">Loading lists…</p>}
          {store.status === "error" && (
            <button className="text-button" onClick={store.retry}>
              Retry lists
            </button>
          )}
        </>
      )}
      {store.error && (
        <p role="alert" className="error">
          {store.error}
        </p>
      )}
      <p role="status" className={message ? "list-success-notice" : "small"}>
        {message}
      </p>
    </div>
  );
}
export function ListManager({
  store,
  onAdd,
  onProduct,
}: {
  store: ListStore;
  onAdd: (p: Product) => void;
  onProduct: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const busy = store.status !== "ready";
  return (
    <div className="shopping-lists">
      <p className="muted">
        Plan a desk refresh, a gift, or your next little project. Lists stay
        separate from favorites and your bag.
      </p>
      <form
        className="list-create"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await store.create(name)) setName("");
        }}
      >
        <label>
          New list name
          <input
            required
            maxLength={60}
            placeholder="e.g. Gift ideas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </label>
        <button className="secondary" disabled={busy}>
          <ListPlus size={17} /> Create list
        </button>
      </form>
      {store.error && (
        <p role="alert" className="error">
          {store.error}
        </p>
      )}
      {store.status === "error" && (
        <button className="text-button" onClick={store.retry}>
          Retry loading lists
        </button>
      )}
      {store.status === "loading" && <p role="status">Loading your lists…</p>}
      {store.status === "saving" && <p role="status">Saving your list…</p>}
      {store.status === "ready" && !store.lists.length && (
        <p className="muted">
          Your first list starts with a name. Add products from their detail
          view.
        </p>
      )}
      {store.lists.map((list) => (
        <details className="shopping-list" key={list.id} open>
          <summary>
            <strong>{list.name}</strong>
            <span>{list.products.length} items</span>
          </summary>
          <div className="list-tools">
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setEditing(list.id);
                setDraft(list.name);
              }}
            >
              Rename
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => setDeleting(list.id)}
            >
              <Trash2 size={14} /> Delete list
            </button>
          </div>
          {editing === list.id && (
            <form
              className="list-create"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await store.rename(list.id, draft)) setEditing(null);
              }}
            >
              <label>
                List name
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={60}
                  required
                  disabled={busy}
                />
              </label>
              <button className="secondary" disabled={busy}>
                Save name
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </form>
          )}
          {deleting === list.id && (
            <div className="list-delete-confirm">
              <p>
                Delete “{list.name}”? Products will stay in your favorites and
                bag.
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  if (await store.remove(list.id)) setDeleting(null);
                }}
              >
                Delete list
              </button>
              <button className="text-button" onClick={() => setDeleting(null)}>
                Keep list
              </button>
            </div>
          )}
          {!list.products.length && (
            <p className="small muted">
              Open a product and choose “Save to a shopping list” to add it
              here.
            </p>
          )}
          {list.products.map((id) => {
            const p = productById(id);
            return p ? (
              <article className="list-product" key={id}>
                <button
                  onClick={() => onProduct(p)}
                  aria-label={`View ${p.name}`}
                >
                  <img
                    src={imageFor(p)}
                    alt=""
                    width="56"
                    height="56"
                    loading="lazy"
                  />
                </button>
                <button
                  className="list-product-name"
                  onClick={() => onProduct(p)}
                >
                  {p.name}
                  <small>{money(p.price)}</small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Add ${p.name} to bag`}
                  onClick={() => onAdd(p)}
                >
                  <ShoppingBag size={17} />
                </button>
                <button
                  className="icon-button"
                  disabled={busy}
                  aria-label={`Remove ${p.name} from ${list.name}`}
                  onClick={() => store.removeProduct(list.id, id)}
                >
                  <X size={16} />
                </button>
              </article>
            ) : null;
          })}
        </details>
      ))}
    </div>
  );
}
