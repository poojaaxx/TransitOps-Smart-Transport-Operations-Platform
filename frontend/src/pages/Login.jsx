import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { ErrorBanner } from '../components/ui/Spinner';

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleetmanager@transitops.demo' },
  { role: 'Safety Officer', email: 'safety@transitops.demo' },
  { role: 'Financial Analyst', email: 'finance@transitops.demo' },
  { role: 'Driver', email: 'driver@transitops.demo' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Truck size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">TransitOps</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Smart Transport Operations Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@transitops.demo"
          />
          <TextField
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <ErrorBanner message={error} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <p className="mb-1.5 font-semibold text-slate-600 dark:text-slate-300">Demo accounts (password: Password123!)</p>
          <ul className="space-y-0.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email} className="flex justify-between gap-2">
                <span>{acc.role}</span>
                <button
                  type="button"
                  className="font-mono text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password123!');
                  }}
                >
                  {acc.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
