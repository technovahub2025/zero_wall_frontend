import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  ChevronRight,
  FolderKanban,
  Mail,
  ListTodo,
  Plus,
  Search,
  UserPlus,
  Trash2,
  Users,
  PencilLine,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pageVariants } from '../utils/motionVariants';
import { useTeams, useCreateTeam, useDeleteTeam, useUpdateTeam } from '../hooks/useTeams';
import { useInviteMember, usePendingInvites, useRevokeInvite, useResendInvite, useTeamMembers } from '../hooks/useTeam';
import { useProjects } from '../hooks/useProjects';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { ModalShell } from '../components/shared/ModalShell';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { DropdownField } from '../components/shared/DropdownField';
import { KanbanActionsMenu } from '../components/kanban/KanbanActionsMenu';
import { TeamForm } from '../components/teams/TeamForm';
import { Badge as StatusBadge } from '../components/ui/badge';

const emptyInviteForm = {
  name: '',
  email: '',
  role: 'employee',
  designation: '',
  department: '',
  phone: '',
  projectIds: [],
  sendInvite: true,
};

export default function TeamsPage() {
  const navigate = useNavigate();
  const teamsQuery = useTeams();
  const membersQuery = useTeamMembers();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const openConfirm = useUiStore((state) => state.openConfirm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingInvitesOpen, setPendingInvitesOpen] = useState(false);
  const [manageProjectsTeam, setManageProjectsTeam] = useState(null);
  const [manageProjectsSelection, setManageProjectsSelection] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const inviteMember = useInviteMember();
  const pendingInvitesQuery = usePendingInvites({ enabled: pendingInvitesOpen });
  const resendInvite = useResendInvite();
  const revokeInvite = useRevokeInvite();
  const projectsQuery = useProjects({ limit: 100 }, { enabled: inviteOpen || Boolean(manageProjectsTeam) });

  const teams = teamsQuery.data || [];
  const rosterMembers = membersQuery.data || [];
  const projects = projectsQuery.data || [];
  const selectedInviteEmployee = useMemo(
    () => rosterMembers.find((member) => String(member.id) === String(selectedEmployeeId)) || null,
    [rosterMembers, selectedEmployeeId],
  );

  const employeeOptions = useMemo(
    () =>
      rosterMembers.map((member) => ({
        value: member.id,
        label: [
          member.name,
          member.employeeId ? `(${member.employeeId})` : '',
          member.department ? `• ${member.department}` : '',
          member.role ? `• ${member.role}` : '',
        ]
          .filter(Boolean)
          .join(' '),
      })),
    [rosterMembers],
  );

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: [project.projectName, project.clientName ? `• ${project.clientName}` : '', project.status ? `• ${project.status}` : '']
          .filter(Boolean)
          .join(' '),
      })),
    [projects],
  );

  const stats = useMemo(() => {
    const activeTeams = teams.filter((team) => team.isActive !== false);
    const totalMembers = teams.reduce((sum, team) => sum + Number(team.memberCount || 0), 0);
    const totalTasks = teams.reduce((sum, team) => sum + Number(team.taskCount || 0), 0);
    return [
      { label: 'Teams', value: teams.length, hint: 'Created groups', tone: 'blue' },
      { label: 'Active', value: activeTeams.length, hint: 'Enabled teams', tone: 'emerald' },
      { label: 'Members', value: totalMembers, hint: 'Across all teams', tone: 'amber' },
      { label: 'Tasks', value: totalTasks, hint: 'Team workload', tone: 'rose' },
    ];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return teams.filter((team) => {
      if (statusFilter === 'active' && team.isActive === false) return false;
      if (statusFilter === 'inactive' && team.isActive !== false) return false;
      if (!needle) return true;

      const haystack = [
        team.name,
        team.description,
        ...(Array.isArray(team.members)
          ? team.members.flatMap((member) => [member?.name, member?.role, member?.department])
          : []),
        ...(Array.isArray(team.currentProjects)
          ? team.currentProjects.flatMap((project) => [project?.projectName, project?.clientName])
          : []),
        ...(Array.isArray(team.currentTasks)
          ? team.currentTasks.flatMap((task) => [task?.title, task?.projectName])
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [search, statusFilter, teams]);

  const selectedTeam = useMemo(() => {
    if (!filteredTeams.length) return null;
    return filteredTeams.find((team) => String(team.id) === String(selectedTeamId)) || filteredTeams[0];
  }, [filteredTeams, selectedTeamId]);

  useEffect(() => {
    if (!filteredTeams.length) {
      if (selectedTeamId) setSelectedTeamId('');
      return;
    }

    const selectedExists = filteredTeams.some((team) => String(team.id) === String(selectedTeamId));
    if (!selectedExists) {
      setSelectedTeamId(filteredTeams[0].id);
    }
  }, [filteredTeams, selectedTeamId]);

  useEffect(() => {
    if (inviteOpen) return;
    setSelectedEmployeeId('');
    setInviteForm(emptyInviteForm);
  }, [inviteOpen]);

  useEffect(() => {
    if (!selectedInviteEmployee) return;

    setInviteForm((current) => ({
      ...current,
      name: selectedInviteEmployee.name || current.name,
      email: selectedInviteEmployee.email || current.email,
      role: selectedInviteEmployee.role || current.role,
      designation: selectedInviteEmployee.designation || current.designation,
      department: selectedInviteEmployee.department || current.department,
      phone: selectedInviteEmployee.phone || current.phone,
      sendInvite: false,
    }));
  }, [selectedInviteEmployee]);

  function openTeamModal(team = null) {
    setEditingTeam(team);
    setTeamModalOpen(true);
  }

  function openManageProjects(team) {
    setManageProjectsTeam(team);
    setManageProjectsSelection(
      Array.isArray(team?.projectIds)
        ? team.projectIds
            .map((project) => String(project?.id || project?._id || project))
            .filter(Boolean)
        : [],
    );
  }

  async function handleSaveTeam(values) {
    const payload = {
      name: values.name?.trim(),
      description: values.description || '',
      color: values.color || '#3b82f6',
      members: Array.isArray(values.members) ? values.members : [],
      isActive: Boolean(values.isActive),
    };

    if (editingTeam?.id) {
      await updateTeam.mutateAsync({ id: editingTeam.id, payload });
    } else {
      await createTeam.mutateAsync(payload);
    }

    setTeamModalOpen(false);
    setEditingTeam(null);
  }

  function handleDeleteTeam(team) {
    openConfirm({
      title: 'Delete team',
      message: `Delete ${team.name}? Tasks assigned to it will keep their records, but the team link will be removed.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteTeam.mutateAsync(team.id);
      },
    });
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    const payload = {
      name: String(inviteForm.name || '').trim(),
      email: String(inviteForm.email || '').trim(),
      role: String(inviteForm.role || 'employee'),
      designation: String(inviteForm.designation || '').trim(),
      department: String(inviteForm.department || '').trim(),
      phone: String(inviteForm.phone || '').trim(),
      projectIds: Array.isArray(inviteForm.projectIds) ? inviteForm.projectIds : [],
      sendInvite: Boolean(inviteForm.sendInvite),
    };

    await inviteMember.mutateAsync(payload);
    setInviteOpen(false);
    setInviteForm(emptyInviteForm);
    setSelectedEmployeeId('');
  }

  async function handleManageProjectsSubmit(event) {
    event.preventDefault();
    if (!manageProjectsTeam?.id) return;

    await updateTeam.mutateAsync({
      id: manageProjectsTeam.id,
      payload: {
        projectIds: Array.isArray(manageProjectsSelection) ? manageProjectsSelection : [],
      },
    });

    setManageProjectsTeam(null);
    setManageProjectsSelection([]);
  }

  function handleRevokePending(invite) {
    openConfirm({
      title: 'Revoke invite',
      message: `Revoke the invitation for ${invite.name || invite.email}?`,
      confirmLabel: 'Revoke',
      tone: 'rose',
      onConfirm: async () => {
        await revokeInvite.mutateAsync(invite.id);
      },
    });
  }

  if (teamsQuery.isLoading || membersQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (teamsQuery.isError || membersQuery.isError) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-10">
          <Search className="h-5 w-5 text-rose-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">
              {teamsQuery.error?.message || membersQuery.error?.message || 'Failed to load teams'}
            </div>
            <div className="text-xs text-slate-500">Try again after a moment.</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Teams</p>
            <h1 className="hero-title">Team structure and workload</h1>
            <p className="hero-subtitle max-w-3xl">
              Create teams, add members, and see which projects and tasks each team is currently handling.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
            <Button variant="secondary" onClick={() => setPendingInvitesOpen(true)}>
              <Mail className="h-4 w-4" />
              Pending Invites
            </Button>
            <Button onClick={() => openTeamModal()}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500">{stat.hint}</div>
              </div>
              <StatusBadge tone={stat.tone}>{stat.label}</StatusBadge>
            </CardBody>
          </Card>
        ))}
      </section>

      <Card>
        <CardBody className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams, members, projects, tasks..."
            />
            <FilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </div>

          {!filteredTeams.length ? (
            <EmptyState
              title="No teams found"
              description="Create a team to group members, tasks, and projects together."
              action={
                <Button onClick={() => openTeamModal()}>
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:h-[calc(100vh-28rem)] xl:min-h-[42rem] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:overflow-hidden">
              <section className="rounded-[28px] border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm xl:flex xl:min-h-0 xl:flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.12)] pb-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Team list</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Showing {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
                    </div>
                  </div>
                  <StatusBadge tone="slate">
                    <Users className="h-3.5 w-3.5" />
                    {teams.length} total
                  </StatusBadge>
                </div>

                <div className="mt-4 space-y-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
                  {filteredTeams.map((team) => {
                    const isSelected = String(team.id) === String(selectedTeam?.id);
                    return (
                      <div
                        key={team.id}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? 'border-sky-200 bg-sky-50/80 shadow-sm'
                            : 'border-[rgb(var(--line)/0.12)] bg-white/75 hover:border-sky-200 hover:bg-sky-50/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTeamId(team.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: team.color || '#3b82f6' }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold text-[rgb(var(--text))]">{team.name}</span>
                              <StatusBadge tone={team.isActive === false ? 'rose' : 'green'}>
                                {team.isActive === false ? 'Inactive' : 'Active'}
                              </StatusBadge>
                              <StatusBadge tone="slate">{team.memberCount || 0} members</StatusBadge>
                              <StatusBadge tone="blue">{team.projectCount || 0} projects</StatusBadge>
                              <StatusBadge tone="amber">{team.taskCount || 0} tasks</StatusBadge>
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">{team.description || 'No description set'}</div>
                          </div>
                        </button>
                        <div className="shrink-0">
                          <KanbanActionsMenu
                            items={[
                              {
                                key: 'projects',
                                label: 'Manage projects',
                                icon: FolderKanban,
                                onClick: () => openManageProjects(team),
                              },
                              {
                                key: 'edit',
                                label: 'Edit team',
                                icon: PencilLine,
                                onClick: () => openTeamModal(team),
                              },
                              {
                                key: 'delete',
                                label: 'Delete team',
                                icon: Trash2,
                                tone: 'danger',
                                onClick: () => handleDeleteTeam(team),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-[rgb(var(--line)/0.14)] bg-white/80 p-4 shadow-sm xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
                {selectedTeam ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--line)/0.12)] pb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: selectedTeam.color || '#3b82f6' }} />
                          <h2 className="truncate text-xl font-semibold text-[rgb(var(--text))]">{selectedTeam.name}</h2>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{selectedTeam.description || 'No description set'}</p>
                      </div>
                      <KanbanActionsMenu
                        items={[
                          {
                            key: 'projects',
                            label: 'Manage projects',
                            icon: FolderKanban,
                            onClick: () => openManageProjects(selectedTeam),
                          },
                          {
                            key: 'edit',
                            label: 'Edit team',
                            icon: PencilLine,
                            onClick: () => openTeamModal(selectedTeam),
                          },
                          {
                            key: 'delete',
                            label: 'Delete team',
                            icon: Trash2,
                            tone: 'danger',
                            onClick: () => handleDeleteTeam(selectedTeam),
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusBadge tone={selectedTeam.isActive === false ? 'rose' : 'green'}>
                        {selectedTeam.isActive === false ? 'Inactive' : 'Active'}
                      </StatusBadge>
                      <StatusBadge tone="slate">
                        <Users className="h-3.5 w-3.5" />
                        {selectedTeam.memberCount || 0} members
                      </StatusBadge>
                      <StatusBadge tone="blue">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {selectedTeam.projectCount || 0} projects
                      </StatusBadge>
                      <StatusBadge tone="amber">
                        <ListTodo className="h-3.5 w-3.5" />
                        {selectedTeam.taskCount || 0} tasks
                      </StatusBadge>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
                      <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Members</div>
                            <div className="text-xs text-slate-500">People working in this team</div>
                          </div>
                          <StatusBadge tone="slate">{(selectedTeam.members || []).length}</StatusBadge>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:flex-1">
                          {(selectedTeam.members || []).map((member) => (
                            <div
                              key={member.id || member._id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/80 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{member.name || 'Member'}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{member.designation || 'Staff'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{member.department || 'Unassigned'}</span>
                                </div>
                              </div>
                              <StatusBadge tone={member.role === 'admin' ? 'amber' : member.role === 'project_manager' ? 'blue' : 'slate'}>
                                {member.role || 'employee'}
                              </StatusBadge>
                            </div>
                          ))}
                          {!selectedTeam.members?.length ? (
                            <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] p-4 text-sm text-slate-500">
                              No members added.
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-3 xl:min-h-0 xl:overflow-hidden">
                        <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Current projects</div>
                              <div className="text-xs text-slate-500">Projects currently linked to this team</div>
                            </div>
                            <StatusBadge tone="blue">{(selectedTeam.currentProjects || []).length}</StatusBadge>
                          </div>
                          <div className="max-h-52 space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:flex-1">
                            {(selectedTeam.currentProjects || []).map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/80 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
                                onClick={() => navigate(`/projects/${project.id}`)}
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{project.projectName}</div>
                                  <div className="mt-1 truncate text-xs text-slate-500">{project.clientName || 'Client not set'}</div>
                                </div>
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              </button>
                            ))}
                            {!selectedTeam.currentProjects?.length ? (
                              <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] p-4 text-sm text-slate-500">
                                No linked projects.
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Current tasks</div>
                              <div className="text-xs text-slate-500">Tasks currently assigned to this team</div>
                            </div>
                            <StatusBadge tone="amber">{(selectedTeam.currentTasks || []).length}</StatusBadge>
                          </div>
                          <div className="max-h-52 space-y-2 overflow-y-auto pr-1 xl:min-h-0 xl:flex-1">
                            {(selectedTeam.currentTasks || []).map((task) => (
                              <div key={task.id} className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/80 px-3 py-2">
                                <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{task.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{task.projectName || 'Project'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{task.status || 'todo'}</span>
                                </div>
                              </div>
                            ))}
                            {!selectedTeam.currentTasks?.length ? (
                              <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] p-4 text-sm text-slate-500">
                                No current tasks.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No team selected"
                    description="Pick a team from the list to inspect its members, projects, and workload."
                  />
                )}
              </section>
            </div>
          )}
        </CardBody>
      </Card>

      {teamModalOpen ? (
        <ModalShell
          title={editingTeam?.id ? 'Edit Team' : 'Create Team'}
          description="Group members and track their work together."
          onClose={() => {
            setTeamModalOpen(false);
            setEditingTeam(null);
          }}
          widthClassName="max-w-4xl"
        >
          <TeamForm
            initialValues={editingTeam}
            members={rosterMembers}
            onSubmit={handleSaveTeam}
            onCancel={() => {
              setTeamModalOpen(false);
              setEditingTeam(null);
            }}
          />
        </ModalShell>
      ) : null}

      {inviteOpen ? (
        <ModalShell
          title="Invite Member"
          description="Pick an existing employee or enter a new member to add to the roster."
          onClose={() => setInviteOpen(false)}
          widthClassName="max-w-3xl"
        >
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleInviteSubmit}>
            <DropdownField
              label="Select employee"
              value={selectedEmployeeId}
              onChange={(nextValue) => {
                setSelectedEmployeeId(nextValue);
                if (!nextValue) {
                  setInviteForm(emptyInviteForm);
                  return;
                }

                const member = rosterMembers.find((item) => String(item.id) === String(nextValue));
                if (!member) return;

                setInviteForm({
                  name: member.name || '',
                  email: member.email || '',
                  role: member.role || 'employee',
                  designation: member.designation || '',
                  department: member.department || '',
                  phone: member.phone || '',
                  sendInvite: false,
                });
              }}
              options={employeeOptions}
              placeholder="Select from employees"
              selectedLabel={selectedInviteEmployee ? `${selectedInviteEmployee.name || 'Employee'}${selectedInviteEmployee.employeeId ? ` • ${selectedInviteEmployee.employeeId}` : ''}` : 'Select from employees'}
              emptyValue=""
              searchable
              searchPlaceholder="Search employees..."
              className="sm:col-span-2"
            />
            <DropdownField
              label="Projects"
              value={inviteForm.projectIds}
              onChange={(nextValue) =>
                setInviteForm((current) => ({
                  ...current,
                  projectIds: Array.isArray(nextValue) ? nextValue : [],
                }))
              }
              options={projectOptions}
              placeholder="Select projects"
              selectedLabel={
                Array.isArray(inviteForm.projectIds) && inviteForm.projectIds.length
                  ? `${inviteForm.projectIds.length} projects selected`
                  : 'Select projects'
              }
              emptyValue=""
              multiple
              searchable
              searchPlaceholder="Search projects..."
              className="sm:col-span-2"
            />
            <Field label="Name">
              <input
                className="input"
                placeholder="Member name"
                value={inviteForm.name}
                onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                placeholder="member@company.com"
                required
                value={inviteForm.email}
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>
            <Field label="Role">
              <select
                className="input"
                value={inviteForm.role}
                onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="employee">Employee</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Department">
              <input
                className="input"
                placeholder="Structural, Electrical..."
                value={inviteForm.department}
                onChange={(event) => setInviteForm((current) => ({ ...current, department: event.target.value }))}
              />
            </Field>
            <Field label="Designation">
              <input
                className="input"
                placeholder="Engineer, Lead..."
                value={inviteForm.designation}
                onChange={(event) => setInviteForm((current) => ({ ...current, designation: event.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                placeholder="+91-..."
                value={inviteForm.phone}
                onChange={(event) => setInviteForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/70 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={inviteForm.sendInvite}
                onChange={(event) => setInviteForm((current) => ({ ...current, sendInvite: event.target.checked }))}
              />
              <span className="text-sm font-semibold text-[rgb(var(--text))]">Send invite email</span>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? 'Saving...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {pendingInvitesOpen ? (
        <ModalShell
          title="Pending Invites"
          description="Review outstanding invitations and take action."
          onClose={() => setPendingInvitesOpen(false)}
          widthClassName="max-w-4xl"
        >
          <div className="space-y-4">
            {pendingInvitesQuery.isLoading ? <SkeletonCard /> : null}

            {pendingInvitesQuery.isError ? (
              <Card>
                <CardBody className="flex items-center gap-3 py-8">
                  <Search className="h-5 w-5 text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">
                      {pendingInvitesQuery.error?.message || 'Failed to load pending invites'}
                    </div>
                    <div className="text-xs text-slate-500">Try again after a moment.</div>
                  </div>
                </CardBody>
              </Card>
            ) : null}

            {!pendingInvitesQuery.isLoading && !pendingInvitesQuery.isError ? (
              <div className="max-h-[60vh] overflow-y-auto rounded-[24px] border border-[rgb(var(--line)/0.14)] bg-white/75">
                {(pendingInvitesQuery.data || []).length ? (
                  <div className="divide-y divide-[rgb(var(--line)/0.12)]">
                    {(pendingInvitesQuery.data || []).map((invite) => (
                      <div key={invite.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{invite.name || 'Invitation'}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{invite.email}</div>
                          <div className="mt-2">
                            <StatusBadge tone="slate">{invite.role || 'employee'}</StatusBadge>
                          </div>
                        </div>
                        <KanbanActionsMenu
                          items={[
                            {
                              key: 'resend',
                              label: 'Resend invite',
                              icon: Mail,
                              onClick: () => resendInvite.mutate(invite.id),
                            },
                            {
                              key: 'revoke',
                              label: 'Revoke invite',
                              icon: Trash2,
                              tone: 'danger',
                              onClick: () => handleRevokePending(invite),
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-sm text-slate-500">No pending invites.</div>
                )}
              </div>
            ) : null}
          </div>
        </ModalShell>
      ) : null}

      {manageProjectsTeam ? (
        <ModalShell
          title="Manage Projects"
          description={`Link projects to ${manageProjectsTeam.name}.`}
          onClose={() => {
            setManageProjectsTeam(null);
            setManageProjectsSelection([]);
          }}
          widthClassName="max-w-3xl"
        >
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleManageProjectsSubmit}>
            <div className="sm:col-span-2 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Team</div>
                  <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{manageProjectsTeam.name}</div>
                </div>
                <StatusBadge tone={manageProjectsTeam.isActive === false ? 'rose' : 'green'}>
                  {manageProjectsTeam.isActive === false ? 'Inactive' : 'Active'}
                </StatusBadge>
              </div>
            </div>

            <DropdownField
              label="Projects"
              value={manageProjectsSelection}
              onChange={(nextValue) => setManageProjectsSelection(Array.isArray(nextValue) ? nextValue : [])}
              options={projectOptions}
              placeholder="Select projects"
              selectedLabel={
                Array.isArray(manageProjectsSelection) && manageProjectsSelection.length
                  ? `${manageProjectsSelection.length} projects selected`
                  : 'Select projects'
              }
              emptyValue=""
              multiple
              searchable
              searchPlaceholder="Search projects..."
              className="sm:col-span-2"
            />

            <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setManageProjectsTeam(null);
                  setManageProjectsSelection([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeam.isPending}>
                {updateTeam.isPending ? 'Saving...' : 'Save Projects'}
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
