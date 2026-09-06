import { useMemo } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { Avatar } from './ui.jsx';

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const STATUS_RANK = { Todo: 0, 'In Progress': 1, Review: 2, Done: 3 };

const STATUS_TAG_COLOR = {
  Todo: 'default',
  'In Progress': 'processing',
  Review: 'warning',
  Done: 'success',
};

const PRIORITY_TAG_COLOR = {
  High: 'error',
  Medium: 'warning',
  Low: 'default',
};

export default function TaskListView({ tasks, onOpenTask }) {
  const columns = useMemo(
    () => [
      {
        title: 'Task',
        dataIndex: 'title',
        key: 'title',
        sorter: (a, b) => a.title.localeCompare(b.title),
        render: (text, record) => (
          <div className="max-w-[320px]">
            <p className="truncate font-medium text-slate-800">{text}</p>
            {record.comments?.length > 0 && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
                <MessageSquare className="h-3 w-3" /> {record.comments.length}
              </span>
            )}
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        sorter: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
        render: (status) => (
          <Tag color={STATUS_TAG_COLOR[status] || 'default'} className="!mr-0">
            {status}
          </Tag>
        ),
      },
      {
        title: 'Priority',
        dataIndex: 'priority',
        key: 'priority',
        width: 120,
        sorter: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
        render: (priority) => (
          <Tag color={PRIORITY_TAG_COLOR[priority] || 'default'} className="!mr-0">
            {priority}
          </Tag>
        ),
      },
      {
        title: 'Assignee',
        dataIndex: 'assigneeId',
        key: 'assignee',
        width: 180,
        sorter: (a, b) => (a.assigneeId?.name || '~').localeCompare(b.assigneeId?.name || '~'),
        render: (assignee) =>
          assignee ? (
            <div className="flex items-center gap-2">
              <Avatar user={assignee} size="h-6 w-6 text-[10px]" />
              <span className="truncate text-xs text-slate-700">{assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Unassigned</span>
          ),
      },
      {
        title: 'Due date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 150,
        defaultSortOrder: 'ascend',
        sorter: (a, b) => {
          const va = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const vb = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return va - vb;
        },
        render: (dueDate, record) => {
          if (!dueDate) return <span className="text-xs text-slate-400">—</span>;
          const isOverdue = new Date(dueDate) < new Date() && record.status !== 'Done';
          return (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                isOverdue ? 'font-medium text-rose-600' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          );
        },
      },
      {
        title: 'Subtasks',
        key: 'subtasks',
        width: 110,
        render: (_, record) => {
          const total = record.subtasks?.length || 0;
          if (!total) return <span className="text-xs text-slate-400">—</span>;
          const done = record.subtasks.filter((s) => s.isCompleted).length;
          return (
            <span className="text-xs text-slate-600">
              {done}/{total}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="scroll-thin h-full overflow-auto p-4">
      <div className="min-w-[720px] rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={tasks}
          pagination={false}
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            onClick: () => onOpenTask(record._id),
            className: 'cursor-pointer hover:bg-brand-50/40 transition',
          })}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-slate-400">
                No tasks match the current filters.
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}