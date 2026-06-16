import { parseISO } from 'date-fns';

function pickFirst(value) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value) {
  const date = safeDate(value);
  return date ? date.toISOString() : null;
}

export function normalizeProject(record = {}) {
  const projectType = Array.isArray(record.projectType) ? record.projectType : record.projectType ? [record.projectType] : [];
  const value = Number(record.projectValue ?? record.value ?? 0);
  const recv = Number(record.recv ?? 0);
  const balance = Number(record.balance ?? Math.max(value - recv, 0));
  const completion = Number(record.stageCompletion ?? record.completion ?? 0);
  const responsibleEngineer = record.responsibleEngineer || null;
  const createdBy = record.createdBy || null;
  const tasks = Array.isArray(record.tasks) ? record.tasks.map(normalizeTask) : [];
  const taskCount = Number(record.taskCount ?? record.taskCountValue ?? 0);

  return {
    id: String(record.id || record._id || record.projectId || record.name || ''),
    dbId: String(record._id || record.id || record.projectId || ''),
    projectName: record.projectName || record.name || 'Untitled Project',
    clientName: record.clientName || record.client || '',
    companySegment: record.companySegment || record.type || '',
    projectType,
    location: record.location || '',
    startDate: toIsoDate(record.startDate || record.start) || record.start || null,
    targetDate: toIsoDate(record.targetDate || record.end) || record.end || null,
    actualEnd: toIsoDate(record.actualEnd || record.actualEndDate) || record.actualEnd || null,
    projectValue: value,
    overallStatus: record.overallStatus || record.status || 'In Progress',
    currentStage: record.currentStage || record.stage || '',
    stageCompletion: completion,
    clientApprovalStatus: record.clientApprovalStatus || record.approval || '',
    clientApprovalDate: toIsoDate(record.clientApprovalDate) || null,
    nextActionRequired: record.nextActionRequired || '',
    responsibleEngineer,
    assignedTeam: Array.isArray(record.assignedTeam) ? record.assignedTeam : [],
    remarks: record.remarks || '',
    blockers: record.blockers || '',
    remarksOrBlockers: record.remarksOrBlockers || record.remarksOrBlockersCombined || [record.remarks, record.blockers].filter(Boolean).join(' | '),
    ceoMdReview: record.ceoMdReview || '',
    priority: record.priority || 'Medium',
    invoiceStatus: record.invoiceStatus || record.billing || '',
    estimatedCompletion: Number(record.estimatedCompletion || 0),
    taskCount,
    recv,
    balance,
    isArchived: Boolean(record.isArchived),
    createdBy,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
    name: record.projectName || record.name || 'Untitled Project',
    client: record.clientName || record.client || '',
    type: record.companySegment || record.type || '',
    typeShort: pickFirst(projectType),
    start: record.startDate || record.start || null,
    end: record.targetDate || record.end || null,
    actualEnd: record.actualEnd || record.actualEndDate || null,
    value,
    status: record.overallStatus || record.status || 'In Progress',
    stage: record.currentStage || record.stage || '',
    completion,
    engineer: responsibleEngineer?.name || record.engineer || '',
    approval: record.clientApprovalStatus || record.approval || '',
    billing: record.invoiceStatus || record.billing || '',
    taskCount,
    tasks,
  };
}

export function normalizeStage(record = {}) {
  const project = record.project && typeof record.project === 'object' ? normalizeProject(record.project) : record.project || null;
  return {
    id: String(record.id || record._id || ''),
    dbId: String(record._id || record.id || ''),
    project,
    projectId: typeof record.project === 'string' ? record.project : record.project?._id || record.project?.id || null,
    stageNo: record.stageNo || '',
    stageName: record.stageName || '',
    stageDescription: record.stageDescription || '',
    stageStart: record.stageStart || null,
    stageEndPlanned: record.stageEndPlanned || null,
    stageEndActual: record.stageEndActual || null,
    stageStatus: record.stageStatus || 'Not Started',
    deliverable: record.deliverable || '',
    submittedToClientOn: record.submittedToClientOn || null,
    clientApprovalStatus: record.clientApprovalStatus || '',
    clientApprovalDate: record.clientApprovalDate || null,
    clientComments: record.clientComments || '',
    nextAction: record.nextAction || '',
    responsibleEngineer: record.responsibleEngineer || null,
    approvalRequired: record.approvalRequired || '',
    disciplines: record.disciplines || '',
    duration: record.duration || '',
    completionPct: Number(record.completionPct || 0),
    assignedTo: record.assignedTo || null,
    approvedBy: record.approvedBy || null,
    approvedAt: record.approvedAt || null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

export function normalizeTask(record = {}) {
  const project = record.project && typeof record.project === 'object' ? normalizeProject(record.project) : record.project || null;
  const stage = record.stage && typeof record.stage === 'object' ? record.stage : record.stage || null;
  const comments = Array.isArray(record.comments) ? record.comments : [];
  const team = record.team && typeof record.team === 'object' ? record.team : record.team || null;
  const teamMembers = Array.isArray(team?.members) ? team.members : [];
  const assignedTeam = Array.isArray(record.assignedTeam) ? record.assignedTeam : [];
  const assignedTeamNames = Array.isArray(record.assignedTeamNames)
    ? record.assignedTeamNames
    : assignedTeam
        .map((member) => member?.name || member?.label || '')
        .filter(Boolean);
  const reporter = record.reporter || record.createdBy || null;
  const statusMap = {
    pending: 'todo',
    todo: 'todo',
    'in-progress': 'in-progress',
    review: 'review',
    done: 'done',
    blocked: 'blocked',
  };
  const status = statusMap[String(record.status || 'todo').toLowerCase()] || String(record.status || 'todo').toLowerCase();
  return {
    id: String(record.id || record._id || ''),
    dbId: String(record._id || record.id || ''),
    title: record.title || '',
    description: record.description || '',
    startDate: record.startDate || null,
    project,
    projectId: typeof record.project === 'string' ? record.project : record.project?._id || record.project?.id || null,
    stage,
    stageId: typeof record.stage === 'string' ? record.stage : record.stage?._id || record.stage?.id || null,
    assignee: record.assignee || null,
    team,
    teamName: team?.name || record.teamName || '',
    teamMembers,
    backupReviewer: record.backupReviewer || null,
    priority: record.priority || 'Medium',
    status,
    dueDate: record.dueDate || null,
    completedAt: record.completedAt || null,
    estimatedDurationMinutes: Number(record.estimatedDurationMinutes || 0),
    timerStartedAt: record.timerStartedAt || null,
    timerExpiresAt: record.timerExpiresAt || null,
    timerStatus: record.timerStatus || 'not_started',
    extraTimeMinutesGranted: Number(record.extraTimeMinutesGranted || 0),
    activeTimerLog: record.activeTimerLog || null,
    pendingTimeExtensionRequest: record.pendingTimeExtensionRequest || null,
    latestTimeExtensionRequest: record.latestTimeExtensionRequest || null,
    nextAction: record.nextAction || '',
    tags: Array.isArray(record.tags) ? record.tags : typeof record.tags === 'string' ? record.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    comments,
    order: Number(record.order || 0),
    totalTimeLogged: Number(record.totalTimeLogged || 0),
    createdBy: record.createdBy || null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
    projectName: record.projectName || project?.projectName || record.project?.projectName || '',
    projectClient: record.projectClient || project?.clientName || record.project?.clientName || '',
    projectStage: record.projectStage || project?.currentStage || record.project?.currentStage || '',
    projectStatus: record.projectStatus || project?.overallStatus || record.project?.overallStatus || '',
    projectEngineer: record.projectEngineer || project?.engineer || '',
    assigneeName: record.assignee?.name || record.assigneeName || '',
    reporter,
    reporterName: reporter?.name || record.reporterName || record.createdBy?.name || '',
    teamMemberNames: Array.isArray(record.teamMemberNames)
      ? record.teamMemberNames
      : teamMembers.map((member) => member?.name || member?.label || '').filter(Boolean),
    assignedTeam,
    assignedTeamNames,
    backupReviewerName: record.backupReviewer?.name || record.backupReviewerName || '',
  };
}

export function normalizeClient(record = {}) {
  const projectIds = Array.isArray(record.projectIds) ? record.projectIds : [];
  const projects = Array.isArray(record.projects) ? record.projects : [];
  return {
    id: String(record.id || record._id || ''),
    dbId: String(record._id || record.id || ''),
    clientName: record.clientName || '',
    contactPerson: record.contactPerson || '',
    email: record.email || '',
    phone: record.phone || '',
    companyName: record.companyName || '',
    segment: record.segment || '',
    address: record.address || '',
    city: record.city || '',
    status: record.status || 'Active',
    notes: record.notes || '',
    projectIds,
    projectCount: Number(record.projectCount || projectIds.length || projects.length || 0),
    projects,
    createdBy: record.createdBy || null,
    updatedBy: record.updatedBy || null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

export function normalizeTeam(record = {}) {
  const members = Array.isArray(record.members) ? record.members : [];
  const projectIds = Array.isArray(record.projectIds) ? record.projectIds : [];
  const currentProjects = Array.isArray(record.currentProjects) ? record.currentProjects.map(normalizeProject) : [];
  const currentTasks = Array.isArray(record.currentTasks) ? record.currentTasks.map(normalizeTask) : [];

  return {
    id: String(record.id || record._id || ''),
    dbId: String(record._id || record.id || ''),
    name: record.name || 'Untitled Team',
    description: record.description || '',
    color: record.color || '#3b82f6',
    members,
    memberCount: Number(record.memberCount || members.length || 0),
    projectIds,
    projectCount: Number(record.projectCount || projectIds.length || 0),
    currentProjects,
    currentTasks,
    createdBy: record.createdBy || null,
    isActive: Boolean(record.isActive ?? true),
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

export function buildDashboardData(projects = [], tasks = []) {
  const projectRows = projects.map(normalizeProject);
  const taskRows = tasks.map(normalizeTask);
  const openTasks = taskRows.filter((task) => task.status !== 'done');
  const overdueTasks = openTasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now());
  const dueSoonTasks = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    return due >= Date.now() && due - Date.now() <= 48 * 60 * 60 * 1000;
  });

  const actions = taskRows
    .filter((task) => task.status !== 'done')
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 6)
    .map((task, index) => ({
      id: task.id,
      n: String(index + 1).padStart(2, '0'),
      projectName: task.projectName || task.project?.projectName || 'Project',
      projectClient: task.projectClient || task.project?.clientName || '',
      status: task.status,
      projectStatus: task.projectStatus || task.project?.overallStatus || '',
      priority: task.priority,
      projectStage: task.projectStage || task.stage?.stageName || '',
      nextAction: task.description || task.title,
      assigneeName: task.assigneeName || task.projectEngineer || 'Unassigned',
      dueDate: task.dueDate || null,
      decision: task.backupReviewerName || 'Pending',
      // legacy aliases used by older table views
      proj: task.projectName || task.project?.projectName || 'Project',
      client: task.projectClient || task.project?.clientName || '',
      pri: task.priority,
      stage: task.projectStage || task.stage?.stageName || '',
      action: task.description || task.title,
      resp: task.assigneeName || task.projectEngineer || 'Unassigned',
      target: task.dueDate || null,
    }));

  const revenueSummary = projectRows.map((project) => ({
    name: project.projectName,
    received: Number(project.recv || 0),
    balance: Number(project.balance || 0),
  }));

  const teamMap = new Map();
  projectRows.forEach((project) => {
    const engineer = project.engineer || 'Unassigned';
    if (!teamMap.has(engineer)) {
      teamMap.set(engineer, { name: engineer, projects: 0, color: '#2E83F5' });
    }
    teamMap.get(engineer).projects += 1;
  });

  const kpis = [
    { label: 'Total Projects', value: projectRows.length, note: 'All active and archived records', tone: 'blue' },
    { label: 'In Progress', value: projectRows.filter((item) => item.status === 'In Progress' || item.status === 'progress').length, note: 'Live project delivery', tone: 'sky' },
    { label: 'Completed', value: projectRows.filter((item) => item.status === 'Completed' || item.status === 'done').length, note: 'Closed projects', tone: 'emerald' },
    { label: 'On Hold', value: projectRows.filter((item) => item.status === 'On Hold' || item.status === 'hold').length, note: 'Paused items', tone: 'amber' },
    { label: 'Critical', value: projectRows.filter((item) => String(item.priority).toLowerCase() === 'critical').length, note: 'Escalations', tone: 'rose' },
    { label: 'Avg Completion', value: projectRows.length ? `${Math.round(projectRows.reduce((sum, item) => sum + Number(item.completion || 0), 0) / projectRows.length)}%` : '0%', note: 'Across the portfolio', tone: 'sky' },
    { label: 'Tasks Due Soon', value: dueSoonTasks.length, note: 'Next 48 hours', tone: 'amber' },
  ];

  return {
    projects: projectRows,
    tasks: taskRows,
    kpis,
    actions,
    revenueSummary,
    team: [...teamMap.values()],
    summary: {
      totalProjects: projectRows.length,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      pendingApprovals: projectRows.filter((item) => item.approval !== 'Approved').length,
      totalValue: projectRows.reduce((sum, item) => sum + Number(item.value || 0), 0),
    },
  };
}
