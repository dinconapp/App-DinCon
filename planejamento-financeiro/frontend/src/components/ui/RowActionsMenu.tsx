"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function RowActionsMenu({ onEdit, onDelete, deleteLabel = "Excluir" }: { onEdit?: () => void; onDelete?: () => void; deleteLabel?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!onEdit && !onDelete) return null;

  function select(action?: () => void) {
    setOpen(false);
    action?.();
  }

  return (
    <div className="cf-row-menu" ref={ref}>
      <Button square icon={<MoreVertical size={17} />} onClick={() => setOpen((value) => !value)} aria-label="Ações" aria-expanded={open} />
      {open && (
        <div className="cf-row-menu-list">
          {onEdit && <button type="button" onClick={() => select(onEdit)}><Pencil size={15} />Editar</button>}
          {onDelete && <button type="button" onClick={() => select(onDelete)}><Trash2 size={15} />{deleteLabel}</button>}
        </div>
      )}
    </div>
  );
}
