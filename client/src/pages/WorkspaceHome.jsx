import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2, FolderKanban } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Progress, Empty, Spin } from 'antd';

export default function WorkspaceHome() {
  const { workspace, projectsQuery } = useOutletContext();

  if (!workspace) return <Navigate to="/" replace />;

  const projects = projectsQuery.data || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-bold">Projects in {workspace.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Pick a project to open its board.</p>

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : projects.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const taskCount = p.taskCount || 0;
            const doneCount = p.doneCount || 0;
            const percent = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

            return (
              <Link
                key={p._id}
                to={`/w/${workspace.slug}/p/${p._id}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${p.color}1a`, color: p.color }}
                  >
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold group-hover:text-brand-700">{p.name}</h2>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {p.description || 'No description'}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {doneCount}/{taskCount} done
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress
                    percent={percent}
                    size="small"
                    strokeColor={p.color || '#10b981'}
                    showInfo={false}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <Empty
            description={
              <div>
                <p className="font-medium text-slate-700">No projects yet</p>
                <p className="text-sm text-slate-500">
                  Use the + in the sidebar to create your first project.
                </p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}