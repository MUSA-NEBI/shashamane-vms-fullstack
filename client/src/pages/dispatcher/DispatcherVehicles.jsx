import { useState, useCallback } from 'react';
import { vehicleAPI } from '../../services/vehicleService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

const DispatcherVehicles = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const fetchFn = useCallback((p) => vehicleAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  const STATUS_OPTIONS = ['active','maintenance','inactive'];
  
  // Count vehicles by status
  const vehiclesByStatus = data?.data?.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-bus-front me-2" />Fleet Management
          </h1>
          <p className="page-subtitle">View vehicle status and availability</p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Active', status: 'active', icon: 'bi-check-circle', color: 'var(--color-success)' },
          { label: 'In Maintenance', status: 'maintenance', icon: 'bi-wrench', color: '#ffc107' },
          { label: 'Inactive', status: 'inactive', icon: 'bi-x-circle', color: '#dc3545' },
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
                  <div className="stat-card-value mt-1">{vehiclesByStatus[item.status] || 0}</div>
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
            placeholder="Search code, plate, model…" 
          />
          <select 
            className="form-select form-select-sm" 
            style={{ width: 'auto' }}
            value={params.status} 
            onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(params.search || params.status) && (
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => setParams({ page: 1, limit: 10, search: '', status: '' })}
            >
              <i className="bi bi-x me-1" />Clear Filters
            </button>
          )}
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} vehicles</span>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2" />{error}
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <EmptyState icon="bi-bus-front" title="No vehicles found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Vehicle Code</th>
                    <th>Plate Number</th>
                    <th>Details</th>
                    <th>Capacity</th>
                    <th>Fuel Type</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map((v) => (
                    <tr key={v._id}>
                      <td>
                        <code className="fw-semibold">{v.vehicleCode}</code>
                      </td>
                      <td className="fw-semibold">{v.plateNumber}</td>
                      <td>
                        <div className="fw-semibold small">{v.manufacturer} {v.model}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {v.year}{v.color ? ` • ${v.color}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-people me-1" />{v.capacity} seats
                        </span>
                      </td>
                      <td className="text-capitalize small">
                        <i className="bi bi-fuel-pump me-1 text-muted" />
                        {v.fuelType}
                      </td>
                      <td><StatusBadge status={v.status} /></td>
                      <td className="small text-muted" style={{ maxWidth: '200px' }}>
                        {v.description || '—'}
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

      {/* Info Card */}
      <div className="card mt-3 border-info">
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-info-circle text-info" style={{ fontSize: '1.5rem' }} />
            <div>
              <h6 className="fw-bold mb-1">Dispatcher View</h6>
              <p className="text-muted small mb-0">
                You can view all vehicles and their status. To add or modify vehicles, please contact an Administrator.
                <br />
                <strong>Active</strong> vehicles are available for scheduling. <strong>Maintenance</strong> vehicles are temporarily unavailable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherVehicles;
