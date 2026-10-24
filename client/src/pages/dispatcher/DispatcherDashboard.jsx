import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { dashboardAPI } from '../../services/dashboardService';
import { scheduleAPI } from '../../services/scheduleService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatTime } from '../../utils/formatters';

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const loadData = () => {
    setLoading(true);
    dashboardAPI.getDispatcher()
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (scheduleId, newStatus) => {
    setUpdating(scheduleId);
    try {
      await scheduleAPI.update(scheduleId, { status: newStatus });
      toast.success(`Trip status updated to ${newStatus}`);
      loadData(); // Refresh data
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const { todaySchedules = [], availableVehicles = 0, availableDrivers = 0, pendingBookings = 0 } = data || {};

  // Filter schedules
  const filteredSchedules = statusFilter === 'all' 
    ? todaySchedules 
    : todaySchedules.filter(s => s.status === statusFilter);

  // Count by status
  const statusCounts = {
    scheduled: todaySchedules.filter(s => s.status === 'scheduled').length,
    boarding: todaySchedules.filter(s => s.status === 'boarding').length,
    in_transit: todaySchedules.filter(s => s.status === 'in_transit').length,
    completed: todaySchedules.filter(s => s.status === 'completed').length,
    cancelled: todaySchedules.filter(s => s.status === 'cancelled').length,
    delayed: todaySchedules.filter(s => s.status === 'delayed').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispatcher Dashboard</h1>
          <p className="page-subtitle">
            Real-time operational overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2" />Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dispatcher/schedules')}>
            <i className="bi bi-plus-lg me-2" />New Schedule
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: "Today's Trips", value: todaySchedules.length, icon: 'bi-calendar-day', color: 'var(--color-primary)', link: '/dispatcher/schedules' },
          { label: 'Available Vehicles', value: availableVehicles, icon: 'bi-bus-front', color: 'var(--color-success)', link: '/dispatcher/vehicles' },
          { label: 'Available Drivers', value: availableDrivers, icon: 'bi-person-badge', color: '#6f42c1', link: '/dispatcher/drivers' },
          { label: 'Pending Bookings', value: pendingBookings, icon: 'bi-ticket', color: '#fd7e14', link: '/dispatcher/bookings' },
        ].map((s) => (
          <div key={s.label} className="col-6 col-md-3">
            <Link to={s.link} className="text-decoration-none">
              <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-value mt-1">{s.value}</div>
                  </div>
                  <div className="stat-card-icon" style={{ background: `${s.color}18`, color: s.color }}>
                    <i className={`bi ${s.icon}`} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Trip Status Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card p-3">
            <h6 className="fw-bold mb-3">Trip Status Overview</h6>
            <div className="row g-2">
              {[
                { status: 'scheduled', label: 'Scheduled', color: '#0d6efd', icon: 'bi-calendar-check' },
                { status: 'boarding', label: 'Boarding', color: '#0dcaf0', icon: 'bi-door-open' },
                { status: 'in_transit', label: 'In Transit', color: '#198754', icon: 'bi-arrow-right-circle' },
                { status: 'delayed', label: 'Delayed', color: '#ffc107', icon: 'bi-exclamation-triangle' },
                { status: 'completed', label: 'Completed', color: '#6c757d', icon: 'bi-check-circle' },
                { status: 'cancelled', label: 'Cancelled', color: '#dc3545', icon: 'bi-x-circle' },
              ].map((item) => (
                <div key={item.status} className="col-4 col-md-2">
                  <div className="text-center p-2 rounded" style={{ background: `${item.color}08`, cursor: 'pointer' }} onClick={() => setStatusFilter(statusFilter === item.status ? 'all' : item.status)}>
                    <i className={`bi ${item.icon} d-block mb-1`} style={{ fontSize: '1.5rem', color: item.color }} />
                    <div className="fw-bold" style={{ fontSize: '1.25rem', color: item.color }}>{statusCounts[item.status]}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <h6 className="fw-bold mb-3">Quick Actions</h6>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/dispatcher/schedules')}>
                <i className="bi bi-calendar-plus me-2" />Create Schedule
              </button>
              <button className="btn btn-outline-success btn-sm" onClick={() => navigate('/dispatcher/vehicles')}>
                <i className="bi bi-bus-front me-2" />View Vehicles
              </button>
              <button className="btn btn-outline-info btn-sm" onClick={() => navigate('/dispatcher/drivers')}>
                <i className="bi bi-person-badge me-2" />View Drivers
              </button>
              <button className="btn btn-outline-warning btn-sm" onClick={() => navigate('/dispatcher/bookings')}>
                <i className="bi bi-ticket-perforated me-2" />Manage Bookings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedules Table */}
      <div className="card">
        <div className="d-flex justify-content-between align-items-center p-4 pb-3">
          <div>
            <h6 className="fw-bold mb-1">Today's Trip Schedule</h6>
            <p className="text-muted small mb-0">
              {statusFilter === 'all' ? 'All trips' : `Filtered: ${statusFilter}`} • 
              {filteredSchedules.length} of {todaySchedules.length} trips
            </p>
          </div>
          <div className="d-flex gap-2">
            {statusFilter !== 'all' && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setStatusFilter('all')}>
                <i className="bi bi-x me-1" />Clear Filter
              </button>
            )}
            <Link to="/dispatcher/schedules" className="btn btn-sm btn-primary">
              <i className="bi bi-calendar3 me-1" />All Schedules
            </Link>
          </div>
        </div>
        {filteredSchedules.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-calendar-x d-block mb-2" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="small mb-0">
              {statusFilter === 'all' ? 'No trips scheduled for today.' : `No ${statusFilter} trips.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s) => {
                  const booked = s.bookedSeats?.length || 0;
                  const capacity = s.vehicle?.capacity || 0;
                  const available = capacity - booked;
                  const utilizationPct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;

                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="fw-semibold">{formatTime(s.departureTime)}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatTime(s.arrivalTime)}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold small">{s.route?.routeName || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {s.route?.origin} → {s.route?.destination}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <code className="small">{s.vehicle?.vehicleCode || '—'}</code>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {s.vehicle?.manufacturer} {s.vehicle?.model}
                          </div>
                        </div>
                      </td>
                      <td className="small">
                        {s.driver?.user?.firstName} {s.driver?.user?.lastName}
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {s.driver?.employeeId}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <span className={`fw-semibold ${available === 0 ? 'text-danger' : ''}`}>
                              {booked}/{capacity}
                            </span>
                            <div className="progress mt-1" style={{ width: '60px', height: '4px' }}>
                              <div 
                                className={`progress-bar ${utilizationPct > 90 ? 'bg-danger' : utilizationPct > 70 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${utilizationPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" disabled={updating === s._id}>
                            {updating === s._id ? <span className="spinner-border spinner-border-sm" /> : 'Update'}
                          </button>
                          <ul className="dropdown-menu">
                            {s.status === 'scheduled' && (
                              <>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(s._id, 'boarding')}>
                                  <i className="bi bi-door-open me-2" />Start Boarding
                                </button></li>
                                <li><button className="dropdown-item text-warning" onClick={() => handleStatusUpdate(s._id, 'delayed')}>
                                  <i className="bi bi-exclamation-triangle me-2" />Mark Delayed
                                </button></li>
                              </>
                            )}
                            {s.status === 'boarding' && (
                              <li><button className="dropdown-item" onClick={() => handleStatusUpdate(s._id, 'in_transit')}>
                                <i className="bi bi-arrow-right-circle me-2" />Depart (In Transit)
                              </button></li>
                            )}
                            {s.status === 'in_transit' && (
                              <li><button className="dropdown-item text-success" onClick={() => handleStatusUpdate(s._id, 'completed')}>
                                <i className="bi bi-check-circle me-2" />Mark Completed
                              </button></li>
                            )}
                            {s.status === 'delayed' && (
                              <>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(s._id, 'boarding')}>
                                  <i className="bi bi-door-open me-2" />Resume Boarding
                                </button></li>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(s._id, 'scheduled')}>
                                  <i className="bi bi-calendar-check me-2" />Back to Scheduled
                                </button></li>
                              </>
                            )}
                            {!['completed', 'cancelled'].includes(s.status) && (
                              <li><hr className="dropdown-divider" /></li>
                            )}
                            {!['completed', 'cancelled'].includes(s.status) && (
                              <li><button className="dropdown-item text-danger" onClick={() => handleStatusUpdate(s._id, 'cancelled')}>
                                <i className="bi bi-x-circle me-2" />Cancel Trip
                              </button></li>
                            )}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;
