import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { routeAPI } from '../../services/routeService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatCurrency, formatDuration } from '../../utils/formatters';

const BLANK = { routeName:'', origin:'', destination:'', totalDistance:'', estimatedDuration:'', baseFare:'', description:'', isActive: true };

const RouteModal = ({ route, onClose, onSaved }) => {
  const isEdit = !!route?._id;
  const [form, setForm] = useState(isEdit ? { ...route } : BLANK);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await routeAPI.update(route._id, form);
      else        await routeAPI.create(form);
      toast.success(`Route ${isEdit ? 'updated' : 'created'}.`);
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Route' : 'Add New Route'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Route Name *</label>
                  <input className="form-control" value={form.routeName} onChange={(e)=>set('routeName',e.target.value)} required placeholder="e.g. Shashamane — Addis Ababa Express" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Origin *</label>
                  <input className="form-control" value={form.origin} onChange={(e)=>set('origin',e.target.value)} required placeholder="e.g. Shashamane" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Destination *</label>
                  <input className="form-control" value={form.destination} onChange={(e)=>set('destination',e.target.value)} required placeholder="e.g. Addis Ababa" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Distance (km) *</label>
                  <input type="number" className="form-control" value={form.totalDistance} onChange={(e)=>set('totalDistance',+e.target.value)} required min={0.1} step={0.1} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Duration (minutes) *</label>
                  <input type="number" className="form-control" value={form.estimatedDuration} onChange={(e)=>set('estimatedDuration',+e.target.value)} required min={1} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Base Fare (ETB) *</label>
                  <input type="number" className="form-control" value={form.baseFare} onChange={(e)=>set('baseFare',+e.target.value)} required min={0} step={0.50} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={(e)=>set('description',e.target.value)} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="isActive" checked={form.isActive} onChange={(e)=>set('isActive',e.target.checked)} />
                    <label className="form-check-label" htmlFor="isActive">Route is active</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {isEdit ? 'Save Changes' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RoutesPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, search:'', isActive:'' });
  const fetchFn = useCallback((p) => routeAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await routeAPI.delete(deleteTarget._id);
      toast.success('Route deleted.');
      setDeleteTarget(null);
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">Define travel routes, distances, durations, and fares</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />Add Route
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar value={params.search} onChange={(v) => setParams({ ...params, search: v, page: 1 })} placeholder="Search routes…" />
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.isActive} onChange={(e) => setParams({ ...params, isActive: e.target.value, page: 1 })}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} routes</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-map" title="No routes found"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Add First Route</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Route</th><th>Origin → Destination</th><th>Distance</th><th>Duration</th><th>Fare</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.data.map((r) => (
                    <tr key={r._id}>
                      <td className="fw-semibold">{r.routeName}</td>
                      <td className="small">
                        <span className="text-primary">{r.origin}</span>
                        <i className="bi bi-arrow-right mx-2 text-muted" />
                        <span className="text-danger">{r.destination}</span>
                      </td>
                      <td className="small">{r.totalDistance} km</td>
                      <td className="small">{formatDuration(r.estimatedDuration)}</td>
                      <td className="small fw-semibold">{formatCurrency(r.baseFare)}</td>
                      <td><StatusBadge status={r.isActive ? 'active' : 'inactive'} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setModal(r)}><i className="bi bi-pencil" /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(r)}><i className="bi bi-trash" /></button>
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

      {modal && <RouteModal route={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(params); }} />}
      <ConfirmDialog open={!!deleteTarget} title="Delete Route" danger loading={deleting}
        message={`Delete route "${deleteTarget?.routeName}"? This cannot be undone and will fail if schedules use it.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default RoutesPage;
