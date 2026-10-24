import { useState, useCallback } from 'react';
import { scheduleAPI } from '../../services/scheduleService';
import useFetch from '../../hooks/useFetch';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, formatDuration, formatCurrency } from '../../utils/formatters';

const DriverTrips = () => {
  const [params, setParams] = useState({ page: 1, limit: 20, upcoming: 'true' });
  const fetchFn = useCallback((p) => scheduleAPI.getAll(p), []);
  const { data, isLoading, error } = useFetch(fetchFn, params, [JSON.stringify(params)]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">Your assigned trip schedule</p>
        </div>
        <div className="form-check form-switch mt-1">
          <input className="form-check-input" type="checkbox" id="upcomingOnly"
            checked={params.upcoming === 'true'}
            onChange={(e) => setParams({ ...params, upcoming: e.target.checked ? 'true' : '', page: 1 })} />
          <label className="form-check-label small" htmlFor="upcomingOnly">Upcoming only</label>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon="bi-calendar3" title="No trips found" subtitle="You have no scheduled trips." />
      ) : (
        <div className="row g-3">
          {data.data.map((trip) => {
            const bookedCount = trip.bookedSeats?.length || 0;
            const capacity    = trip.vehicle?.capacity || 0;
            const fillPct     = capacity ? Math.round((bookedCount / capacity) * 100) : 0;

            return (
              <div key={trip._id} className="col-md-6 col-lg-4">
                <div className="card p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="fw-bold">{trip.route?.origin}</div>
                      <div className="text-muted small d-flex align-items-center gap-1">
                        <i className="bi bi-arrow-down" />
                      </div>
                      <div className="fw-bold">{trip.route?.destination}</div>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>

                  <div className="row g-2 small text-muted mb-3">
                    <div className="col-12">
                      <i className="bi bi-calendar-event me-2 text-primary" />
                      <strong className="text-dark">{formatDateTime(trip.departureTime)}</strong>
                    </div>
                    <div className="col-6">
                      <i className="bi bi-clock me-1" />
                      {formatDuration(trip.route?.estimatedDuration)}
                    </div>
                    <div className="col-6">
                      <i className="bi bi-cash me-1" />
                      {formatCurrency(trip.fare)}
                    </div>
                    <div className="col-12">
                      <i className="bi bi-bus-front me-2" />
                      {trip.vehicle?.vehicleCode} — {trip.vehicle?.manufacturer} {trip.vehicle?.model}
                    </div>
                    <div className="col-12">
                      <i className="bi bi-hash me-2" />{trip.vehicle?.plateNumber}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Passengers booked</span>
                      <span className="fw-semibold">{bookedCount}/{capacity}</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className={`progress-bar ${fillPct > 80 ? 'bg-danger' : fillPct > 50 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverTrips;
