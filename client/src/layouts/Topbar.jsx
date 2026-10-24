import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useNotifications from '../hooks/useNotifications';
import { formatRelative } from '../utils/formatters';

const Topbar = ({ onMenuToggle, title }) => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const [showNotif, setShowNotif]   = useState(false);
  const [showUser,  setShowUser]    = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const profilePath = user?.role === 'passenger' ? '/passenger/profile' : `/${user?.role}/dashboard`;

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-sm btn-light d-md-none" onClick={onMenuToggle}>
          <i className="bi bi-list fs-5" />
        </button>
        <h1 className="page-title mb-0 d-none d-md-block" style={{ fontSize: '1.1rem' }}>
          {title}
        </h1>
      </div>

      <div className="d-flex align-items-center gap-2">

        {/* Notifications */}
        <div className="position-relative" ref={notifRef}>
          <button
            className="btn btn-sm btn-light position-relative"
            onClick={() => { setShowNotif((v) => !v); setShowUser(false); }}
          >
            <i className="bi bi-bell fs-5" />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div className="dropdown-menu dropdown-menu-end show shadow border-0 rounded-3 p-0"
              style={{ width: 340, top: '110%', right: 0, position: 'absolute' }}>
              <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                <span className="fw-semibold small">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-link btn-sm p-0 text-primary" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="text-center text-muted py-4 small">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-3 py-2 border-bottom ${!n.isRead ? 'bg-primary bg-opacity-10' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => markRead(n._id)}
                    >
                      <div className="d-flex justify-content-between">
                        <span className="small fw-semibold">{n.title}</span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatRelative(n.createdAt)}
                        </span>
                      </div>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="position-relative" ref={userRef}>
          <button
            className="btn btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
            style={{ background: 'var(--color-gray-100)' }}
            onClick={() => { setShowUser((v) => !v); setShowNotif(false); }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 28, height: 28,
                background: 'var(--color-primary)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="d-none d-sm-block small fw-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <i className="bi bi-chevron-down small" />
          </button>

          {showUser && (
            <div className="dropdown-menu dropdown-menu-end show shadow border-0 rounded-3 py-1"
              style={{ minWidth: 200, top: '110%', right: 0, position: 'absolute' }}>
              <div className="px-3 py-2 border-bottom">
                <div className="small fw-semibold">{user?.firstName} {user?.lastName}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
                <span className={`status-badge badge-active mt-1`} style={{ fontSize: '0.65rem' }}>
                  {user?.role}
                </span>
              </div>
              <button className="dropdown-item small py-2" onClick={() => { navigate(profilePath); setShowUser(false); }}>
                <i className="bi bi-person me-2" />Profile
              </button>
              <hr className="dropdown-divider my-1" />
              <button className="dropdown-item small py-2 text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2" />Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
