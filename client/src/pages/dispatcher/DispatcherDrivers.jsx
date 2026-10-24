import { useState, useCallback } from 'react';
import { driverAPI } from '../../services/driverService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDate } from '../../utils/formatters';

const DispatcherDrivers = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const fetchFn = useCallback((p) => driverAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  const STATUS_OPTIONS = ['active', 'on_leave', 'inactive', 'suspended'];

  // Count drivers by status
  const driversByStatus = data?.data?.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {}) || {};

  // Check license expiry
  const isLicenseExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-person-badge me-2" />Driver Management
          </h1>
          <p className="page-subtitle">View driver status and availability</p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Active', status: 'active', icon: 'bi-check-circle', color: 'var(--color-success)' },
          { label: 'On Leave', status: 'on_leave', icon: 'bi-calendar-x', color: '#fd7e14' },
          { label: 'Inactive', status: 'inactive', icon: 'bi-pause-circle', color: '#6c757d' },
        ].map((item) => (
          <div key={item.status} className="col-md-4">
            <div
              className="stat-card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setParams({ ...params, status: params.status === item.status ? '' : item.status, page: 1 })}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="stat-card-label">{item.label}</div>
                  <div className="stat-card-value mt-1">{driversByStatus[item.status] || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: `${item.color}18`, color: item.color }}>
                  <i className={`bi ${item.icon}`} />
                </div>
              </div>
              {params.status === item.status && (
                <div className="text-primary small mt-2">
                  <i className="bi bi-funnel me-1" />Filtered
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar
            value={params.search}
            onChange={(v) => setParams({ ...params, search: v, page: 1 })}
            placeholder="Search name, employee ID…"
          />
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={params.status}
            onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          {(params.search || params.status) && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setParams({ page: 1, limit: 10, search: '', status: '' })}
            >
              <i className="bi bi-x me-1" />Clear Filters
            </button>
          )}
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} drivers</span>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2" />{error}
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <EmptyState icon="bi-person-badge" title="No drivers found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Employee ID</th>
                    <th>Contact</th>
                    <th>License</th>
                    <th>Expiry Date</th>
                    <th>Experience</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map((d) => {
                    const expiringSoon = isLicenseExpiringSoon(d.licenseExpiry);
                    const expired = isLicenseExpired(d.licenseExpiry);

                    return (
                      <tr key={d._id}>
                        <td>
                          <div className="fw-semibold">{d.user?.firstName} {d.user?.lastName}</div>
                          <div className="text-muted small">{d.user?.email}</div>
                        </td>
                        <td>
                          <code>{d.employeeId}</code>
                        </td>
                        <td className="small">
                          {d.user?.phone || '—'}
                        </td>
                        <td>
                          <div className="small">{d.licenseNumber}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Class {d.licenseClass}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`small ${expired ? 'text-danger fw-semibold' : expiringSoon ? 'text-warning fw-semibold' : ''}`}>
                              {formatDate(d.licenseExpiry)}
                            </span>
                            {expired && (
                              <span className="badge bg-danger">Expired</span>
                            )}
                            {expiringSoon && !expired && (
                              <span className="badge bg-warning text-dark">
                                <i className="bi bi-exclamation-triangle me-1" />Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="small">
                          <i className="bi bi-award me-1 text-muted" />
                          {d.yearsOfExperience} years
                        </td>
                        <td><StatusBadge status={d.status} /></td>
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

      {/* License Warnings */}
      {data?.data?.some(d => isLicenseExpired(d.licenseExpiry) || isLicenseExpiringSoon(d.licenseExpiry)) && (
        <div className="alert alert-warning mt-3">
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '1.5rem' }} />
            <div>
              <h6 className="fw-bold mb-1">License Expiry Alerts</h6>
              <p className="mb-0 small">
                {data.data.filter(d => isLicenseExpired(d.licenseExpiry)).length > 0 && (
                  <>
                    <strong>{data.data.filter(d => isLicenseExpired(d.licenseExpiry)).length}</strong> driver(s) have expired licenses.
                    <br />
                  </>
                )}
                {data.data.filter(d => isLicenseExpiringSoon(d.licenseExpiry) && !isLicenseExpired(d.licenseExpiry)).length > 0 && (
                  <>
                    <strong>{data.data.filter(d => isLicenseExpiringSoon(d.licenseExpiry) && !isLicenseExpired(d.licenseExpiry)).length}</strong> driver(s) have licenses expiring within 30 days.
                  </>
                )}
                <br />
                Please notify the Administrator to take action.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card mt-3 border-info">
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-info-circle text-info" style={{ fontSize: '1.5rem' }} />
            <div>
              <h6 className="fw-bold mb-1">Dispatcher View</h6>
              <p className="text-muted small mb-0">
                You can view all drivers and their status. To add or modify driver information, please contact an Administrator.
                <br />
                <strong>Active</strong> drivers are available for trip assignments. Drivers on <strong>leave</strong> or with <strong>expired licenses</strong> should not be assigned.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDrivers;
