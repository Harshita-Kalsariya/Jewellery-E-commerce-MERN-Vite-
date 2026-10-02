/** Simple page controls for tables and product grids */

function pageWindow(current, totalPages, max = 5) {
  if (totalPages <= max) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(max / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + max - 1);
  start = Math.max(1, end - max + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function PaginationBar({
  page = 1,
  pages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  className = "",
}) {
  const safePages = Math.max(1, pages);
  const safePage = Math.min(Math.max(1, page), safePages);
  const nums = pageWindow(safePage, safePages);

  if (total === 0 && safePages <= 1) {
    return null;
  }

  return (
    <div className={`pagination-bar d-flex flex-wrap align-items-center gap-2 ${className}`}>
      <span className="small text-muted me-1">
        {total > 0 ? (
          <>
            Showing {(safePage - 1) * limit + 1}–{Math.min(safePage * limit, total)} of {total}
          </>
        ) : (
          "No results"
        )}
      </span>
      <div className="btn-group btn-group-sm" role="group" aria-label="Pagination">
        <button
          type="button"
          className="btn btn-outline-warning"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          type="button"
          className="btn btn-outline-warning"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Prev
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn ${n === safePage ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline-warning"
          disabled={safePage >= safePages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
        <button
          type="button"
          className="btn btn-outline-warning"
          disabled={safePage >= safePages}
          onClick={() => onPageChange(safePages)}
        >
          Last
        </button>
      </div>
      <span className="small text-muted">
        Page {safePage} / {safePages}
      </span>
    </div>
  );
}
