import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/authService';

const ResetPasswordPage = () => {
  const [params]      = useSearchParams();
  const navigate      = useNavigate();
  const [form, setForm]   = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const token = params.get('token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      toast.success('Password reset. You are now signed in.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="card border-0 shadow-xl rounded-4 p-4">
          <h4 className="fw-bold text-center mb-1">Set New Password</h4>
          <p className="text-muted small text-center mb-4">Choose a strong password for your account.</p>
          {!token ? (
            <div className="alert alert-danger">
              Invalid or missing reset token. <Link to="/forgot-password">Request a new one.</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="mb-4">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control"
                  value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
