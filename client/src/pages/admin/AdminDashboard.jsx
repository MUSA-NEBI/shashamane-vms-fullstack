import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/dashboardService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime, formatRelative } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const StatCard = ({ icon, label, value, sub, color = 'var(--color-primary)', bg }) => (
  <div className="stat-card">
    <div className="d-flex align-items-start justify-content-between">
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value mt-1">{value}</div>
        {sub && <div className="small text-muted mt-1">{sub}</div>}
      </div>
      <div className="stat-card-icon" style={{ background: bg || `${color}18`, color }}>
        <i className={`bi ${icon}`} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    dashboardAPI.getAdmin()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>;
  if (!data)   return null;

  const { vehicles, drivers, schedules, bookings, revenue, maintenance, recentBookings, charts } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview and real-time metrics</p>
        </div>
        <div className="text-muted small"><i className="bi bi-clock me-1" />{formatDateTime(new Date())}</div>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-bus-front" label="Total Vehicles" value={vehicles.total}
            sub={`${vehicles.active} active`} color="var(--color-primary)" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-person-badge" label="Active Drivers" value={drivers.active}
            sub={`of ${drivers.total} total`} color="#6f42c1" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-ticket" label="Total Bookings" value={bookings.total}
            sub={`${bookings.confirmed} confirmed`} color="var(--color-success)" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-cash-coin" label="Total Revenue" value={formatCurrency(revenue.total)}
            sub="Confirmed payments" color="var(--color-accent)" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-calendar-check" label="Upcoming (7d)" value={schedules.upcomingThisWeek}
            sub="Scheduled trips" color="#0dcaf0" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clock" label="Pending Bookings" value={bookings.pending}
            sub="Awaiting payment" color="#fd7e14" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-wrench" label="Maintenance" value={maintenance.pending}
            sub="Pending/In-progress" color="var(--color-danger)" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-car-front" label="In Maintenance" value={vehicles.maintenance}
            sub={`${vehicles.inactive} inactive`} color="var(--color-warning)" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card p-4 h-100">
            <h6 className="fw-bold mb-3">Bookings — Last 30 Days</h6>
            {charts.bookingsByDay?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={charts.bookingsByDay}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Bookings"
                    stroke="var(--color-primary)" fill="url(#colorBookings)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="text-muted small text-center py-5">No booking data for this period.</div>}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card p-4 h-100">
            <h6 className="fw-bold mb-3">Revenue — Last 6 Months</h6>
            {charts.revenueByMonth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="total" name="Revenue (ETB)" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="text-muted small text-center py-5">No revenue data for this period.</div>}
          </div>
        </div>
      </div>

      {/* Fleet Health + Recent Bookings */}
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card p-4 h-100">
            <h6 className="fw-bold mb-3">Fleet Status</h6>
            <div className="mb-2 d-flex justify-content-between small">
              <span className="text-muted">Active</span>
              <span className="fw-semibold text-success">{vehicles.active}</span>
            </div>
            <div className="progress mb-3" style={{ height: 8 }}>
              <div className="progress-bar bg-success"
                style={{ width: `${vehicles.total ? (vehicles.active / vehicles.total) * 100 : 0}%` }} />
            </div>
            <div className="mb-2 d-flex justify-content-between small">
              <span className="text-muted">In Maintenance</span>
              <span className="fw-semibold text-warning">{vehicles.maintenance}</span>
            </div>
            <div className="progress mb-3" style={{ height: 8 }}>
              <div className="progress-bar bg-warning"
                style={{ width: `${vehicles.total ? (vehicles.maintenance / vehicles.total) * 100 : 0}%` }} />
            </div>
            <div className="mb-2 d-flex justify-content-between small">
              <span className="text-muted">Inactive</span>
              <span className="fw-semibold text-danger">{vehicles.inactive}</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar bg-danger"
                style={{ width: `${vehicles.total ? (vehicles.inactive / vehicles.total) * 100 : 0}%` }} />
            </div>
            <div className="mt-4 pt-3 border-top">
              <Link to="/admin/vehicles" className="btn btn-sm btn-outline-primary w-100">
                Manage Fleet <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card h-100">
            <div className="d-flex justify-content-between align-items-center p-4 pb-0">
              <h6 className="fw-bold mb-0">Recent Bookings</h6>
              <Link to="/admin/bookings" className="small text-primary">View all</Link>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Passenger</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings?.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-4">No bookings yet.</td></tr>
                  )}
                  {recentBookings?.map((b) => (
                    <tr key={b._id}>
                      <td><code className="small">{b.bookingReference}</code></td>
                      <td className="small">{b.passenger?.firstName} {b.passenger?.lastName}</td>
                      <td className="small">
                        {b.schedule?.route
                          ? `${b.schedule.route.origin} → ${b.schedule.route.destination}`
                          : '—'}
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td className="text-muted small">{formatRelative(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
