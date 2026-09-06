import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Modal, List, Avatar } from 'antd';

export default function WorkspaceSwitcherModal({ open, onClose, workspaces = [], current }) {
  const navigate = useNavigate();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Switch workspace"
      footer={null}
      destroyOnClose
      width={440}
    >
      <div className="pt-2">
        <List
          dataSource={workspaces}
          renderItem={(ws) => {
            const isSelected = ws._id === current?._id;

            return (
              <List.Item
                key={ws._id}
                onClick={() => {
                  onClose();
                  navigate(`/w/${ws.slug}`);
                }}
                className={`!cursor-pointer !rounded-xl !border-0 !px-3 !py-2.5 transition-colors duration-150 hover:bg-slate-100 ${
                  isSelected ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex w-full items-center gap-3">
                  <Avatar
                    shape="square"
                    size={36}
                    className="!bg-brand-600 !font-bold !text-white"
                  >
                    {ws.name?.charAt(0)?.toUpperCase()}
                  </Avatar>

                  <span className="flex-1 truncate text-sm font-semibold text-slate-800">
                    {ws.name}
                  </span>

                  {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </div>
              </List.Item>
            );
          }}
        />

        <div className="mt-2 border-t border-slate-100 pt-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-slate-100"
          >
            <span>All workspaces</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </Modal>
  );
}