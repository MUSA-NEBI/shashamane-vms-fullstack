import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../services/bookingService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDateTime, formatCurrency, formatRelative } from '../../utils/formatters';

const BookingsPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, search:'', status:'' });
  const fetchFn = useCallback((p) => bookingAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);
  const [reason, setReason]             = useState('');

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingAPI.cancel(cancelTarget._id, { reason });
      toast.success('Booking cancelled.');
      setCancelTarget(null);
      setReason('');
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setCancelling(false); }
  };

  const STATUSES = ['pending','confirmed','cancelled','completed','no_show'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">View and manage all passenger bookings</p>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <SearchBar value={params.search} onChange={(v) => setParams({ ...params, search: v, page: 1 })} placeholder="Search reference…" />
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} bookings</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-ticket" title="No bookings found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Reference</th><th>Passenger</th><th>Route</th><th>Departure</th><th>Seat</th><th>Fare</th><th>Status</th><th>When</th><th>Action</th></tr></thead>
                <tbody>
                  {data.data.map((b) => (
                    <tr key={b._id}>
                      <td><code className="small">{b.bookingReference}</code></td>
                      <td className="small">
                        <div>{b.passenger?.firstName} {b.passenger?.lastName}</div>
                        <div className="text-muted">{b.passenger?.email}</div>
                      </td>
                      <td className="small">{b.schedule?.route?.origin} → {b.schedule?.route?.destination}</td>
                      <td className="small">{formatDateTime(b.schedule?.departureTime)}</td>
                      <td className="text-center fw-semibold">{b.seatNumber}</td>
                      <td className="small">{formatCurrency(b.fareAmount)}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td className="text-muted small">{formatRelative(b.createdAt)}</td>
                      <td>
                        {['pending','confirmed'].includes(b.status) && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelTarget(b)}>
                            Cancel
                          </button>
                        )}
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

      {cancelTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Cancel Booking</h5>
                <button className="btn-close" onClick={() => setCancelTarget(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted">Cancel booking <strong>{cancelTarget.bookingReference}</strong>?</p>
                <label className="form-label">Reason (optional)</label>
                <textarea className="form-control" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancellation…" />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setCancelTarget(null)}>Back</button>
                <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                  {cancelling && <span className="spinner-border spinner-border-sm me-2" />}Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
