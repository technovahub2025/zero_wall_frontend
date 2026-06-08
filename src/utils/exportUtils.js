import * as XLSX from 'xlsx';

export function exportRowsToExcel(rows = [], columns = [], filename = 'export.xlsx', sheetName = 'Sheet1') {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row) =>
      columns.reduce((acc, column) => {
        acc[column.label] = typeof column.value === 'function' ? column.value(row) : row[column.value];
        return acc;
      }, {}),
    ),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function exportWorkbookToExcel(sheets = [], filename = 'export.xlsx') {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheetDef) => {
    const rows = Array.isArray(sheetDef.rows) ? sheetDef.rows : [];
    const columns = Array.isArray(sheetDef.columns) && sheetDef.columns.length
      ? sheetDef.columns
      : rows.length
        ? Object.keys(rows[0]).map((key) => ({ label: key, value: key }))
        : [];

    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) =>
        columns.reduce((acc, column) => {
          acc[column.label] = typeof column.value === 'function' ? column.value(row) : row[column.value];
          return acc;
        }, {}),
      ),
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetDef.name || 'Sheet1');
  });

  XLSX.writeFile(workbook, filename);
}
