import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/dashboardService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatDuration } from '../../utils/formatters';

const DriverDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    dashboardAPI.getDriver()
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading…" />;
  if (error)   return <div className="alert alert-danger">{error}</div>;

  const { trips=[], totalTrips=0 } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Dashboard</h1>
          <p className="page-subtitle">Your upcoming trip assignments</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-card-label">Upcoming Trips</div>
            <div className="stat-card-value mt-1">{trips.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-card-label">Completed Trips</div>
            <div className="stat-card-value mt-1">{totalTrips}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="d-flex justify-content-between align-items-center p-4 pb-0">
          <h6 className="fw-bold mb-0">Upcoming Assignments</h6>
          <Link to="/driver/trips" className="small text-primary">View all</Link>
        </div>
        {trips.length === 0 ? (
          <div className="text-center text-muted py-5 small">No upcoming trips assigned.</div>
        ) : (
          <div className="row g-3 p-4">
            {trips.map((t) => (
              <div key={t._id} className="col-md-6">
                <div className="border rounded-3 p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-semibold">{t.route?.origin} → {t.route?.destination}</div>
                      <div className="text-muted small">{t.route?.routeName}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="row g-2 small text-muted">
                    <div className="col-6"><i className="bi bi-clock me-1" />{formatDateTime(t.departureTime)}</div>
                    <div className="col-6"><i className="bi bi-hourglass me-1" />{formatDuration(t.route?.estimatedDuration)}</div>
                    <div className="col-6"><i className="bi bi-bus-front me-1" />{t.vehicle?.vehicleCode} ({t.vehicle?.model})</div>
                    <div className="col-6"><i className="bi bi-people me-1" />{t.vehicle?.capacity} seats</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
