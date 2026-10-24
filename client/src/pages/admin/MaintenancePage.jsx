import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { maintenanceAPI } from '../../services/maintenanceService';
import { vehicleAPI } from '../../services/vehicleService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { formatDate, formatCurrency } from '../../utils/formatters';

const TYPES   = ['routine','repair','inspection','emergency','breakdown'];
const STATUSES = ['scheduled','in_progress','completed','cancelled'];

const MaintenanceModal = ({ record, onClose, onSaved }) => {
  const isEdit = !!record?._id;
  const [form, setForm] = useState(isEdit ? { ...record, vehicle: record.vehicle?._id || record.vehicle, scheduledDate: record.scheduledDate?.slice(0,10) } : { vehicle:'', type:'routine', description:'', scheduledDate:'', cost:'', technicianName:'', workshopName:'', blocksVehicle:false, notes:'' });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const set = (k,v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => { vehicleAPI.getAll({ limit: 100 }).then((r) => setVehicles(r.data.data || [])); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await maintenanceAPI.update(record._id, form);
      else        await maintenanceAPI.create(form);
      toast.success(`Maintenance record ${isEdit ? 'updated' : 'created'}.`);
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.5)', zIndex:1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Record' : 'New Maintenance Record'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Vehicle *</label>
                  <select className="form-select" value={form.vehicle} onChange={(e)=>set('vehicle',e.target.value)} required disabled={isEdit}>
                    <option value="">Select vehicle…</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.vehicleCode} — {v.manufacturer} {v.model}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={(e)=>set('type',e.target.value)} required>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={(e)=>set('description',e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Scheduled Date *</label>
                  <input type="date" className="form-control" value={form.scheduledDate} onChange={(e)=>set('scheduledDate',e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cost (ETB)</label>
                  <input type="number" className="form-control" value={form.cost} onChange={(e)=>set('cost',+e.target.value)} min={0} step={1} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Technician</label>
                  <input className="form-control" value={form.technicianName} onChange={(e)=>set('technicianName',e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Workshop</label>
                  <input className="form-control" value={form.workshopName} onChange={(e)=>set('workshopName',e.target.value)} />
                </div>
                {isEdit && (
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e)=>set('status',e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="blocks" checked={!!form.blocksVehicle} onChange={(e)=>set('blocksVehicle',e.target.checked)} />
                    <label className="form-check-label" htmlFor="blocks">Block vehicle from scheduling during maintenance</label>
                  </div>
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
                {isEdit ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MaintenancePage = () => {
  const [params, setParams] = useState({ page:1, limit:10, status:'', type:'' });
  const fetchFn = useCallback((p) => maintenanceAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await maintenanceAPI.delete(deleteTarget._id);
      toast.success('Record deleted.');
      setDeleteTarget(null);
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Records</h1>
          <p className="page-subtitle">All vehicle maintenance schedules, records, and dispatcher-submitted reports</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />New Record
        </button>
      </div>

      {/* Info Banner for Dispatcher Reports */}
      <div className="alert alert-info mb-3">
        <div className="d-flex align-items-start gap-2">
          <i className="bi bi-info-circle flex-shrink-0 mt-1" />
          <div className="small">
            <strong>Dispatcher Reports:</strong> Breakdowns and urgent issues submitted by dispatchers appear here. 
            Records marked with <i className="bi bi-exclamation-triangle-fill text-warning mx-1" /> block the vehicle from scheduling.
          </div>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <select className="form-select form-select-sm" style={{ width:'auto' }} value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{ width:'auto' }} value={params.type} onChange={(e) => setParams({ ...params, type: e.target.value, page: 1 })}>
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} records</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-wrench" title="No maintenance records"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Add Record</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Scheduled</th><th>Cost</th><th>Blocks</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.data.map((r) => {
                    const isUrgent = r.type === 'breakdown' || r.type === 'emergency';
                    const needsAttention = r.status === 'scheduled' && r.blocksVehicle;
                    
                    return (
                    <tr key={r._id} className={needsAttention ? 'table-warning' : ''}>
                      <td>
                        <div className="fw-semibold small">{r.vehicle?.vehicleCode}</div>
                        <div className="text-muted" style={{ fontSize:'0.75rem' }}>{r.vehicle?.manufacturer} {r.vehicle?.model}</div>
                      </td>
                      <td>
                        <span className={`badge text-capitalize ${
                          isUrgent ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="small" style={{ maxWidth:200 }}>
                        {r.description}
                        {r.notes && (
                          <div className="text-muted mt-1" style={{ fontSize:'0.7rem' }}>
                            <i className="bi bi-sticky me-1" />
                            {r.notes.length > 50 ? r.notes.slice(0, 50) + '...' : r.notes}
                          </div>
                        )}
                      </td>
                      <td className="small">{formatDate(r.scheduledDate)}</td>
                      <td className="small">{r.cost ? formatCurrency(r.cost) : '—'}</td>
                      <td className="text-center">
                        {r.blocksVehicle ? (
                          <span title="Vehicle blocked from scheduling">
                            <i className="bi bi-exclamation-triangle-fill text-warning" />
                            {needsAttention && <span className="ms-1 badge badge-sm bg-warning text-dark">Action Needed</span>}
                          </span>
                        ) : (
                          <i className="bi bi-dash text-muted" />
                        )}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => setModal(r)}
                            title="Edit and update status"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => setDeleteTarget(r)}
                            title="Delete record"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
          </>
        )}
      </div>

      {modal && <MaintenanceModal record={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(params); }} />}
      <ConfirmDialog open={!!deleteTarget} title="Delete Record" danger loading={deleting}
        message="Delete this maintenance record permanently?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default MaintenancePage;
