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
import { formatDateTime, formatCurrency } from '../../utils/formatters';

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
  } : { route:'', vehicle:'', driver:'', departureTime:'', arrivalTime:'', fare:'', notes:'' });

  const [routes,   setRoutes]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    Promise.all([
      routeAPI.getAll({ limit: 100, isActive: 'true' }),
      vehicleAPI.getAll({ limit: 100, status: 'active' }),
      driverAPI.getAll({ limit: 100, status: 'active' }),
    ]).then(([r, v, d]) => {
      setRoutes(r.data.data || []);
      setVehicles(v.data.data || []);
      setDrivers(d.data.data || []);
    });
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
      toast.success(`Schedule ${isEdit ? 'updated' : 'created'}.`);
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Schedule' : 'Create Schedule'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Route *</label>
                  <select className="form-select" value={form.route} onChange={(e)=>handleRouteChange(e.target.value)} required>
                    <option value="">Select a route…</option>
                    {routes.map((r) => <option key={r._id} value={r._id}>{r.routeName} ({r.origin} → {r.destination})</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vehicle *</label>
                  <select className="form-select" value={form.vehicle} onChange={(e)=>set('vehicle',e.target.value)} required>
                    <option value="">Select a vehicle…</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.vehicleCode} — {v.manufacturer} {v.model} ({v.capacity} seats)</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Driver *</label>
                  <select className="form-select" value={form.driver} onChange={(e)=>set('driver',e.target.value)} required>
                    <option value="">Select a driver…</option>
                    {drivers.map((d) => <option key={d._id} value={d._id}>{d.user?.firstName} {d.user?.lastName} ({d.employeeId})</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Departure Time *</label>
                  <input type="datetime-local" className="form-control" value={form.departureTime} onChange={(e)=>set('departureTime',e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Arrival Time *</label>
                  <input type="datetime-local" className="form-control" value={form.arrivalTime} onChange={(e)=>set('arrivalTime',e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fare (ETB) *</label>
                  <input type="number" className="form-control" value={form.fare} onChange={(e)=>set('fare',+e.target.value)} required min={0} step={0.5} />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={(e)=>set('notes',e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {isEdit ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SchedulesPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, status:'', upcoming:'true' });
  const fetchFn = useCallback((p) => scheduleAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await scheduleAPI.delete(deleteTarget._id);
      toast.success('Schedule cancelled.');
      setDeleteTarget(null);
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const STATUSES = ['scheduled','boarding','in_transit','completed','cancelled','delayed'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedules</h1>
          <p className="page-subtitle">Manage trip schedules and vehicle/driver assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />Create Schedule
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="form-check form-switch ms-1">
            <input className="form-check-input" type="checkbox" id="upcoming"
              checked={params.upcoming === 'true'}
              onChange={(e) => setParams({ ...params, upcoming: e.target.checked ? 'true' : '', page: 1 })} />
            <label className="form-check-label small" htmlFor="upcoming">Upcoming only</label>
          </div>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} schedules</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-calendar3" title="No schedules found"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Create Schedule</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Route</th><th>Departure</th><th>Vehicle</th><th>Driver</th><th>Fare</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.data.map((s) => {
                    const avail = s.vehicle ? s.vehicle.capacity - (s.bookedSeats?.length || 0) : '—';
                    return (
                      <tr key={s._id}>
                        <td>
                          <div className="fw-semibold small">{s.route?.routeName || '—'}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {s.route?.origin} → {s.route?.destination}
                          </div>
                        </td>
                        <td className="small">{formatDateTime(s.departureTime)}</td>
                        <td className="small">{s.vehicle?.vehicleCode || '—'}</td>
                        <td className="small">{s.driver?.user?.firstName} {s.driver?.user?.lastName}</td>
                        <td className="small">{formatCurrency(s.fare)}</td>
                        <td className="small">
                          <span className={avail === 0 ? 'text-danger fw-semibold' : ''}>{avail}</span>
                          <span className="text-muted">/{s.vehicle?.capacity || '?'}</span>
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setModal(s)}><i className="bi bi-pencil" /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(s)}><i className="bi bi-x-circle" /></button>
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

      {modal && <ScheduleModal schedule={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(params); }} />}
      <ConfirmDialog open={!!deleteTarget} title="Cancel Schedule" danger loading={deleting}
        message="Cancel this schedule? Active bookings must be cancelled first."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default SchedulesPage;
