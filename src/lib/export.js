import * as XLSX from 'xlsx';

export function exportProjectsToExcel(rows, filename = 'pg-infrastructure-projects.xlsx') {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row, index) => ({
      'S.No': row.sNo || index + 1,
      Project: row.projectName || row.name,
      Client: row.clientName || row.client,
      'Company / Segment': row.companySegment || row.type,
      'Project Type': Array.isArray(row.projectType) ? row.projectType.join(', ') : row.projectType || row.typeShort || '',
      Location: row.location || '',
      'Start Date': row.startDate || row.start || '',
      'Planned End': row.targetDate || row.end || '',
      'Actual End': row.actualEnd || row.actualEndDate || '',
      'Project Value': row.projectValue ?? row.value ?? 0,
      'Overall Status': row.overallStatus || row.status || '',
      'Current Stage': row.currentStage || row.stage || '',
      'Stage Completion %': row.stageCompletion ?? row.completion ?? 0,
      'Client Approval Status': row.clientApprovalStatus || row.approval || '',
      'Client Approval Date': row.clientApprovalDate || '',
      'Next Action Required': row.nextActionRequired || row.action || '',
      'Responsible Engineer': row.engineer || row.responsibleEngineer?.name || row.responsibleEngineer || '',
      'Remarks / Blockers': row.remarksOrBlockers || row.remarks || row.blockers || '',
      'CEO / MD Review': row.ceoMdReview || '',
      Priority: row.priority || '',
      'Invoice / Billing Status': row.invoiceStatus || row.billing || '',
      'Amount Received': row.recv ?? '',
      Balance: row.balance ?? '',
      'Estimated Completion %': row.estimatedCompletion ?? '',
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Projects');
  XLSX.writeFile(workbook, filename);
}
