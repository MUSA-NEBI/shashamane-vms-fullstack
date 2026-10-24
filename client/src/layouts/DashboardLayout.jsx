import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Map path segments to readable page titles
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicles',
  drivers: 'Drivers',
  routes: 'Routes',
  schedules: 'Schedules',
  templates: 'Schedule Templates',
  bookings: 'Bookings',
  payments: 'Payments',
  tickets: 'Tickets',
  maintenance: 'Maintenance',
  users: 'User Management',
  reports: 'Reports',
  search: 'Search Trips',
  profile: 'My Profile',
  trips: 'My Trips',
};

const getTitle = (pathname) => {
  const segment = pathname.split('/').filter(Boolean).pop();
  return PAGE_TITLES[segment] || 'SVMS';
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          title={getTitle(location.pathname)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
