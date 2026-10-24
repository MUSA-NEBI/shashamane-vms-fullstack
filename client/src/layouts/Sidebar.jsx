import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_CONFIG = {
  admin: [
    { section: 'Overview' },
    { to: '/admin/dashboard',    icon: 'bi-speedometer2',    label: 'Dashboard' },
    { to: '/admin/users',        icon: 'bi-people',          label: 'Users' },
    { section: 'Fleet' },
    { to: '/admin/vehicles',     icon: 'bi-bus-front',       label: 'Vehicles' },
    { to: '/admin/drivers',      icon: 'bi-person-badge',    label: 'Drivers' },
    { to: '/admin/maintenance',  icon: 'bi-wrench',          label: 'Maintenance' },
    { section: 'Operations' },
    { to: '/admin/routes',       icon: 'bi-map',             label: 'Routes' },
    { to: '/admin/schedules',    icon: 'bi-calendar3',       label: 'Schedules' },
    { to: '/admin/templates',    icon: 'bi-calendar-week',   label: 'Templates' },
    { section: 'Transactions' },
    { to: '/admin/bookings',     icon: 'bi-ticket',          label: 'Bookings' },
    { to: '/admin/payments',     icon: 'bi-credit-card',     label: 'Payments' },
    { to: '/admin/tickets',      icon: 'bi-qr-code',         label: 'Tickets' },
    { section: 'Analytics' },
    { to: '/admin/reports',      icon: 'bi-bar-chart-line',  label: 'Reports' },
  ],
  dispatcher: [
    { section: 'Overview' },
    { to: '/dispatcher/dashboard',  icon: 'bi-speedometer2',  label: 'Dashboard' },
    { section: 'Operations' },
    { to: '/dispatcher/schedules',  icon: 'bi-calendar3',     label: 'Schedules' },
    { to: '/dispatcher/vehicles',   icon: 'bi-bus-front',     label: 'Vehicles' },
    { to: '/dispatcher/drivers',    icon: 'bi-person-badge',  label: 'Drivers' },
    { to: '/dispatcher/maintenance', icon: 'bi-tools',        label: 'Report Issues' },
    { section: 'Transactions' },
    { to: '/dispatcher/bookings',   icon: 'bi-ticket',        label: 'Bookings' },
  ],
  driver: [
    { section: 'My Work' },
    { to: '/driver/dashboard',  icon: 'bi-speedometer2', label: 'Dashboard' },
    { to: '/driver/trips',      icon: 'bi-calendar3',    label: 'My Trips' },
  ],
  passenger: [
    { section: 'Travel' },
    { to: '/passenger/search',    icon: 'bi-search',       label: 'Search Trips' },
    { to: '/passenger/bookings',  icon: 'bi-ticket',       label: 'My Bookings' },
    { to: '/passenger/tickets',   icon: 'bi-qr-code',      label: 'My Tickets' },
    { section: 'Account' },
    { to: '/passenger/profile',   icon: 'bi-person-circle', label: 'Profile' },
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const navItems = NAV_CONFIG[user?.role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-bus-front-fill" />
          </div>
          <div className="sidebar-brand-text">
            SVMS
            <span className="sidebar-brand-sub">Shashamane VMS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={`sec-${i}`} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onClose?.()}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
