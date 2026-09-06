import {
  Spin as AntSpin,
  Modal as AntModal,
  Avatar as AntAvatar,
  Tag as AntTag,
  Button as AntButton,
  Input as AntInput,
  Select as AntSelect,
} from 'antd';

export function Spinner({ className = '' }) {
  return <AntSpin className={className} />;
}

export function Modal({ open, onClose, title, children, wide = false }) {
  return (
    <AntModal
      open={open}
      onCancel={onClose}
      title={title}
      footer={null}
      width={wide ? 820 : 520}
      destroyOnClose
    >
      <div className="pt-2">{children}</div>
    </AntModal>
  );
}

const AVATAR_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#0ea5e9',
  '#8b5cf6',
];

export function Avatar({ user, size = 28 }) {
  if (!user) return null;
  const initial = (user.name || '?').charAt(0).toUpperCase();
  const color = AVATAR_COLORS[(user.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <AntAvatar
      style={{ backgroundColor: color, verticalAlign: 'middle' }}
      size={typeof size === 'number' ? size : 28}
    >
      {initial}
    </AntAvatar>
  );
}

export const STATUS_STYLES = {
  Todo: 'default',
  'In Progress': 'processing',
  Review: 'warning',
  Done: 'success',
};

export const PRIORITY_STYLES = {
  Low: 'default',
  Medium: 'warning',
  High: 'error',
};

export function Badge({ children, className = '', color }) {
  return (
    <AntTag color={color} className={`!mr-0 ${className}`}>
      {children}
    </AntTag>
  );
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  disabled,
  onClick,
  type = 'button',
  ...props
}) {
  const antdType =
    variant === 'primary'
      ? 'primary'
      : variant === 'danger'
      ? 'primary'
      : variant === 'ghost'
      ? 'text'
      : 'default';

  return (
    <AntButton
      type={antdType}
      danger={variant === 'danger'}
      disabled={disabled}
      onClick={onClick}
      htmlType={type}
      className={`font-medium ${
        variant === 'primary' ? '!bg-brand-600 hover:!bg-brand-700' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </AntButton>
  );
}

export function Input({ className = '', onChange, ...props }) {
  return (
    <AntInput
      className={`rounded-lg ${className}`}
      onChange={onChange}
      {...props}
    />
  );
}

export function Select({ className = '', children, onChange, value, defaultValue, ...props }) {
  // Agar pure HTML <option> tags pass ho rahe hon to unko parse kar leta hai
  const options = Array.isArray(children)
    ? children.map((child) => ({
        value: child.props?.value ?? child.props?.children,
        label: child.props?.children,
      }))
    : [];

  return (
    <AntSelect
      className={`w-full ${className}`}
      value={value}
      defaultValue={defaultValue}
      onChange={(val) => onChange?.({ target: { value: val } })}
      options={options.length > 0 ? options : undefined}
      {...props}
    >
      {options.length === 0 ? children : null}
    </AntSelect>
  );
}