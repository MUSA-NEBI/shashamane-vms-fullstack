import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/bookingService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime, formatCurrency, formatRelative } from '../../utils/formatters';

const PassengerBookings = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, status: '' });
  const fetchFn = useCallback((p) => bookingAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">All your trip reservations</p>
        </div>
        <Link to="/passenger/search" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />Book New Trip
        </Link>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <div className="d-flex gap-2 flex-wrap">
            {['', ...STATUSES].map((s) => (
              <button
                key={s || 'all'}
                className={`btn btn-sm ${params.status === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setParams({ ...params, status: s, page: 1 })}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
          <span className="ms-auto text-muted small">{data?.pagination?.total ?? 0} bookings</span>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon="bi-ticket"
          title="No bookings yet"
          subtitle="Search for available trips and book your first seat."
          action={<Link to="/passenger/search" className="btn btn-primary btn-sm">Search Trips</Link>}
        />
      ) : (
        <div className="row g-3">
          {data.data.map((b) => (
            <div key={b._id} className="col-12">
              <Link to={`/passenger/bookings/${b._id}`} className="text-decoration-none">
                <div className="card p-0 overflow-hidden" style={{ transition: 'box-shadow 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}>
                  <div className="row g-0 align-items-center">
                    {/* Status strip */}
                    <div className="col-auto" style={{
                      width: 6,
                      background: b.status === 'confirmed' ? 'var(--color-success)'
                        : b.status === 'pending' ? 'var(--color-warning)'
                        : b.status === 'cancelled' ? 'var(--color-danger)'
                        : 'var(--color-gray-300)',
                      alignSelf: 'stretch',
                    }} />
                    <div className="col p-3 p-md-4">
                      <div className="row align-items-center g-2">
                        <div className="col-md-5">
                          <div className="fw-bold">
                            {b.schedule?.route?.origin}
                            <i className="bi bi-arrow-right mx-2 text-muted" />
                            {b.schedule?.route?.destination}
                          </div>
                          <div className="text-muted small mt-1">
                            <i className="bi bi-calendar me-1" />
                            {formatDateTime(b.schedule?.departureTime)}
                          </div>
                        </div>
                        <div className="col-6 col-md-2 text-center">
                          <div className="text-muted small">Seat</div>
                          <div className="fw-bold fs-4">{b.seatNumber}</div>
                        </div>
                        <div className="col-6 col-md-2 text-center">
                          <div className="text-muted small">Fare</div>
                          <div className="fw-semibold">{formatCurrency(b.fareAmount)}</div>
                        </div>
                        <div className="col-6 col-md-2 text-center">
                          <StatusBadge status={b.status} />
                          <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                            {formatRelative(b.createdAt)}
                          </div>
                        </div>
                        <div className="col-6 col-md-1 text-end">
                          <i className="bi bi-chevron-right text-muted" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          <div className="table-container mt-2">
            <Pagination pagination={data.pagination} onPageChange={(p) => setParams({ ...params, page: p })} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerBookings;
