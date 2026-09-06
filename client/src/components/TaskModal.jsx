import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, FileText, History, Plus, Send, Trash2, Upload } from 'lucide-react';
import { Modal, Select, DatePicker, Input, Checkbox, Tabs, Tag, Button, Popconfirm, Alert, Spin } from 'antd';
import dayjs from 'dayjs';
import api, { apiError } from '../api/client.js';
import { Avatar } from './ui.jsx';

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

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

export default function TaskModal({ taskId, projectId, members, onClose, onDeleted }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [error, setError] = useState('');

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then((r) => r.data.task),
    enabled: !!taskId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  const update = useMutation({
    mutationFn: (body) => api.patch(`/tasks/${taskId}`, body),
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err)),
  });

  const removeTask = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: onDeleted,
    onError: (err) => setError(apiError(err)),
  });

  const subtask = useMutation({
    mutationFn: ({ action, subtaskId, body }) => {
      if (action === 'add') return api.post(`/tasks/${taskId}/subtasks`, body);
      if (action === 'toggle') return api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, body);
      return api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    },
    onSuccess: invalidate,
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { body: comment }),
    onSuccess: () => {
      setComment('');
      invalidate();
    },
    onError: (err) => setError(apiError(err)),
  });

  const uploadFile = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post(`/tasks/${taskId}/attachments`, fd);
    },
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err)),
  });

  const removeAttachment = useMutation({
    mutationFn: (attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    onSuccess: invalidate,
  });

  if (!taskId) return null;
  const task = taskQuery.data;

  if (!task) {
    return (
      <Modal open onCancel={onClose} title="Task" footer={null}>
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  const doneSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;

  return (
    <Modal
      open
      onCancel={onClose}
      title={<span className="text-base font-semibold text-slate-800">{task.title}</span>}
      width={780}
      footer={null}
      destroyOnClose
    >
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_260px]">
        {/* Left column */}
        <div>
          <Section title="Properties">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Status</label>
                <Select
                  value={task.status}
                  onChange={(val) => update.mutate({ status: val })}
                  className="w-full"
                  options={[
                    { value: 'Todo', label: 'Todo' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Review', label: 'Review' },
                    { value: 'Done', label: 'Done' },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">Priority</label>
                <Select
                  value={task.priority}
                  onChange={(val) => update.mutate({ priority: val })}
                  className="w-full"
                  options={[
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">Assignee</label>
                <Select
                  value={task.assigneeId?._id || ''}
                  onChange={(val) => update.mutate({ assigneeId: val || null })}
                  className="w-full"
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...(members || []).map((m) => ({
                      value: m.userId._id,
                      label: m.userId.name,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">Due date</label>
                <DatePicker
                  value={task.dueDate ? dayjs(task.dueDate) : null}
                  onChange={(date) => update.mutate({ dueDate: date ? date.format('YYYY-MM-DD') : null })}
                  className="w-full"
                  format="YYYY-MM-DD"
                />
              </div>
            </div>
          </Section>

          <Section title="Description">
            <Input.TextArea
              defaultValue={task.description}
              rows={3}
              placeholder="Add a description…"
              onBlur={(e) =>
                e.target.value !== task.description && update.mutate({ description: e.target.value })
              }
            />
          </Section>

          <Section title={`Subtasks (${doneSubtasks}/${task.subtasks?.length || 0})`}>
            <div className="space-y-1">
              {task.subtasks?.map((s) => (
                <div key={s._id} className="group flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-slate-50">
                  <Checkbox
                    checked={s.isCompleted}
                    onChange={(e) =>
                      subtask.mutate({
                        action: 'toggle',
                        subtaskId: s._id,
                        body: { isCompleted: e.target.checked },
                      })
                    }
                  />
                  <span className={`flex-1 text-sm ${s.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {s.title}
                  </span>
                  <Popconfirm
                    title="Delete subtask?"
                    onConfirm={() => subtask.mutate({ action: 'delete', subtaskId: s._id })}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      type="button"
                      className="hidden rounded p-1 text-slate-300 hover:text-rose-500 group-hover:block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Popconfirm>
                </div>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!subtaskTitle.trim()) return;
                  subtask.mutate({ action: 'add', body: { title: subtaskTitle } });
                  setSubtaskTitle('');
                }}
                className="flex gap-2 pt-2"
              >
                <Input
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask…"
                  className="flex-1"
                />
                <Button
                  type="default"
                  htmlType="submit"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={!subtaskTitle.trim()}
                />
              </form>
            </div>
          </Section>

          {/* AntD Tabs for Comments & Activity */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'comments',
                label: `Comments (${task.comments?.length || 0})`,
                children: (
                  <div>
                    <div className="mb-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {task.comments?.length === 0 && (
                        <p className="py-2 text-xs text-slate-400">No comments yet.</p>
                      )}
                      {task.comments?.map((c) => (
                        <div key={c._id} className="flex gap-2.5">
                          <Avatar user={c.authorId} />
                          <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-700">
                              {c.authorId?.name}{' '}
                              <span className="ml-1 font-normal text-slate-400">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                              {c.edited && <span className="ml-1 text-[10px] text-slate-400">(edited)</span>}
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">{c.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!comment.trim()) return;
                        addComment.mutate();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment…"
                        className="flex-1"
                      />
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={addComment.isPending}
                        icon={<Send className="h-4 w-4" />}
                        className="bg-brand-600 hover:!bg-brand-700"
                        disabled={!comment.trim()}
                      />
                    </form>
                  </div>
                ),
              },
              {
                key: 'activity',
                label: `Activity (${task.activityLog?.length || 0})`,
                children: (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {task.activityLog?.length === 0 && (
                      <p className="py-2 text-xs text-slate-400">No activity yet.</p>
                    )}
                    {[...(task.activityLog || [])].reverse().map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <History className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        <b className="font-semibold text-slate-700">{a.actorId?.name || 'Someone'}</b>
                        <span>{a.action.replace(/_/g, ' ')}</span>
                        {a.meta?.from && a.meta?.to && (
                          <span className="text-slate-400">
                            ({String(a.meta.from).slice(0, 30)} → {String(a.meta.to).slice(0, 30)})
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-slate-300">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Right column */}
        <div>
          <Section title="Badges">
            <div className="flex flex-wrap gap-1">
              <Tag color={STATUS_TAG_COLOR[task.status] || 'default'}>{task.status}</Tag>
              <Tag color={PRIORITY_TAG_COLOR[task.priority] || 'default'}>{task.priority}</Tag>
              {task.dueDate && (
                <Tag className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </Tag>
              )}
            </div>
          </Section>

          <Section title="Attachments">
            <div className="space-y-1.5">
              {task.attachments?.map((a) => (
                <div key={a._id} className="group flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-xs text-brand-600 hover:underline"
                  >
                    {a.filename}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment.mutate(a._id)}
                    className="hidden text-slate-300 hover:text-rose-500 group-hover:block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-500 transition hover:border-brand-400 hover:text-brand-600">
                <Upload className="h-3.5 w-3.5" />
                {uploadFile.isPending ? 'Uploading…' : 'Upload file (10MB max)'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile.mutate(e.target.files[0])}
                />
              </label>
            </div>
          </Section>

          <Section title="Danger zone">
            <Popconfirm
              title="Delete task"
              description="Are you sure you want to permanently delete this task?"
              onConfirm={() => removeTask.mutate()}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: removeTask.isPending }}
            >
              <Button danger block icon={<Trash2 className="h-4 w-4" />}>
                Delete task
              </Button>
            </Popconfirm>
          </Section>
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
        </div>
      )}
    </Modal>
  );
}