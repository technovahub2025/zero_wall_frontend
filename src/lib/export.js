import * as XLSX from 'xlsx';

export function exportProjectsToExcel(rows, filename = 'pg-infrastructure-projects.xlsx') {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      Project: row.name,
      Client: row.client,
      Type: row.type,
      Location: row.location,
      Stage: row.stage,
      Status: row.status,
      Priority: row.priority,
      Completion: `${row.completion}%`,
      Engineer: row.engineer,
      Approval: row.approval,
      Value: `Rs. ${row.value} L`,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Projects');
  XLSX.writeFile(workbook, filename);
}
