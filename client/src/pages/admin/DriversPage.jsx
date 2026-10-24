import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { driverAPI } from '../../services/driverService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDate } from '../../utils/formatters';

const BLANK = {
  firstName:'', lastName:'', email:'', phone:'', password:'',
  employeeId:'', licenseNumber:'', licenseClass:'C', licenseExpiry:'', yearsOfExperience:0, notes:'',
};

const DriverModal = ({ driver, onClose, onSaved }) => {
  const isEdit = !!driver?._id;
  const [form, setForm] = useState(isEdit ? {
    firstName: driver.user?.firstName, lastName: driver.user?.lastName,
    phone: driver.user?.phone, ...driver,
  } : BLANK);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await driverAPI.update(driver._id, form);
      else        await driverAPI.create(form);
      toast.success(`Driver ${isEdit ? 'updated' : 'added'} successfully.`);
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
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Driver' : 'Add New Driver'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: '0.05em' }}>Account Information</p>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">First Name *</label>
                  <input className="form-control" value={form.firstName||''} onChange={(e)=>set('firstName',e.target.value)} required /></div>
                <div className="col-md-6"><label className="form-label">Last Name *</label>
                  <input className="form-control" value={form.lastName||''} onChange={(e)=>set('lastName',e.target.value)} required /></div>
                {!isEdit && <>
                  <div className="col-md-6"><label className="form-label">Email *</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e)=>set('email',e.target.value)} required /></div>
                  <div className="col-md-6"><label className="form-label">Initial Password *</label>
                    <input type="password" className="form-control" value={form.password} onChange={(e)=>set('password',e.target.value)} required minLength={8} /></div>
                </>}
                <div className="col-md-6"><label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone||''} onChange={(e)=>set('phone',e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label">Employee ID *</label>
                  <input className="form-control" value={form.employeeId||''} onChange={(e)=>set('employeeId',e.target.value)} required disabled={isEdit} /></div>
              </div>

              <p className="small text-muted mt-4 mb-3 fw-semibold text-uppercase" style={{ letterSpacing: '0.05em' }}>License Information</p>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">License Number *</label>
                  <input className="form-control" value={form.licenseNumber||''} onChange={(e)=>set('licenseNumber',e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">Class *</label>
                  <input className="form-control" value={form.licenseClass||''} onChange={(e)=>set('licenseClass',e.target.value)} required placeholder="e.g. C" /></div>
                <div className="col-md-3"><label className="form-label">Expiry Date *</label>
                  <input type="date" className="form-control" value={form.licenseExpiry?.slice?.(0,10)||''} onChange={(e)=>set('licenseExpiry',e.target.value)} required /></div>
                <div className="col-md-6"><label className="form-label">Years of Experience</label>
                  <input type="number" className="form-control" value={form.yearsOfExperience||0} onChange={(e)=>set('yearsOfExperience',+e.target.value)} min={0} /></div>
                <div className="col-12"><label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes||''} onChange={(e)=>set('notes',e.target.value)} /></div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {isEdit ? 'Save Changes' : 'Add Driver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DriversPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const fetchFn = useCallback((p) => driverAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await driverAPI.delete(deleteTarget._id);
      toast.success('Driver deactivated.');
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
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Manage driver profiles and license information</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2" />Add Driver
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar value={params.search} onChange={(v) => setParams({ ...params, search: v, page: 1 })} placeholder="Search name, employee ID…" />
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {['active','on_leave','inactive','suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} drivers</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-person-badge" title="No drivers found"
            action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Add First Driver</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Driver</th><th>Employee ID</th><th>License</th><th>Expiry</th><th>Experience</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.data.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <div className="fw-semibold">{d.user?.firstName} {d.user?.lastName}</div>
                        <div className="text-muted small">{d.user?.email}</div>
                      </td>
                      <td><code>{d.employeeId}</code></td>
                      <td>
                        <div>{d.licenseNumber}</div>
                        <div className="text-muted small">Class {d.licenseClass}</div>
                      </td>
                      <td className="small">{formatDate(d.licenseExpiry)}</td>
                      <td className="small">{d.yearsOfExperience}y</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setModal(d)}><i className="bi bi-pencil" /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(d)}><i className="bi bi-trash" /></button>
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

      {modal && <DriverModal driver={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(params); }} />}
      <ConfirmDialog open={!!deleteTarget} title="Deactivate Driver" danger loading={deleting}
        message={`Deactivate driver ${deleteTarget?.user?.firstName} ${deleteTarget?.user?.lastName}? Their account will be disabled.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default DriversPage;
