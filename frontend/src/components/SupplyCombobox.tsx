import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Supply } from "../types";

interface SupplyComboboxProps {
  supplies: Supply[];
  value: string;
  onChange: (supplyId: string) => void;
  placeholder?: string;
  className?: string;
}

export function SupplyCombobox({
  supplies,
  value,
  onChange,
  placeholder = "Seleccionar insumo...",
  className = "",
}: SupplyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = supplies.find((s) => s.id === value) ?? null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query
    ? supplies.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : supplies;

  function selectSupply(supply: Supply) {
    onChange(supply.id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex w-full items-center justify-between text-left"
      >
        <span className={selected ? "" : "text-on-surface-variant"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-on-surface-variant" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-outline-variant bg-surface-lowest shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe para buscar..."
            className="w-full border-b border-outline-variant px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => selectSupply(s)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-surface-container ${
                  s.id === value ? "bg-secondary/10 font-semibold text-secondary" : ""
                }`}
              >
                {s.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-on-surface-variant">Sin resultados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
