import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { scheduleAPI } from '../../services/scheduleService';
import { vehicleAPI } from '../../services/vehicleService';
import { driverAPI } from '../../services/driverService';
import { routeAPI } from '../../services/routeService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDateTime, formatTime, formatCurrency, formatDate } from '../../utils/formatters';

const ScheduleModal = ({ schedule, onClose, onSaved }) => {
  const isEdit = !!schedule?._id;
  const [form, setForm] = useState(isEdit ? {
    route: schedule.route?._id || schedule.route,
    vehicle: schedule.vehicle?._id || schedule.vehicle,
    driver: schedule.driver?._id || schedule.driver,
    departureTime: schedule.departureTime?.slice(0,16) || '',
    arrivalTime:   schedule.arrivalTime?.slice(0,16) || '',
    fare: schedule.fare,
    notes: schedule.notes || '',
    status: schedule.status || 'scheduled',
  } : { route:'', vehicle:'', driver:'', departureTime:'', arrivalTime:'', fare:'', notes:'', status:'scheduled' });

  const [routes,   setRoutes]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      routeAPI.getAll({ limit: 100, isActive: 'true' }),
      vehicleAPI.getAll({ limit: 100, status: 'active' }),
      driverAPI.getAll({ limit: 100, status: 'active' }),
    ]).then(([r, v, d]) => {
      setRoutes(r.data.data || []);
      setVehicles(v.data.data || []);
      setDrivers(d.data.data || []);
    }).finally(() => setLoadingData(false));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-fill fare from selected route
  const handleRouteChange = (id) => {
    set('route', id);
    const route = routes.find((r) => r._id === id);
    if (route && !form.fare) set('fare', route.baseFare);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await scheduleAPI.update(schedule._id, form);
      else        await scheduleAPI.create(form);
      toast.success(`Schedule ${isEdit ? 'updated' : 'created'} successfully.`);
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-calendar-plus me-2" />
              {isEdit ? 'Edit Schedule' : 'Create New Schedule'}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loadingData ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" />
                  <p className="text-muted mt-2 small">Loading routes, vehicles, and drivers...</p>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-signpost-2 me-1" />Route *
                    </label>
                    <select className="form-select" value={form.route} onChange={(e)=>handleRouteChange(e.target.value)} required>
                      <option value="">Select a route…</option>
                      {routes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.routeName} — {r.origin} → {r.destination} ({r.totalDistance}km, {formatCurrency(r.baseFare)})
                        </option>
                      ))}
                    </select>
                    {routes.length === 0 && (
                      <small className="text-warning">⚠️ No active routes available. Please create a route first.</small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-bus-front me-1" />Vehicle *
                    </label>
                    <select className="form-select" value={form.vehicle} onChange={(e)=>set('vehicle',e.target.value)} required>
                      <option value="">Select a vehicle…</option>
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleCode} — {v.manufacturer} {v.model} ({v.capacity} seats)
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <small className="text-warning">⚠️ No active vehicles available.</small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person-badge me-1" />Driver *
                    </label>
                    <select className="form-select" value={form.driver} onChange={(e)=>set('driver',e.target.value)} required>
                      <option value="">Select a driver…</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.user?.firstName} {d.user?.lastName} — {d.employeeId}
                        </option>
                      ))}
                    </select>
                    {drivers.length === 0 && (
                      <small className="text-warning">⚠️ No active drivers available.</small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-clock me-1" />Departure Time *
                    </label>
                    <input type="datetime-local" className="form-control" value={form.departureTime} onChange={(e)=>set('departureTime',e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-clock-history me-1" />Arrival Time *
                    </label>
                    <input type="datetime-local" className="form-control" value={form.arrivalTime} onChange={(e)=>set('arrivalTime',e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-currency-exchange me-1" />Fare (ETB) *
                    </label>
                    <input type="number" className="form-control" value={form.fare} onChange={(e)=>set('fare',+e.target.value)} required min={0} step={0.5} />
                    <small className="text-muted">Auto-filled from route base fare</small>
                  </div>
                  {isEdit && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-flag me-1" />Status
                      </label>
                      <select className="form-select" value={form.status} onChange={(e)=>set('status',e.target.value)}>
                        <option value="scheduled">Scheduled</option>
                        <option value="boarding">Boarding</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delayed">Delayed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-sticky me-1" />Notes
                    </label>
                    <textarea className="form-control" rows={2} value={form.notes} onChange={(e)=>set('notes',e.target.value)} placeholder="Additional information about this trip..." />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading || loadingData}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                <i className="bi bi-check-circle me-1" />
                {isEdit ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DispatcherSchedules = () => {
  const [params, setParams] = useState({ page:1, limit:10, status:'', upcoming:'true', search:'' });
  const fetchFn = useCallback((p) => scheduleAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await scheduleAPI.delete(deleteTarget._id);
      toast.success('Schedule cancelled successfully.');
      setDeleteTarget(null);
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleStatusUpdate = async (scheduleId, newStatus) => {
    try {
      await scheduleAPI.update(scheduleId, { status: newStatus });
      toast.success(`Trip status updated to ${newStatus.replace('_', ' ')}`);
      refetch(params);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const STATUSES = ['scheduled','boarding','in_transit','completed','cancelled','delayed'];

  // Apply date filter
  const handleDateFilter = (filter) => {
    setDateFilter(filter);
    const today = new Date();
    let upcoming = '';
    
    if (filter === 'today') {
      upcoming = 'true';
    } else if (filter === 'upcoming') {
      upcoming = 'true';
    } else if (filter === 'past') {
      upcoming = 'false';
    }
    
    setParams({ ...params, upcoming, page: 1 });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-calendar3 me-2" />Trip Schedules
          </h1>
          <p className="page-subtitle">Create, manage, and monitor all trip schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />Create Schedule
        </button>
      </div>

      {/* Filters Card */}
      <div className="card p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-semibold mb-1">Search</label>
            <SearchBar 
              value={params.search} 
              onChange={(v) => setParams({ ...params, search: v, page: 1 })} 
              placeholder="Search routes, vehicles, drivers..." 
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold mb-1">Status</label>
            <select className="form-select" value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold mb-1">Time Period</label>
            <select className="form-select" value={dateFilter} onChange={(e) => handleDateFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="col-md-2 text-end">
            <div className="small text-muted mb-1">Total</div>
            <div className="fw-bold">{data?.pagination?.total ?? 0} schedules</div>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2" />{error}
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <EmptyState 
            icon="bi-calendar3" 
            title="No schedules found"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
              <i className="bi bi-plus-lg me-1" />Create First Schedule
            </button>} 
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Fare</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map((s) => {
                    const booked = s.bookedSeats?.length || 0;
                    const capacity = s.vehicle?.capacity || 0;
                    const available = capacity - booked;
                    const utilizationPct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;

                    return (
                      <tr key={s._id}>
                        <td>
                          <div className="fw-semibold small">{formatDate(s.departureTime, 'EEE, MMM dd')}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {formatTime(s.departureTime)} - {formatTime(s.arrivalTime)}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold small">{s.route?.routeName || '—'}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {s.route?.origin} → {s.route?.destination}
                          </div>
                        </td>
                        <td>
                          <code className="small">{s.vehicle?.vehicleCode || '—'}</code>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {s.vehicle?.manufacturer} {s.vehicle?.model}
                          </div>
                        </td>
                        <td className="small">
                          {s.driver?.user?.firstName} {s.driver?.user?.lastName}
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {s.driver?.employeeId}
                          </div>
                        </td>
                        <td className="small">{formatCurrency(s.fare)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`fw-semibold ${available === 0 ? 'text-danger' : ''}`}>
                              {booked}/{capacity}
                            </span>
                            <div className="progress" style={{ width: '50px', height: '6px' }}>
                              <div 
                                className={`progress-bar ${utilizationPct > 90 ? 'bg-danger' : utilizationPct > 70 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${utilizationPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => setModal(s)}
                              title="Edit schedule"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            {!['completed', 'cancelled'].includes(s.status) && (
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => setDeleteTarget(s)}
                                title="Cancel schedule"
                              >
                                <i className="bi bi-x-circle" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
          </>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ScheduleModal 
          schedule={modal === 'create' ? null : modal} 
          onClose={() => setModal(null)} 
          onSaved={() => { setModal(null); refetch(params); }} 
        />
      )}
      
      <ConfirmDialog 
        open={!!deleteTarget} 
        title="Cancel Schedule" 
        danger 
        loading={deleting}
        message={`Cancel the schedule for ${deleteTarget?.route?.routeName} on ${formatDateTime(deleteTarget?.departureTime)}? This action cannot be undone. Active bookings must be cancelled first.`}
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
      />
    </div>
  );
};

export default DispatcherSchedules;
