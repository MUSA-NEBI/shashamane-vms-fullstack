import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! Welcome to SVMS.');
      navigate('/passenger/search', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)' }}>
      <div className="w-100" style={{ maxWidth: 500 }}>
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <div style={{ width: 44, height: 44, background: 'var(--color-accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-bus-front-fill" style={{ color: 'var(--color-primary-dark)', fontSize: '1.3rem' }} />
            </div>
            <span className="text-white fw-bold fs-5">SVMS</span>
          </Link>
          <h2 className="text-white fw-bold mb-1">Create Account</h2>
          <p className="text-white opacity-60 small">Join the Shashamane transport network</p>
        </div>

        <div className="card border-0 shadow-xl rounded-4 p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">First Name</label>
                <input className="form-control" placeholder="Abebe" {...f('firstName')} required />
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input className="form-control" placeholder="Kebede" {...f('lastName')} required />
              </div>
              <div className="col-12">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="you@example.com" {...f('email')} required />
              </div>
              <div className="col-12">
                <label className="form-label">Phone <span className="text-muted small">(optional)</span></label>
                <input type="tel" className="form-control" placeholder="+251 9XX XXX XXXX" {...f('phone')} />
              </div>
              <div className="col-12">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input type={showPass ? 'text' : 'password'} className="form-control"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number" {...f('password')} required />
                  <button type="button" className="input-group-text" onClick={() => setShowPass((v) => !v)}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" placeholder="Re-enter password" {...f('confirm')} required />
              </div>
            </div>

            <button type="submit" className="btn w-100 py-2 fw-semibold mt-4"
              style={{ background: 'var(--color-primary)', color: 'white' }} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Creating account…</>
                : <><i className="bi bi-person-plus me-2" />Create Account</>
              }
            </button>
          </form>
          <p className="text-center text-muted small mt-3 mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-primary fw-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
