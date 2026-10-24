import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../services/bookingService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDateTime, formatCurrency, formatRelative, formatDate } from '../../utils/formatters';

const DispatcherBookings = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: '' });
  const fetchFn = useCallback((p) => bookingAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [viewDetails, setViewDetails] = useState(null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingAPI.cancel(cancelTarget._id, { reason });
      toast.success('Booking cancelled successfully.');
      setCancelTarget(null);
      setReason('');
      refetch(params);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

  // Count bookings by status
  const bookingsByStatus = data?.data?.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-ticket-perforated me-2" />Booking Management
          </h1>
          <p className="page-subtitle">View and manage passenger bookings</p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Pending', status: 'pending', icon: 'bi-hourglass-split', color: '#ffc107' },
          { label: 'Confirmed', status: 'confirmed', icon: 'bi-check-circle', color: 'var(--color-success)' },
          { label: 'Cancelled', status: 'cancelled', icon: 'bi-x-circle', color: '#dc3545' },
          { label: 'Completed', status: 'completed', icon: 'bi-flag-fill', color: '#6c757d' },
        ].map((item) => (
          <div key={item.status} className="col-md-3">
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
                  <div className="stat-card-value mt-1">{bookingsByStatus[item.status] || 0}</div>
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
            placeholder="Search reference, passenger…"
          />
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={params.status}
            onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          {(params.search || params.status) && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setParams({ page: 1, limit: 10, search: '', status: '' })}
            >
              <i className="bi bi-x me-1" />Clear Filters
            </button>
          )}
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} bookings</span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2" />{error}
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <EmptyState icon="bi-ticket" title="No bookings found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Passenger</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Seat</th>
                    <th>Fare</th>
                    <th>Status</th>
                    <th>Booked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map((b) => (
                    <tr key={b._id}>
                      <td>
                        <code className="small fw-semibold">{b.bookingReference}</code>
                      </td>
                      <td className="small">
                        <div className="fw-semibold">{b.passenger?.firstName} {b.passenger?.lastName}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{b.passenger?.email}</div>
                      </td>
                      <td className="small">
                        <div>{b.schedule?.route?.routeName || '—'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {b.schedule?.route?.origin} → {b.schedule?.route?.destination}
                        </div>
                      </td>
                      <td className="small">
                        <div>{formatDate(b.schedule?.departureTime, 'MMM dd')}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatDate(b.schedule?.departureTime, 'HH:mm')}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-primary">{b.seatNumber}</span>
                      </td>
                      <td className="small">{formatCurrency(b.fareAmount)}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td className="text-muted small">{formatRelative(b.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => setViewDetails(b)}
                            title="View details"
                          >
                            <i className="bi bi-eye" />
                          </button>
                          {['pending', 'confirmed'].includes(b.status) && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setCancelTarget(b)}
                              title="Cancel booking"
                            >
                              <i className="bi bi-x-circle" />
                            </button>
                          )}
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

      {/* Cancel Booking Modal */}
      {cancelTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-x-circle text-danger me-2" />Cancel Booking
                </h5>
                <button className="btn-close" onClick={() => setCancelTarget(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2" />
                  This action will cancel the booking and release the seat.
                </div>
                <p className="text-muted mb-3">
                  Cancel booking <strong>{cancelTarget.bookingReference}</strong> for{' '}
                  <strong>{cancelTarget.passenger?.firstName} {cancelTarget.passenger?.lastName}</strong>?
                </p>
                <label className="form-label fw-semibold">Cancellation Reason</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for cancellation (required)..."
                  required
                />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setCancelTarget(null)}>
                  Back
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={cancelling || !reason.trim()}
                >
                  {cancelling && <span className="spinner-border spinner-border-sm me-2" />}
                  <i className="bi bi-x-circle me-1" />
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetails && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-ticket-detailed me-2" />Booking Details
                </h5>
                <button className="btn-close" onClick={() => setViewDetails(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Reference Number</label>
                    <div className="fw-bold">{viewDetails.bookingReference}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Status</label>
                    <div><StatusBadge status={viewDetails.status} /></div>
                  </div>
                  <div className="col-12"><hr /></div>
                  <div className="col-md-6">
                    <label className="text-muted small">Passenger Name</label>
                    <div className="fw-semibold">
                      {viewDetails.passenger?.firstName} {viewDetails.passenger?.lastName}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Contact</label>
                    <div>{viewDetails.passenger?.email}</div>
                    <div className="small">{viewDetails.passenger?.phone}</div>
                  </div>
                  <div className="col-12"><hr /></div>
                  <div className="col-md-12">
                    <label className="text-muted small">Route</label>
                    <div className="fw-semibold">{viewDetails.schedule?.route?.routeName}</div>
                    <div className="text-muted small">
                      {viewDetails.schedule?.route?.origin} → {viewDetails.schedule?.route?.destination}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Departure</label>
                    <div>{formatDateTime(viewDetails.schedule?.departureTime)}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Vehicle</label>
                    <div>{viewDetails.schedule?.vehicle?.vehicleCode}</div>
                    <div className="small text-muted">
                      {viewDetails.schedule?.vehicle?.manufacturer} {viewDetails.schedule?.vehicle?.model}
                    </div>
                  </div>
                  <div className="col-12"><hr /></div>
                  <div className="col-md-4">
                    <label className="text-muted small">Seat Number</label>
                    <div className="fs-4 fw-bold text-primary">{viewDetails.seatNumber}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Fare Amount</label>
                    <div className="fs-5 fw-bold">{formatCurrency(viewDetails.fareAmount)}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Payment Status</label>
                    <div><StatusBadge status={viewDetails.paymentStatus || 'pending'} /></div>
                  </div>
                  <div className="col-12"><hr /></div>
                  <div className="col-md-6">
                    <label className="text-muted small">Booked On</label>
                    <div>{formatDateTime(viewDetails.createdAt)}</div>
                  </div>
                  {viewDetails.cancelledAt && (
                    <div className="col-md-6">
                      <label className="text-muted small">Cancelled On</label>
                      <div className="text-danger">{formatDateTime(viewDetails.cancelledAt)}</div>
                    </div>
                  )}
                  {viewDetails.cancellationReason && (
                    <div className="col-12">
                      <label className="text-muted small">Cancellation Reason</label>
                      <div className="text-danger">{viewDetails.cancellationReason}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setViewDetails(null)}>
                  Close
                </button>
              </div>
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
              <h6 className="fw-bold mb-1">Booking Management</h6>
              <p className="text-muted small mb-0">
                You can view all bookings and cancel them if needed. Cancellations will automatically release the seat and notify the passenger.
                <br />
                <strong>Pending</strong> bookings are awaiting payment confirmation. <strong>Confirmed</strong> bookings have been paid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherBookings;
