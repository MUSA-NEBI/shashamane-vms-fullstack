import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/paymentService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime, formatCurrency, formatRelative } from '../../utils/formatters';

const PaymentsPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, status:'' });
  const fetchFn = useCallback((p) => paymentAPI.getAll(p), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [refunding, setRefunding] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading]     = useState(false);

  const handleRefund = async () => {
    setLoading(true);
    try {
      await paymentAPI.refund(refunding._id, { reason: refundReason });
      toast.success('Payment refunded.');
      setRefunding(null);
      setRefundReason('');
      refetch(params);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const STATUSES = ['pending','completed','failed','refunded'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track all payment transactions</p>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} payments</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-credit-card" title="No payments found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Reference</th><th>Passenger</th><th>Booking</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid At</th><th>Action</th></tr></thead>
                <tbody>
                  {data.data.map((p) => (
                    <tr key={p._id}>
                      <td><code className="small">{p.paymentReference}</code></td>
                      <td className="small">{p.passenger?.firstName} {p.passenger?.lastName}</td>
                      <td><code className="small">{p.booking?.bookingReference || '—'}</code></td>
                      <td className="fw-semibold small">{formatCurrency(p.amount)}</td>
                      <td className="text-capitalize small">{p.method?.replace(/_/g,' ')}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="small text-muted">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</td>
                      <td>
                        {p.status === 'completed' && (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => setRefunding(p)}>
                            Refund
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

      {refunding && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Refund Payment</h5>
                <button className="btn-close" onClick={() => setRefunding(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Refund <strong>{formatCurrency(refunding.amount)}</strong> for payment <strong>{refunding.paymentReference}</strong>?</p>
                <label className="form-label">Reason</label>
                <textarea className="form-control" rows={2} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund…" />
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light" onClick={() => setRefunding(null)}>Cancel</button>
                <button className="btn btn-warning" onClick={handleRefund} disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2" />}Confirm Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
