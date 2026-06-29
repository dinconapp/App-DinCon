export function EmptyState({ message = "Nenhum registro encontrado." }: { message?: string }) {
  return <div className="cf-empty">{message}</div>;
}
