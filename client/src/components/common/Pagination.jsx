const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top">
      <small className="text-muted">
        Showing {from}–{to} of {total} records
      </small>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
          </li>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            return (
              <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
              </li>
            );
          })}
          <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
