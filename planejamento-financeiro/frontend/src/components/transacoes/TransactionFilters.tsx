import type { Category } from "@/types/category";
import type { TransactionFilters as Filters } from "@/services/transactionService";

export function TransactionFilters({ categories, filters, onChange }: { categories: Category[]; filters: Filters; onChange: (filters: Filters) => void }) {
  return (
    <div className="cf-card cf-grid cf-three">
      <input className="cf-input" placeholder="Buscar por descrição" value={filters.search ?? ""} onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })} />
      <select className="cf-select" value={filters.kind ?? ""} onChange={(e) => onChange({ ...filters, kind: (e.target.value || undefined) as Filters["kind"] })}>
        <option value="">Todos os tipos</option>
        <option value="income">Entradas</option>
        <option value="expense">Gastos</option>
      </select>
      <select className="cf-select" value={filters.category_id ?? ""} onChange={(e) => onChange({ ...filters, category_id: e.target.value || undefined })}>
        <option value="">Todas categorias</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
    </div>
  );
}
