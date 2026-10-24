import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../../services/ticketService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatDuration, formatCurrency } from '../../utils/formatters';

const TicketDetailPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const printRef  = useRef(null);

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    ticketAPI.getOne(id)
      .then((r) => setTicket(r.data.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner message="Loading ticket…" />;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!ticket) return null;

  const route   = ticket.schedule?.route;
  const vehicle = ticket.schedule?.vehicle;
  const driver  = ticket.schedule?.driver;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/passenger/tickets')}>
          <i className="bi bi-arrow-left me-2" />My Tickets
        </button>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1" />Print
          </button>
        </div>
      </div>

      {/* Ticket Card */}
      <div ref={printRef} className="card overflow-hidden" style={{
        border: ticket.status === 'valid' ? '2px solid var(--color-success)' : '1px solid var(--color-gray-300)',
      }}>
        {/* Header */}
        <div style={{ background: 'var(--color-primary)', padding: '1.5rem' }}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="text-white opacity-75 small mb-1">BOARDING TICKET</div>
              <div className="text-white fw-bold fs-5">
                {route?.origin} → {route?.destination}
              </div>
              <div className="text-white opacity-75 small mt-1">{route?.routeName}</div>
            </div>
            <div className="text-end">
              <StatusBadge status={ticket.status} />
              <div className="text-white opacity-75 small mt-2">Seat</div>
              <div className="text-white fw-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>
                {ticket.seatNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* QR Code */}
          {ticket.qrCode && (
            <div className="text-center mb-4">
              <img
                src={ticket.qrCode}
                alt="Ticket QR Code"
                style={{ width: 180, height: 180, border: '4px solid var(--color-gray-100)', borderRadius: 8 }}
              />
              <div className="mt-2">
                <code className="fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  {ticket.ticketNumber}
                </code>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="position-relative my-4">
            <hr />
            <div className="position-absolute top-50 start-50 translate-middle bg-white px-2">
              <i className="bi bi-scissors text-muted" />
            </div>
          </div>

          {/* Trip Details */}
          <div className="row g-3 mb-4">
            <div className="col-6">
              <div className="small text-muted mb-1">Departure</div>
              <div className="fw-semibold small">{formatDateTime(ticket.schedule?.departureTime)}</div>
            </div>
            <div className="col-6">
              <div className="small text-muted mb-1">Arrival (est.)</div>
              <div className="fw-semibold small">{formatDateTime(ticket.schedule?.arrivalTime)}</div>
            </div>
            <div className="col-6">
              <div className="small text-muted mb-1">Duration</div>
              <div className="fw-semibold small">{formatDuration(route?.estimatedDuration)}</div>
            </div>
            <div className="col-6">
              <div className="small text-muted mb-1">Fare</div>
              <div className="fw-semibold small">{formatCurrency(ticket.booking?.fareAmount)}</div>
            </div>
          </div>

          {/* Passenger */}
          <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--color-gray-50)' }}>
            <div className="row g-2 small">
              <div className="col-6">
                <div className="text-muted">Passenger</div>
                <div className="fw-semibold">{ticket.passenger?.firstName} {ticket.passenger?.lastName}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Booking Ref</div>
                <code className="fw-semibold">{ticket.booking?.bookingReference}</code>
              </div>
              {vehicle && (
                <div className="col-6">
                  <div className="text-muted">Vehicle</div>
                  <div className="fw-semibold">{vehicle.vehicleCode} — {vehicle.model}</div>
                </div>
              )}
              {driver && (
                <div className="col-6">
                  <div className="text-muted">Driver</div>
                  <div className="fw-semibold">{driver.user?.firstName} {driver.user?.lastName}</div>
                </div>
              )}
            </div>
          </div>

          {ticket.status === 'used' && (
            <div className="alert alert-secondary border-0 text-center small mb-0">
              <i className="bi bi-check2-all me-2" />Ticket used at {formatDateTime(ticket.usedAt)}
            </div>
          )}

          {ticket.status === 'valid' && (
            <div className="alert alert-success border-0 text-center small mb-0">
              <i className="bi bi-shield-check me-2" />
              This is a valid ticket. Present QR code at boarding.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-top" style={{ background: 'var(--color-gray-50)' }}>
          <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>
            Shashamane Vehicle Management System · {route?.origin}, Ethiopia · Issued {formatDateTime(ticket.issuedAt)}
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
};

export default TicketDetailPage;
