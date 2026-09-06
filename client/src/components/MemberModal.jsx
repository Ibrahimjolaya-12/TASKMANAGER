import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus } from 'lucide-react';
import { Modal, Form, Input, Select, Button, Tag, Alert, Popconfirm } from 'antd';
import api, { apiError } from '../api/client.js';
import { Avatar } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_TAG_COLOR = {
  Owner: 'purple',
  Admin: 'blue',
  Member: 'default',
  Viewer: 'orange',
};

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Member', label: 'Member' },
  { value: 'Viewer', label: 'Viewer' },
];

export default function MemberModal({ open, onClose, workspace }) {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const members = workspace?.members || [];
  const myRole = members.find((m) => m.userId?._id === me?.id)?.role;
  const canManage = ['Owner', 'Admin'].includes(myRole);
  const isOwner = myRole === 'Owner';

  const addMember = useMutation({
    mutationFn: ({ email, role }) => api.post(`/workspaces/${workspace._id}/members`, { email, role }),
    onSuccess: () => {
      form.resetFields();
      setError('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace._id] });
    },
    onError: (err) => setError(apiError(err)),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }) =>
      api.patch(`/workspaces/${workspace._id}/members/${userId}`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspace._id] }),
    onError: (err) => setError(apiError(err)),
  });

  const removeMember = useMutation({
    mutationFn: (userId) => api.delete(`/workspaces/${workspace._id}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspace._id] }),
    onError: (err) => setError(apiError(err)),
  });

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setError('');
    }
  }, [open, form]);

  const handleAddMember = (values) => {
    setError('');
    addMember.mutate(values);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Team — ${workspace?.name || ''}`}
      footer={null}
      destroyOnClose
    >
      <div className="pt-2">
        {canManage && (
          <Form
            form={form}
            layout="inline"
            onFinish={handleAddMember}
            initialValues={{ role: 'Member' }}
            className="mb-4 flex flex-nowrap gap-2"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter an email' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
              className="!mr-0 flex-1"
            >
              <Input placeholder="colleague@company.com" />
            </Form.Item>

            <Form.Item name="role" className="!mr-0 w-28">
              <Select options={ROLE_OPTIONS} />
            </Form.Item>

            <Form.Item className="!mr-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={addMember.isPending}
                icon={<UserPlus className="h-4 w-4" />}
                className="bg-brand-600 hover:!bg-brand-700 font-medium"
              >
                Add
              </Button>
            </Form.Item>
          </Form>
        )}

        {error && (
          <div className="mb-3">
            <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
          </div>
        )}

        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {members.map((m) => {
            const u = m.userId;
            const isMe = u?._id === me?.id;

            return (
              <div
                key={u?._id || m.userId}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
              >
                <Avatar user={u} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u?.name} {isMe && <span className="text-xs text-slate-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-400">{u?.email}</p>
                </div>

                {m.role === 'Owner' || isMe || !canManage ? (
                  <Tag color={ROLE_TAG_COLOR[m.role]} className="!mr-0">
                    {m.role}
                  </Tag>
                ) : isOwner ? (
                  <Select
                    size="small"
                    value={m.role}
                    onChange={(newRole) => changeRole.mutate({ userId: u._id, role: newRole })}
                    options={ROLE_OPTIONS}
                    className="w-28"
                  />
                ) : (
                  <Tag color={ROLE_TAG_COLOR[m.role]} className="!mr-0">
                    {m.role}
                  </Tag>
                )}

                {canManage && m.role !== 'Owner' && !isMe && (
                  <Popconfirm
                    title="Remove member"
                    description="Are you sure you want to remove this user from the workspace?"
                    onConfirm={() => removeMember.mutate(u._id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true, loading: removeMember.isPending }}
                  >
                    <button
                      type="button"
                      className="rounded p-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Remove from workspace"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Popconfirm>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
          Roles: <b>Owner</b> manages everything & members' roles · <b>Admin</b> manages projects, members and tasks ·{' '}
          <b>Member</b> creates and edits tasks · <b>Viewer</b> read-only.
        </p>
      </div>
    </Modal>
  );
}