export default function Pagination({ currentPage, totalItems, pageSize, onPageChange, ariaLabel = 'Paginación' }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(Math.max(currentPage, 1), totalPages)

  if (totalItems === 0) return null

  return (
    <nav className="crm-pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="crm-pagination__button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="crm-pagination__count" aria-live="polite" aria-atomic="true">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className="crm-pagination__button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </nav>
  )
}
