import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '../api/dashboard';
import { KanbanBoardCard } from '../components/dashboard/Widgets';

export function KanbanPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-green p-5 sm:p-6">
        <p className="hero-kicker">Kanban</p>
        <h1 className="hero-title">Drag and drop stage board</h1>
        <p className="hero-subtitle max-w-3xl">
          This view is wired with <span className="font-semibold">@dnd-kit/core</span> and keeps each
          column responsive with horizontal scrolling on smaller screens.
        </p>
      </section>
      <KanbanBoardCard projects={projects} />
    </div>
  );
}
