import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ticketAPI } from '../../services/ticketService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { formatDateTime, formatRelative } from '../../utils/formatters';

const TicketsPage = () => {
  const [params, setParams] = useState({ page:1, limit:10, status:'' });
  const fetchFn = useCallback((p) => ticketAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [validating, setValidating] = useState(false);
  const [ticketNum, setTicketNum]   = useState('');
  const [valResult, setValResult]   = useState(null);

  const handleValidate = async (e) => {
    e.preventDefault();
    setValidating(true);
    setValResult(null);
    try {
      const res = await ticketAPI.validate({ ticketNumber: ticketNum.toUpperCase() });
      setValResult(res.data.data);
    } catch (err) { toast.error(err.message); }
    finally { setValidating(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">View issued tickets and validate at boarding</p>
        </div>
      </div>

      {/* Ticket Validator */}
      <div className="card p-4 mb-4">
        <h6 className="fw-bold mb-3"><i className="bi bi-qr-code me-2" />Ticket Validator</h6>
        <form onSubmit={handleValidate} className="d-flex gap-2 align-items-end flex-wrap">
          <div style={{ flex: 1, minWidth: 240 }}>
            <label className="form-label">Ticket Number</label>
            <input className="form-control" value={ticketNum} onChange={(e) => setTicketNum(e.target.value)}
              placeholder="e.g. TK-M2XZ3K-A1B2C3" required style={{ fontFamily: 'monospace' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={validating}>
            {validating ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check2-circle me-2" />}
            Validate
          </button>
        </form>

        {valResult && (
          <div className={`alert mt-3 mb-0 rounded-3 border-0 ${valResult.valid ? 'alert-success' : 'alert-danger'}`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi fs-4 ${valResult.valid ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
              <div>
                <strong>{valResult.valid ? 'Valid Ticket' : 'Invalid Ticket'}</strong>
                {!valResult.valid && valResult.reason && <div className="small">{valResult.reason}</div>}
                {valResult.valid && valResult.ticket && (
                  <div className="small">
                    Passenger: {valResult.ticket.passenger?.firstName} {valResult.ticket.passenger?.lastName} ·
                    Seat {valResult.ticket.seatNumber} ·
                    {valResult.ticket.schedule?.route?.origin} → {valResult.ticket.schedule?.route?.destination}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <select className="form-select form-select-sm" style={{ width: 'auto' }}
            value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            {['valid','used','cancelled','expired'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} tickets</span>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="bi-qr-code" title="No tickets found" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Ticket #</th><th>Passenger</th><th>Route</th><th>Departure</th><th>Seat</th><th>Status</th><th>Issued</th></tr></thead>
                <tbody>
                  {data.data.map((t) => (
                    <tr key={t._id}>
                      <td><code className="small">{t.ticketNumber}</code></td>
                      <td className="small">{t.passenger?.firstName} {t.passenger?.lastName}</td>
                      <td className="small">{t.schedule?.route?.origin} → {t.schedule?.route?.destination}</td>
                      <td className="small">{formatDateTime(t.schedule?.departureTime)}</td>
                      <td className="text-center fw-semibold">{t.seatNumber}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="text-muted small">{formatRelative(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
          </>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
