import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const ROLE_PATHS = {
  admin: '/admin/dashboard',
  dispatcher: '/dispatcher/dashboard',
  driver: '/driver/dashboard',
  passenger: '/passenger/search',
};

const LoginPage = () => {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = new URLSearchParams(location.search).get('redirect') || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(from || ROLE_PATHS[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)' }}>
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <div style={{
              width: 44, height: 44, background: 'var(--color-accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-bus-front-fill" style={{ color: 'var(--color-primary-dark)', fontSize: '1.3rem' }} />
            </div>
            <span className="text-white fw-bold fs-5">SVMS</span>
          </Link>
          <h2 className="text-white fw-bold mb-1">Sign In</h2>
          <p className="text-white opacity-60 small">Shashamane Vehicle Management System</p>
        </div>

        <div className="card border-0 shadow-xl rounded-4 p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope" /></span>
                <input type="email" className="form-control" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required autoComplete="email" />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-primary small">Forgot password?</Link>
              </div>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock" /></span>
                <input type={showPass ? 'text' : 'password'} className="form-control" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password" />
                <button type="button" className="input-group-text" onClick={() => setShowPass((v) => !v)}>
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn w-100 py-2 fw-semibold"
              style={{ background: 'var(--color-primary)', color: 'white' }} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
                : <><i className="bi bi-box-arrow-in-right me-2" />Sign In</>
              }
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary fw-semibold">Register here</Link>
          </p>
        </div>

        <p className="text-center text-white opacity-40 small mt-4">
          © {new Date().getFullYear()} SVMS — Shashamane, Ethiopia
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
