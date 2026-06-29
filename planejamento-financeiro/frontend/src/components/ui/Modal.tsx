import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="cf-modal-backdrop" role="dialog" aria-modal="true">
      <div className="cf-modal">
        <header className="cf-card-head">
          <h2>{title}</h2>
          <Button square icon={<X size={18} />} onClick={onClose} aria-label="Fechar" />
        </header>
        {children}
      </div>
    </div>
  );
}
