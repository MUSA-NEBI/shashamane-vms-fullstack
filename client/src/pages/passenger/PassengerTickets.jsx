import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ticketAPI } from '../../services/ticketService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/formatters';

const PassengerTickets = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, status: '' });
  const fetchFn = useCallback((p) => ticketAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tickets</h1>
          <p className="page-subtitle">Your digital boarding tickets</p>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {['', 'valid', 'used', 'expired', 'cancelled'].map((s) => (
            <button key={s || 'all'}
              className={`btn btn-sm ${params.status === s ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setParams({ ...params, status: s, page: 1 })}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} tickets</span>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon="bi-qr-code" title="No tickets yet"
          subtitle="Complete a booking and payment to receive your ticket."
          action={<Link to="/passenger/search" className="btn btn-primary btn-sm">Book a Trip</Link>} />
      ) : (
        <div className="row g-3">
          {data.data.map((t) => (
            <div key={t._id} className="col-md-6 col-lg-4">
              <Link to={`/passenger/tickets/${t._id}`} className="text-decoration-none">
                <div className="card p-4 h-100" style={{
                  border: t.status === 'valid' ? '2px solid var(--color-success)' : '1px solid var(--color-gray-200)',
                }}>
                  {/* QR preview placeholder */}
                  <div className="text-center mb-3 p-3 rounded-3" style={{ background: 'var(--color-gray-50)' }}>
                    <i className="bi bi-qr-code" style={{ fontSize: '3rem', color: t.status === 'valid' ? 'var(--color-primary)' : 'var(--color-gray-400)' }} />
                    <div className="mt-1">
                      <code className="small">{t.ticketNumber}</code>
                    </div>
                  </div>
                  <div className="fw-bold mb-1">
                    {t.schedule?.route?.origin} → {t.schedule?.route?.destination}
                  </div>
                  <div className="small text-muted mb-2">
                    <i className="bi bi-calendar me-1" />
                    {formatDateTime(t.schedule?.departureTime)}
                  </div>
                  <div className="small text-muted mb-3">
                    <i className="bi bi-cursor me-1" />Seat {t.seatNumber}
                  </div>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <StatusBadge status={t.status} />
                    <span className="small text-primary">View <i className="bi bi-arrow-right" /></span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          <div className="col-12">
            <div className="table-container">
              <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerTickets;
