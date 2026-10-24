import { Link } from 'react-router-dom';
const NotFoundPage = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--color-gray-50)' }}>
    <div className="text-center p-4">
      <div style={{ fontSize: '6rem', color: 'var(--color-gray-300)', lineHeight: 1 }}>404</div>
      <h2 className="fw-bold mb-2">Page Not Found</h2>
      <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn px-4 fw-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>
        Go Home
      </Link>
    </div>
  </div>
);
export default NotFoundPage;
