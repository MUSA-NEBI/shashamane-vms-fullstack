import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scheduleAPI } from '../../services/scheduleService';
import { routeAPI } from '../../services/routeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, formatDuration, formatCurrency } from '../../utils/formatters';

const TripSearchPage = () => {
  const [urlParams]  = useSearchParams();
  const navigate     = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm]     = useState({
    origin:      urlParams.get('origin')      || '',
    destination: urlParams.get('destination') || '',
    date:        urlParams.get('date')        || today,
    seats:       1,
  });
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [origins,  setOrigins]  = useState([]);
  const [searched, setSearched] = useState(false);

  // Load origin suggestions
  useEffect(() => {
    routeAPI.getOrigins().then((r) => setOrigins(r.data.data || [])).catch(() => {});
    // Auto-search if URL has params
    if (urlParams.get('origin') && urlParams.get('destination') && urlParams.get('date')) {
      handleSearch(null, { origin: urlParams.get('origin'), destination: urlParams.get('destination'), date: urlParams.get('date'), seats: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e, overrideForm) => {
    if (e) e.preventDefault();
    const q = overrideForm || form;
    setLoading(true); setError(null); setSearched(true);
    try {
      const res = await scheduleAPI.search({ origin: q.origin, destination: q.destination, date: q.date, seats: q.seats });
      setResults(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Trips</h1>
          <p className="page-subtitle">Find available buses for your journey</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="card p-4 mb-4">
        <form onSubmit={handleSearch}>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">From</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-geo-alt text-primary" /></span>
                <input className="form-control" placeholder="Origin city" value={form.origin}
                  onChange={(e) => set('origin', e.target.value)} list="origins-list" required />
                <datalist id="origins-list">
                  {origins.map((o) => <option key={o} value={o} />)}
                </datalist>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">To</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-geo text-danger" /></span>
                <input className="form-control" placeholder="Destination city" value={form.destination}
                  onChange={(e) => set('destination', e.target.value)} required />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={form.date} min={today}
                onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Seats</label>
              <input type="number" className="form-control" value={form.seats} min={1} max={10}
                onChange={(e) => set('seats', +e.target.value)} />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading
                  ? <span className="spinner-border spinner-border-sm" />
                  : <><i className="bi bi-search me-1" />Search</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>}

      {loading && <LoadingSpinner message="Searching for available trips…" />}

      {!loading && searched && results !== null && (
        results.length === 0 ? (
          <EmptyState
            icon="bi-bus-front"
            title="No trips found"
            subtitle={`No available trips from ${form.origin} to ${form.destination} on ${form.date} with ${form.seats} seat(s).`}
          />
        ) : (
          <div>
            <p className="text-muted small mb-3">
              <strong>{results.length}</strong> trip{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="row g-3">
              {results.map((trip) => (
                <div key={trip._id} className="col-12">
                  <div className="card p-0 overflow-hidden" style={{ border: '1.5px solid var(--color-gray-200)' }}>
                    <div className="row g-0 align-items-center">
                      {/* Route Info */}
                      <div className="col-md-5 p-4 border-end">
                        <div className="d-flex align-items-center gap-3">
                          <div className="text-center">
                            <div className="fw-bold fs-5" style={{ color: 'var(--color-primary)' }}>
                              {new Date(trip.departureTime).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-muted small">{trip.route?.origin}</div>
                          </div>
                          <div className="flex-grow-1 text-center">
                            <div className="text-muted small mb-1">{formatDuration(trip.route?.estimatedDuration)}</div>
                            <div style={{ borderTop: '2px dashed var(--color-gray-300)', position: 'relative' }}>
                              <i className="bi bi-arrow-right position-absolute" style={{ top: -10, right: 0, color: 'var(--color-gray-400)' }} />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="fw-bold fs-5" style={{ color: 'var(--color-danger)' }}>
                              {new Date(trip.arrivalTime).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-muted small">{trip.route?.destination}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-muted small text-center">
                          {trip.route?.routeName}
                        </div>
                      </div>

                      {/* Vehicle */}
                      <div className="col-md-3 p-4 border-end text-center">
                        <div className="small text-muted mb-1">Vehicle</div>
                        <div className="fw-semibold">{trip.vehicle?.manufacturer} {trip.vehicle?.model}</div>
                        <div className="small text-muted">{trip.vehicle?.vehicleCode}</div>
                        <div className="mt-2">
                          <span className={`badge rounded-pill ${trip.availableSeats <= 5 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>

                      {/* Fare + Book */}
                      <div className="col-md-4 p-4 text-center">
                        <div className="small text-muted">Fare per seat</div>
                        <div className="fw-bold fs-4 my-1" style={{ color: 'var(--color-accent)' }}>
                          {formatCurrency(trip.fare)}
                        </div>
                        {form.seats > 1 && (
                          <div className="small text-muted mb-2">
                            Total: {formatCurrency(trip.fare * form.seats)} for {form.seats} seats
                          </div>
                        )}
                        <button
                          className="btn btn-primary px-4 py-2 fw-semibold"
                          onClick={() => navigate(`/passenger/seat/${trip._id}`, { state: { trip, seats: form.seats } })}
                          disabled={trip.availableSeats < 1}
                        >
                          {trip.availableSeats < 1 ? 'Fully Booked' : 'Select Seat'}
                          {trip.availableSeats > 0 && <i className="bi bi-arrow-right ms-2" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TripSearchPage;
