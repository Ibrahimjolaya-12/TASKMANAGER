import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { ArrowRight, Sparkles, LayoutDashboard, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiError } from '../api/client.js';

export default function AuthPage({ mode }) {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    form.resetFields();
    setError('');
  }, [mode, form]);

  if (!loading && user) return <Navigate to="/" replace />;

  const onFinish = async (values) => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(values.email, values.password);
      } else {
        await register(values.name, values.email, values.password);
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-3 text-slate-800">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        
        {/* Left Side: Professional SaaS Showcase Banner */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-base font-extrabold text-white border border-white/20 shadow-lg">
              F
            </div>
            <span className="text-lg font-extrabold tracking-tight">Flowdeck</span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-4">
           
            <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
              Execute projects with hand-crafted precision.
            </h2>
            <p className="text-indigo-100/90 text-xs font-medium leading-relaxed max-w-sm">
              Real-time Kanban boards, role-based access control, file attachments, and seamless team workflows built for high-velocity teams.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <LayoutDashboard className="h-4 w-4 text-indigo-300" />
                <span className="text-[11px] font-bold">Kanban & Lists</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <ShieldCheck className="h-4 w-4 text-indigo-300" />
                <span className="text-[11px] font-bold">Strict RBAC</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-indigo-200/80 font-medium border-t border-white/10 pt-4">
            <span>© {new Date().getFullYear()}. Ibrahim JolaYa</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-8 bg-white">
          <div className="mb-6">
            <div className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white mb-3 shadow-md shadow-indigo-500/25">
              F
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {mode === 'login' ? 'Enter your credentials to access your workspace.' : 'Get started with your professional project suite.'}
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            autoComplete="off"
            className="space-y-3"
          >
            {mode === 'register' && (
              <Form.Item
                name="name"
                label={<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</span>}
                rules={[{ required: true, message: 'Please enter your name' }]}
                className="mb-3"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400 mr-2" />}
                  placeholder="Ada Lovelace"
                  size="middle"
                  className="rounded-xl py-2 px-3 border-slate-200 hover:border-indigo-500 focus:border-indigo-500 text-sm"
                />
              </Form.Item>
            )}

            <Form.Item
              name="email"
              label={<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
              className="mb-3"
            >
              <Input
                prefix={<MailOutlined className="text-slate-400 mr-2" />}
                type="email"
                placeholder="you@company.com"
                size="middle"
                className="rounded-xl py-2 px-3 border-slate-200 hover:border-indigo-500 focus:border-indigo-500 text-sm"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</span>}
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              className="mb-3"
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400 mr-2" />}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                size="middle"
                className="rounded-xl py-2 px-3 border-slate-200 hover:border-indigo-500 focus:border-indigo-500 text-sm"
              />
            </Form.Item>

            {error && (
              <div className="mb-3">
                <Alert message={error} type="error" showIcon className="rounded-xl text-xs" />
              </div>
            )}

            <Form.Item className="mb-0 pt-1">
              <Button
                type="primary"
                htmlType="submit"
                loading={busy}
                block
                size="large"
                className="bg-indigo-600 hover:!bg-indigo-700 font-bold rounded-xl h-11 shadow-md shadow-indigo-100 border-none flex items-center justify-center gap-2 text-sm"
              >
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Form.Item>
          </Form>

          <p className="mt-5 text-center text-xs font-medium text-slate-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                  Register here
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-indigo-600 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}