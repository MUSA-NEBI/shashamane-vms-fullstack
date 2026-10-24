import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--color-gray-50)' }}>
      <div className="text-center p-4" style={{ maxWidth: 480 }}>
        <div className="mb-4" style={{ fontSize: '5rem', color: 'var(--color-danger)' }}>
          <i className="bi bi-shield-x" />
        </div>
        <h1 className="fw-bold mb-2">Access Denied</h1>
        <p className="text-muted mb-4">You don't have permission to view this page.</p>
        <Link to={user ? '/dashboard' : '/login'}
          className="btn px-4 fw-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>
          {user ? 'Go to Dashboard' : 'Sign In'}
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
