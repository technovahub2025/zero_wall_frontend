export function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, index) => row.id || index,
  emptyMessage = 'No records found.',
  scrollClassName = '',
  stickyHeader = false,
  scrollAxis = 'x',
  tableClassName = '',
  onRowClick,
  rowClassName,
}) {
  function shouldIgnoreRowClick(target) {
    return Boolean(target?.closest('button, a, input, textarea, select, [role="button"], [role="checkbox"]'));
  }

  const scrollContainerClassName =
    scrollAxis === 'both'
      ? `overflow-auto ${scrollClassName}`.trim()
      : scrollAxis === 'y'
        ? `overflow-y-auto overflow-x-auto md:overflow-x-hidden ${scrollClassName}`.trim()
        : `overflow-x-auto overflow-y-hidden ${scrollClassName}`.trim();

  return (
    <div className={scrollContainerClassName}>
      <table className={`min-w-full text-left text-sm text-[rgb(var(--text))] ${tableClassName}`.trim()}>
        <thead className={`border-b border-[rgb(var(--line)/0.12)] text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--muted))] ${stickyHeader ? 'sticky top-0 z-10 bg-[rgb(var(--panel)/0.98)] backdrop-blur' : ''}`}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.className || ''} ${stickyHeader ? 'bg-inherit' : ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={(event) => {
                  if (!onRowClick || shouldIgnoreRowClick(event.target)) return;
                  onRowClick(row, index, event);
                }}
                className={`border-b border-[rgb(var(--line)/0.06)] transition hover:bg-[rgb(var(--panel-2)/0.7)] ${onRowClick ? 'cursor-pointer' : ''} ${typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                  className={`px-4 py-4 align-top leading-6 ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.className || ''}`}
                >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-sm text-[rgb(var(--muted))]" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
