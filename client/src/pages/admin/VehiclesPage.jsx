import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { vehicleAPI } from '../../services/vehicleService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDate } from '../../utils/formatters';

const FUEL_OPTIONS = ['diesel','petrol','electric','hybrid','cng'];
const STATUS_OPTIONS = ['active','maintenance','inactive'];

const BLANK = { vehicleCode:'', plateNumber:'', manufacturer:'', model:'', year: new Date().getFullYear(), capacity:45, fuelType:'diesel', status:'active', color:'', description:'' };

const VehicleModal = ({ vehicle, onClose, onSaved }) => {
  const isEdit = !!vehicle?._id;
  const [form, setForm]     = useState(isEdit ? { ...vehicle } : BLANK);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await vehicleAPI.update(vehicle._id, form);
      else        await vehicleAPI.create(form);
      toast.success(`Vehicle ${isEdit ? 'updated' : 'created'} successfully.`);
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Vehicle Code *</label>
                  <input className="form-control" value={form.vehicleCode} onChange={(e) => set('vehicleCode', e.target.value.toUpperCase())} required disabled={isEdit} placeholder="e.g. SHM-001" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Plate Number *</label>
                  <input className="form-control" value={form.plateNumber} onChange={(e) => set('plateNumber', e.target.value.toUpperCase())} required placeholder="e.g. AA-12345" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Manufacturer *</label>
                  <input className="form-control" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} required placeholder="e.g. Isuzu" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Model *</label>
                  <input className="form-control" value={form.model} onChange={(e) => set('model', e.target.value)} required placeholder="e.g. NQR" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Year *</label>
                  <input type="number" className="form-control" value={form.year} onChange={(e) => set('year', +e.target.value)} required min={1990} max={new Date().getFullYear()+1} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Capacity (seats) *</label>
                  <input type="number" className="form-control" value={form.capacity} onChange={(e) => set('capacity', +e.target.value)} required min={1} max={200} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Fuel Type *</label>
                  <select className="form-select" value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)} required>
                    {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Color</label>
                  <input className="form-control" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. White" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? 'Save Changes' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const VehiclesPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const fetchFn = useCallback((p) => vehicleAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  const [modal, setModal]       = useState(null); // null | 'create' | vehicle object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await vehicleAPI.delete(deleteTarget._id);
      toast.success('Vehicle deactivated.');
      setDeleteTarget(null);
      refetch(params);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-subtitle">Manage the fleet of buses and transport vehicles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar value={params.search} onChange={(v) => setParams({ ...params, search: v, page: 1 })} placeholder="Search code, plate, model…" />
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(params.search || params.status) && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setParams({ page: 1, limit: 10, search: '', status: '' })}>
              <i className="bi bi-x me-1" />Clear
            </button>
          )}
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} vehicles</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-bus-front" title="No vehicles found"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Add First Vehicle</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th><th>Plate</th><th>Vehicle</th><th>Capacity</th><th>Fuel</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((v) => (
                    <tr key={v._id}>
                      <td><code className="fw-semibold">{v.vehicleCode}</code></td>
                      <td>{v.plateNumber}</td>
                      <td>
                        <div className="fw-semibold">{v.manufacturer} {v.model}</div>
                        <div className="text-muted small">{v.year}{v.color ? ` · ${v.color}` : ''}</div>
                      </td>
                      <td><i className="bi bi-people me-1 text-muted" />{v.capacity}</td>
                      <td className="text-capitalize">{v.fuelType}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setModal(v)} title="Edit">
                            <i className="bi bi-pencil" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(v)} title="Deactivate">
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
          </>
        )}
      </div>

      {modal && (
        <VehicleModal
          vehicle={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch(params); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Vehicle"
        message={`Deactivate vehicle ${deleteTarget?.vehicleCode}? It will be hidden from active operations but records are preserved.`}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default VehiclesPage;
