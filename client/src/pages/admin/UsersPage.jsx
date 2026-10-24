import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { dashboardAPI } from '../../services/dashboardService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDate, formatRelative } from '../../utils/formatters';

const UsersPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, search:'', role:'' });
  const fetchFn = useCallback((p) => dashboardAPI.getUsers(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [toggling, setToggling] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'passenger'
  });

  const handleToggle = async (user) => {
    setToggling(user._id);
    try {
      await dashboardAPI.toggleUserStatus(user._id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}.`);
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setToggling(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await dashboardAPI.createUser(formData);
      toast.success('User created successfully!');
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'passenger' });
      refetch(params);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const ROLES = ['admin','dispatcher','driver','passenger'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">View and manage all system users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus me-2" />
          New User
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar value={params.search} onChange={(v) => setParams({ ...params, search: v, page: 1 })} placeholder="Search name or email…" />
          <select className="form-select form-select-sm" style={{ width:'auto' }} value={params.role} onChange={(e) => setParams({ ...params, role: e.target.value, page: 1 })}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} users</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-people" title="No users found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u._id}>
                      <td className="fw-semibold">{u.firstName} {u.lastName}</td>
                      <td className="small text-muted">{u.email}</td>
                      <td className="small">{u.phone || '—'}</td>
                      <td><span className="badge bg-primary text-capitalize">{u.role}</span></td>
                      <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                      <td className="text-muted small">{formatRelative(u.createdAt)}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggle(u)}
                          disabled={toggling === u._id}
                        >
                          {toggling === u._id
                            ? <span className="spinner-border spinner-border-sm" />
                            : u.isActive ? 'Deactivate' : 'Activate'
                          }
                        </button>
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

      {/* Create User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2" />
                  Create New User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+251..."
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Role *</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="text-capitalize">{r}</option>
                        ))}
                      </select>
                      <small className="text-muted">
                        {formData.role === 'admin' && '⚠️ Full system access'}
                        {formData.role === 'dispatcher' && '📋 Manage schedules and operations'}
                        {formData.role === 'driver' && '🚌 View assigned trips'}
                        {formData.role === 'passenger' && '🎫 Book tickets and view trips'}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
