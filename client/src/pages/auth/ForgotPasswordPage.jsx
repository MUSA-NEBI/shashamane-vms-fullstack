import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="card border-0 shadow-xl rounded-4 p-4">
          <div className="text-center mb-4">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 64, height: 64, background: 'var(--color-primary)', color: 'white', fontSize: '1.8rem' }}>
              <i className="bi bi-envelope-open" />
            </div>
            <h4 className="fw-bold mb-1">Reset Password</h4>
            <p className="text-muted small">Enter your email and we'll send a reset link.</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="alert alert-success border-0 rounded-3">
                <i className="bi bi-check-circle me-2" />
                If that email is registered, a reset link has been sent. Check your inbox.
              </div>
              <Link to="/login" className="btn btn-primary mt-2">Back to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Send Reset Link
              </button>
              <p className="text-center small text-muted mt-3 mb-0">
                <Link to="/login">← Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
