const baseProjects = [
  {
    id: 'PRJ-001',
    name: 'Apex Heights',
    client: 'Apex Realty',
    type: 'Residential',
    typeShort: 'RES',
    location: 'Pune',
    start: '2025-01-08',
    end: '2025-09-22',
    value: 48.5,
    stage: 'Structural',
    status: 'progress',
    priority: 'high',
    completion: 64,
    engineer: 'Arjun Mehta',
    approval: 'Approved',
    recv: 28.4,
    balance: 20.1,
    billing: 'Partially Paid',
  },
  {
    id: 'PRJ-002',
    name: 'Orion Tech Park',
    client: 'Orion Infra',
    type: 'Commercial',
    typeShort: 'COM',
    location: 'Bengaluru',
    start: '2024-11-02',
    end: '2025-08-15',
    value: 92.0,
    stage: 'MEP',
    status: 'progress',
    priority: 'critical',
    completion: 72,
    engineer: 'Neha Patil',
    approval: 'In Review',
    recv: 61.2,
    balance: 30.8,
    billing: 'Milestone Due',
  },
  {
    id: 'PRJ-003',
    name: 'Saffron Logistics Hub',
    client: 'Saffron Group',
    type: 'Industrial',
    typeShort: 'IND',
    location: 'Nagpur',
    start: '2024-10-18',
    end: '2025-06-30',
    value: 58.75,
    stage: 'Finishing',
    status: 'hold',
    priority: 'medium',
    completion: 86,
    engineer: 'Rahul Singh',
    approval: 'Pending',
    recv: 42.25,
    balance: 16.5,
    billing: 'Pending',
  },
  {
    id: 'PRJ-004',
    name: 'Bluewater Residency',
    client: 'Bluewater Homes',
    type: 'Residential',
    typeShort: 'RES',
    location: 'Hyderabad',
    start: '2025-02-01',
    end: '2025-11-14',
    value: 36.2,
    stage: 'Planning',
    status: 'progress',
    priority: 'low',
    completion: 28,
    engineer: 'Priya Iyer',
    approval: 'Approved',
    recv: 12.8,
    balance: 23.4,
    billing: 'On Track',
  },
  {
    id: 'PRJ-005',
    name: 'Skyline Mall Expansion',
    client: 'Skyline Retail',
    type: 'Commercial',
    typeShort: 'COM',
    location: 'Ahmedabad',
    start: '2024-12-10',
    end: '2025-07-20',
    value: 74.9,
    stage: 'Interior',
    status: 'progress',
    priority: 'high',
    completion: 54,
    engineer: 'Karan Joshi',
    approval: 'In Review',
    recv: 38.5,
    balance: 36.4,
    billing: 'Payment Review',
  },
  {
    id: 'PRJ-006',
    name: 'Greenfield Pharma Unit',
    client: 'Greenfield Labs',
    type: 'Manufacturing',
    typeShort: 'MFG',
    location: 'Vadodara',
    start: '2024-09-05',
    end: '2025-05-18',
    value: 103.4,
    stage: 'As Built',
    status: 'done',
    priority: 'critical',
    completion: 100,
    engineer: 'Sneha Rao',
    approval: 'Approved',
    recv: 103.4,
    balance: 0,
    billing: 'Closed',
  },
  {
    id: 'PRJ-007',
    name: 'Vista Towers',
    client: 'Vista Developers',
    type: 'Residential',
    typeShort: 'RES',
    location: 'Chennai',
    start: '2025-03-12',
    end: '2025-12-01',
    value: 66.3,
    stage: 'Foundation',
    status: 'progress',
    priority: 'medium',
    completion: 32,
    engineer: 'Ishaan Kulkarni',
    approval: 'Pending',
    recv: 19.75,
    balance: 46.55,
    billing: 'Scheduled',
  },
  {
    id: 'PRJ-008',
    name: 'Metro Office Block',
    client: 'Metro Spaces',
    type: 'Commercial',
    typeShort: 'COM',
    location: 'Mumbai',
    start: '2024-08-22',
    end: '2025-04-30',
    value: 81.9,
    stage: 'As Built',
    status: 'done',
    priority: 'high',
    completion: 100,
    engineer: 'Ayesha Khan',
    approval: 'Approved',
    recv: 81.9,
    balance: 0,
    billing: 'Closed',
  },
];

const baseTeam = [
  { name: 'Arjun Mehta', role: 'Project Lead', projects: 2, color: '#0ea5e9', initials: 'AM', online: true },
  { name: 'Neha Patil', role: 'Senior Engineer', projects: 1, color: '#8b5cf6', initials: 'NP', online: true },
  { name: 'Rahul Singh', role: 'Site Supervisor', projects: 2, color: '#22c55e', initials: 'RS', online: false },
  { name: 'Priya Iyer', role: 'Planning Manager', projects: 1, color: '#f59e0b', initials: 'PI', online: true },
  { name: 'Karan Joshi', role: 'Interior Lead', projects: 1, color: '#06b6d4', initials: 'KJ', online: false },
  { name: 'Sneha Rao', role: 'QA / Handover', projects: 2, color: '#ef4444', initials: 'SR', online: true },
];

const baseStages = [
  {
    proj: 'Apex Heights',
    client: 'Apex Realty',
    stageNo: '01',
    stageName: 'Mobilization',
    start: '2025-01-08',
    endPlan: '2025-01-20',
    endActual: '2025-01-18',
    status: 'done',
    deliverable: 'Site setup and base permits',
    approval: 'Approved',
    next: 'Move to excavation',
  },
  {
    proj: 'Orion Tech Park',
    client: 'Orion Infra',
    stageNo: '02',
    stageName: 'Structural',
    start: '2025-02-14',
    endPlan: '2025-04-30',
    endActual: '-',
    status: 'review',
    deliverable: 'Core and slab completion',
    approval: 'In Review',
    next: 'Concrete QC sign-off',
  },
  {
    proj: 'Saffron Logistics Hub',
    client: 'Saffron Group',
    stageNo: '03',
    stageName: 'MEP',
    start: '2025-03-10',
    endPlan: '2025-05-16',
    endActual: '-',
    status: 'progress',
    deliverable: 'Electrical and fire systems',
    approval: 'Pending',
    next: 'Coordination check',
  },
  {
    proj: 'Bluewater Residency',
    client: 'Bluewater Homes',
    stageNo: '01',
    stageName: 'Planning',
    start: '2025-02-01',
    endPlan: '2025-02-22',
    endActual: '2025-02-21',
    status: 'done',
    deliverable: 'Concept and approvals',
    approval: 'Approved',
    next: 'Final layout freeze',
  },
  {
    proj: 'Skyline Mall Expansion',
    client: 'Skyline Retail',
    stageNo: '04',
    stageName: 'Interior',
    start: '2025-04-05',
    endPlan: '2025-06-18',
    endActual: '-',
    status: 'progress',
    deliverable: 'Retail fit-out',
    approval: 'In Review',
    next: 'Vendor finalization',
  },
  {
    proj: 'Greenfield Pharma Unit',
    client: 'Greenfield Labs',
    stageNo: '06',
    stageName: 'As Built',
    start: '2025-03-11',
    endPlan: '2025-05-18',
    endActual: '2025-05-18',
    status: 'done',
    deliverable: 'Handover and docs',
    approval: 'Approved',
    next: 'Archive project',
  },
];

const projectTaskMap = {
  'PRJ-001': [
    {
      id: 'TASK-001-1',
      title: 'Submit structural redline set',
      description: 'Compile the revised structural notes and circulate for client review.',
      assignee: 'Arjun Mehta',
      backupReviewer: 'Priya Iyer',
      dueDate: '2026-06-03',
      priority: 'high',
      status: 'in-progress',
      stage: 'Structural',
    },
    {
      id: 'TASK-001-2',
      title: 'Follow up on client approval',
      description: 'Confirm approval comments and lock the next handoff meeting.',
      assignee: 'Priya Iyer',
      backupReviewer: 'Arjun Mehta',
      dueDate: '2026-06-06',
      priority: 'medium',
      status: 'review',
      stage: 'Structural',
    },
  ],
  'PRJ-002': [
    {
      id: 'TASK-002-1',
      title: 'MEP ducting approval',
      description: 'Resolve utilities alignment and submit the ducting markup.',
      assignee: 'Neha Patil',
      backupReviewer: 'Rahul Singh',
      dueDate: '2026-05-31',
      priority: 'critical',
      status: 'blocked',
      stage: 'MEP',
    },
    {
      id: 'TASK-002-2',
      title: 'Utilities inspection checklist',
      description: 'Prepare the inspection checklist for the site walk-through.',
      assignee: 'Rahul Singh',
      backupReviewer: 'Neha Patil',
      dueDate: '2026-06-04',
      priority: 'high',
      status: 'pending',
      stage: 'MEP',
    },
  ],
  'PRJ-003': [
    {
      id: 'TASK-003-1',
      title: 'Revised handover note',
      description: 'Document the revised delivery sequence and issue to the client.',
      assignee: 'Rahul Singh',
      backupReviewer: 'Sneha Rao',
      dueDate: '2026-06-01',
      priority: 'high',
      status: 'blocked',
      stage: 'Finishing',
    },
    {
      id: 'TASK-003-2',
      title: 'Billing clarification',
      description: 'Validate the final invoice against the last site update.',
      assignee: 'Sneha Rao',
      backupReviewer: 'Rahul Singh',
      dueDate: '2026-06-07',
      priority: 'medium',
      status: 'review',
      stage: 'Finishing',
    },
  ],
  'PRJ-004': [
    {
      id: 'TASK-004-1',
      title: 'Freeze planning layout',
      description: 'Lock the revised plan set and circulate the final draft.',
      assignee: 'Priya Iyer',
      backupReviewer: 'Karan Joshi',
      dueDate: '2026-06-05',
      priority: 'medium',
      status: 'in-progress',
      stage: 'Planning',
    },
    {
      id: 'TASK-004-2',
      title: 'Resolve client note',
      description: 'Answer the outstanding client remark on the revised layout.',
      assignee: 'Karan Joshi',
      backupReviewer: 'Priya Iyer',
      dueDate: '2026-06-09',
      priority: 'low',
      status: 'pending',
      stage: 'Planning',
    },
  ],
  'PRJ-005': [
    {
      id: 'TASK-005-1',
      title: 'Retail elevation approval',
      description: 'Send the latest retail front elevations for sign-off.',
      assignee: 'Karan Joshi',
      backupReviewer: 'Arjun Mehta',
      dueDate: '2026-06-02',
      priority: 'high',
      status: 'review',
      stage: 'Interior',
    },
    {
      id: 'TASK-005-2',
      title: 'Vendor schedule confirmation',
      description: 'Confirm vendor availability and update the interior delivery sequence.',
      assignee: 'Arjun Mehta',
      backupReviewer: 'Karan Joshi',
      dueDate: '2026-06-08',
      priority: 'medium',
      status: 'pending',
      stage: 'Interior',
    },
  ],
  'PRJ-006': [
    {
      id: 'TASK-006-1',
      title: 'Archive as-built set',
      description: 'Store the signed off as-built package and close the record.',
      assignee: 'Sneha Rao',
      backupReviewer: 'Ayesha Khan',
      dueDate: '2026-05-28',
      priority: 'low',
      status: 'done',
      stage: 'As Built',
    },
    {
      id: 'TASK-006-2',
      title: 'Issue closure note',
      description: 'Send the final closure note to the client and finance team.',
      assignee: 'Ayesha Khan',
      backupReviewer: 'Sneha Rao',
      dueDate: '2026-05-30',
      priority: 'low',
      status: 'done',
      stage: 'As Built',
    },
  ],
  'PRJ-007': [
    {
      id: 'TASK-007-1',
      title: 'Foundation permit review',
      description: 'Review remaining permit comments before foundation mobilization.',
      assignee: 'Ishaan Kulkarni',
      backupReviewer: 'Priya Iyer',
      dueDate: '2026-06-04',
      priority: 'medium',
      status: 'in-progress',
      stage: 'Foundation',
    },
    {
      id: 'TASK-007-2',
      title: 'Vendor coordination call',
      description: 'Confirm the next slot for the foundation vendor coordination call.',
      assignee: 'Priya Iyer',
      backupReviewer: 'Ishaan Kulkarni',
      dueDate: '2026-06-10',
      priority: 'low',
      status: 'pending',
      stage: 'Foundation',
    },
  ],
  'PRJ-008': [
    {
      id: 'TASK-008-1',
      title: 'Final handover archive',
      description: 'Validate the archived documents and mark the project complete.',
      assignee: 'Ayesha Khan',
      backupReviewer: 'Sneha Rao',
      dueDate: '2026-05-29',
      priority: 'low',
      status: 'done',
      stage: 'As Built',
    },
    {
      id: 'TASK-008-2',
      title: 'Finance closure confirmation',
      description: 'Confirm that the invoice and retention closeout are complete.',
      assignee: 'Sneha Rao',
      backupReviewer: 'Ayesha Khan',
      dueDate: '2026-05-31',
      priority: 'low',
      status: 'done',
      stage: 'As Built',
    },
  ],
};

function enrichProjects(source = []) {
  return source.map((project) => ({
    ...project,
    tasks: clone(projectTaskMap[project.id] || []),
  }));
}

function flattenTasks(source = projects) {
  return source.flatMap((project) =>
    (project.tasks || []).map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
      projectClient: project.client,
      projectStage: project.stage,
      projectStatus: project.status,
      projectEngineer: project.engineer,
    })),
  );
}

function isTaskOpen(task) {
  return task.status !== 'done';
}

function isTaskOverdue(task) {
  return isTaskOpen(task) && new Date(task.dueDate).getTime() < Date.now();
}

function isTaskDueSoon(task) {
  if (!isTaskOpen(task)) return false;
  const due = new Date(task.dueDate).getTime();
  const diff = due - Date.now();
  return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000;
}

let projects = enrichProjects(baseProjects);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function buildSummary() {
  const totalProjects = projects.length;
  const tasks = flattenTasks(projects);
  const openTasks = tasks.filter(isTaskOpen).length;
  const overdueTasks = tasks.filter(isTaskOverdue).length;
  const dueSoonTasks = tasks.filter(isTaskDueSoon).length;
  const pendingApprovals = projects.filter((item) => item.approval !== 'Approved').length;
  const totalValue = round2(projects.reduce((sum, item) => sum + Number(item.value || 0), 0));

  return {
    totalProjects,
    openTasks,
    overdueTasks,
    dueSoonTasks,
    pendingApprovals,
    totalValue,
  };
}

function buildKpis() {
  const tasks = flattenTasks(projects);
  return [
    { label: 'Active Sites', value: projects.filter((item) => item.status !== 'done').length, note: 'Live delivery locations', tone: 'blue' },
    { label: 'Approvals Waiting', value: projects.filter((item) => item.approval !== 'Approved').length, note: 'Client / internal review', tone: 'amber' },
    { label: 'Revenue Collected', value: `Rs. ${round2(projects.reduce((sum, item) => sum + item.recv, 0)).toFixed(2)}L`, note: 'Invoiced and received', tone: 'emerald' },
    { label: 'High Priority', value: projects.filter((item) => item.priority === 'high' || item.priority === 'critical').length, note: 'Escalation queue', tone: 'rose' },
    { label: 'In Progress', value: projects.filter((item) => item.status === 'progress').length, note: 'Construction and fit-out', tone: 'sky' },
    { label: 'Tasks Due Soon', value: tasks.filter(isTaskDueSoon).length, note: 'Countdown within 48 hours', tone: 'amber' },
    { label: 'Team Load', value: baseTeam.reduce((sum, member) => sum + member.projects, 0), note: 'Assignments across crew', tone: 'blue' },
  ];
}

function buildRevenueSummary() {
  return projects.map((item) => ({
    name: item.name,
    received: round2(item.recv),
    balance: round2(item.balance),
  }));
}

function buildActions() {
  return [
    {
      n: '01',
      proj: 'Orion Tech Park',
      client: 'Orion Infra',
      status: 'In Review',
      pri: 'critical',
      stage: 'MEP',
      action: 'Finalize ducting approval and schedule utilities inspection.',
      resp: 'Neha Patil',
      target: '2025-06-05',
      decision: 'Yes - client sign-off required',
    },
    {
      n: '02',
      proj: 'Saffron Logistics Hub',
      client: 'Saffron Group',
      status: 'On Hold',
      pri: 'high',
      stage: 'Finishing',
      action: 'Clear delayed delivery and confirm revised handover plan.',
      resp: 'Rahul Singh',
      target: '2025-06-07',
      decision: 'Budget extension needed',
    },
    {
      n: '03',
      proj: 'Skyline Mall Expansion',
      client: 'Skyline Retail',
      status: 'In Progress',
      pri: 'medium',
      stage: 'Interior',
      action: 'Approve retail front elevations and vendor schedule.',
      resp: 'Karan Joshi',
      target: '2025-06-10',
      decision: 'Interior package review',
    },
    {
      n: '04',
      proj: 'Bluewater Residency',
      client: 'Bluewater Homes',
      status: 'Completed',
      pri: 'low',
      stage: 'Planning',
      action: 'Archive approved concept drawings and close planning file.',
      resp: 'Priya Iyer',
      target: '2025-06-03',
      decision: 'No action required',
    },
  ];
}

function buildTaskQueue() {
  return flattenTasks(projects)
    .filter(isTaskOpen)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((task) => ({
      ...task,
      overdue: isTaskOverdue(task),
      dueSoon: isTaskDueSoon(task),
    }));
}

function buildReports() {
  const totalProjects = projects.length;
  const received = round2(projects.reduce((sum, item) => sum + Number(item.recv || 0), 0));
  const balance = round2(projects.reduce((sum, item) => sum + Number(item.balance || 0), 0));
  const tasks = flattenTasks(projects);

  const byStatus = projects.reduce((acc, item) => {
    const key =
      item.status === 'done'
        ? 'Completed'
        : item.status === 'hold'
          ? 'On Hold'
          : item.status === 'cancelled'
            ? 'Cancelled'
            : 'In Progress';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byPriority = projects.reduce((acc, item) => {
    const key = item.priority === 'critical' ? 'Critical' : item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byTaskStatus = tasks.reduce((acc, task) => {
    const key = task.status === 'done' ? 'Completed' : task.status === 'blocked' ? 'Blocked' : task.status === 'review' ? 'In Review' : task.status === 'in-progress' ? 'In Progress' : 'Pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalProjects,
    billing: { received, balance },
    byStatus,
    byPriority,
    byTaskStatus,
  };
}

function buildDashboard() {
  const tasks = buildTaskQueue();
  return {
    summary: buildSummary(),
    kpis: buildKpis(),
    projects: clone(projects),
    revenueSummary: buildRevenueSummary(),
    team: clone(baseTeam),
    actions: buildActions(),
    stages: clone(baseStages),
    tasks: {
      items: clone(tasks),
      summary: {
        open: tasks.length,
        overdue: tasks.filter((task) => task.overdue).length,
        dueSoon: tasks.filter((task) => task.dueSoon).length,
      },
    },
  };
}

function makeProject(payload) {
  const value = Number(payload.value || 0);
  const recv = round2(value * 0.25);
  const balance = round2(value - recv);
  const title = payload.name?.trim() || 'New Project';
  const type = payload.type?.trim() || 'Residential';
  const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const engineer = payload.engineer?.trim() || 'Unassigned';

  return {
    id: `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
    name: title,
    client: payload.client?.trim() || 'New Client',
    type,
    typeShort: type.slice(0, 3).toUpperCase(),
    location: payload.location?.trim() || 'TBD',
    start: '2025-06-01',
    end: '2025-12-31',
    value,
    stage: 'Planning',
    status: 'progress',
    priority: payload.priority || 'high',
    completion: 12,
    engineer,
    approval: 'Pending',
    recv,
    balance,
    billing: 'Draft',
    tasks: [
      {
        id: `TASK-${String(projects.length + 1).padStart(3, '0')}-1`,
        title: 'Project kickoff and scope review',
        description: 'Confirm deliverables, owners, and the first approval checkpoint.',
        assignee: engineer,
        backupReviewer: 'Unassigned',
        dueDate,
        priority: payload.priority || 'high',
        status: 'pending',
        stage: 'Planning',
      },
    ],
  };
}

export async function fetchDashboard() {
  return buildDashboard();
}

export async function fetchProjects() {
  return clone(projects);
}

export async function createProject(payload) {
  const project = makeProject(payload);
  projects = [project, ...projects];
  return clone(project);
}

export async function updateProject(id, payload) {
  projects = projects.map((item) =>
    item.id === id
      ? {
          ...item,
          ...payload,
          tasks: Array.isArray(payload.tasks) ? clone(payload.tasks) : item.tasks || [],
        }
      : item,
  );
  const updated = projects.find((item) => item.id === id);
  return clone(updated);
}

export async function fetchActions() {
  return buildActions();
}

export async function fetchTeam() {
  return clone(baseTeam);
}

export async function fetchStages() {
  return clone(baseStages);
}

export async function fetchReports() {
  return buildReports();
}
