import { useEffect, useRef, type ReactNode } from "react";
import { Check, X } from "lucide-react";
export default function Modal({
  title,
  onClose,
  children,
  wide = false,
  notification = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  notification?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header className="modal-head">
        <div>
          <span className="eyebrow">AISLE / A LITTLE CLOSER</span>
          <h2 id="modal-title">{title}</h2>
          <div className="modal-notification" role="status" aria-live="polite" aria-atomic="true">
            {notification && <><Check size={15} /><span>{notification}</span></>}
          </div>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      {children}
    </dialog>
  );
}
