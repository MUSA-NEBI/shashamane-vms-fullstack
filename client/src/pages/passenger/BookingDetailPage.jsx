import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../services/bookingService';
import { paymentAPI } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDateTime, formatCurrency, formatDuration } from '../../utils/formatters';

const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Cash', icon: 'bi-cash' },
  { value: 'mobile_money', label: 'Mobile Money', icon: 'bi-phone' },
  { value: 'card',         label: 'Card', icon: 'bi-credit-card' },
  { value: 'bank_transfer',label: 'Bank Transfer', icon: 'bi-bank' },
];

const BookingDetailPage = () => {
  const { id }     = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();
  const justBooked = location.state?.justBooked;

  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [method,   setMethod]   = useState('cash');
  const [paying,   setPaying]   = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDlg, setShowCancelDlg] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getOne(id);
      setBooking(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      // Step 1: initiate
      const initRes = await paymentAPI.initiate({ bookingId: id, method });
      const paymentId = initRes.data.data._id;

      // Step 2: confirm (dev/cash flow — in production this would be a gateway redirect)
      await paymentAPI.confirm(paymentId, {});
      toast.success('Payment confirmed! Your ticket has been issued.');
      fetchBooking(); // Refresh to show ticket
    } catch (err) {
      toast.error(err.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingAPI.cancel(id, { reason: 'Cancelled by passenger' });
      toast.success('Booking cancelled.');
      setShowCancelDlg(false);
      fetchBooking();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading booking…" />;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!booking) return null;

  const { schedule, payment, ticket } = booking;
  const route = schedule?.route;
  const isPending   = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={() => navigate('/passenger/bookings')}>
        <i className="bi bi-arrow-left me-2" />My Bookings
      </button>

      {justBooked && (
        <div className="alert alert-success border-0 rounded-3 mb-4">
          <i className="bi bi-check-circle-fill me-2" />
          <strong>Seat reserved!</strong> Complete your payment below to confirm the booking and receive your ticket.
        </div>
      )}

      {/* Header card */}
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="fw-bold mb-1">{route?.origin} → {route?.destination}</h5>
            <div className="text-muted small">{route?.routeName}</div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="small text-muted">Booking Ref</div>
            <code className="fw-bold">{booking.bookingReference}</code>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Seat</div>
            <div className="fw-bold fs-4">{booking.seatNumber}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Departure</div>
            <div className="fw-semibold small">{formatDateTime(schedule?.departureTime)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Duration</div>
            <div className="fw-semibold small">{formatDuration(route?.estimatedDuration)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Vehicle</div>
            <div className="fw-semibold small">{schedule?.vehicle?.vehicleCode}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Fare</div>
            <div className="fw-bold" style={{ color: 'var(--color-accent)' }}>{formatCurrency(booking.fareAmount)}</div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {isPending && (
        <div className="card p-4 mb-4">
          <h6 className="fw-bold mb-3"><i className="bi bi-credit-card me-2" />Complete Payment</h6>
          <p className="text-muted small mb-3">
            Select your payment method and confirm. In development mode, payments are confirmed instantly.
          </p>

          <div className="row g-2 mb-4">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.value} className="col-6 col-md-3">
                <label
                  className="d-block p-3 rounded-3 text-center cursor-pointer"
                  style={{
                    border: `2px solid ${method === m.value ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                    background: method === m.value ? 'rgba(30,58,95,0.06)' : 'white',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  <input type="radio" className="d-none" value={m.value} checked={method === m.value}
                    onChange={() => setMethod(m.value)} />
                  <i className={`bi ${m.icon} d-block mb-1`} style={{ fontSize: '1.4rem', color: method === m.value ? 'var(--color-primary)' : 'var(--color-gray-500)' }} />
                  <div className="small fw-semibold">{m.label}</div>
                </label>
              </div>
            ))}
          </div>

          <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-3"
            style={{ background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)' }}>
            <span className="fw-semibold">Amount Due</span>
            <span className="fw-bold fs-5" style={{ color: 'var(--color-accent)' }}>
              {formatCurrency(booking.fareAmount)}
            </span>
          </div>

          <button className="btn btn-primary w-100 py-3 fw-semibold" onClick={handlePayment} disabled={paying}>
            {paying
              ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
              : <><i className="bi bi-lock me-2" />Pay {formatCurrency(booking.fareAmount)}</>
            }
          </button>

          <div className="text-center mt-3">
            <button className="btn btn-link text-danger small" onClick={() => setShowCancelDlg(true)}>
              Cancel this booking
            </button>
          </div>
        </div>
      )}

      {/* Payment Info (when paid) */}
      {payment && (
        <div className="card p-4 mb-4">
          <h6 className="fw-bold mb-3"><i className="bi bi-receipt me-2" />Payment Receipt</h6>
          <div className="row g-2 small">
            <div className="col-6 col-md-4">
              <div className="text-muted">Reference</div>
              <code>{payment.paymentReference}</code>
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted">Amount</div>
              <div className="fw-semibold">{formatCurrency(payment.amount)}</div>
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted">Method</div>
              <div className="text-capitalize">{payment.method?.replace(/_/g, ' ')}</div>
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted">Status</div>
              <StatusBadge status={payment.status} />
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted">Paid At</div>
              <div>{formatDateTime(payment.paidAt)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket */}
      {ticket && (
        <div className="card p-4 mb-4" style={{ border: '2px solid var(--color-success)' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-ticket-perforated-fill text-success fs-4" />
            <h6 className="fw-bold mb-0 text-success">Your Ticket is Ready</h6>
          </div>
          <div className="text-center mb-3">
            <code className="fw-bold fs-5">{ticket.ticketNumber}</code>
          </div>
          <Link to={`/passenger/tickets/${ticket._id}`} className="btn btn-success w-100">
            <i className="bi bi-qr-code me-2" />View & Download Ticket
          </Link>
        </div>
      )}

      {/* Cancel button for confirmed bookings */}
      {isConfirmed && !ticket && (
        <div className="text-center">
          <button className="btn btn-outline-danger btn-sm" onClick={() => setShowCancelDlg(true)}>
            Cancel Booking
          </button>
        </div>
      )}

      {isCancelled && (
        <div className="alert alert-danger border-0 rounded-3">
          <i className="bi bi-x-circle me-2" />
          This booking was cancelled{booking.cancellationReason ? `: ${booking.cancellationReason}` : ''}.
        </div>
      )}

      <ConfirmDialog
        open={showCancelDlg}
        title="Cancel Booking"
        message={`Cancel booking ${booking.bookingReference}? Your seat will be released.`}
        danger
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDlg(false)}
      />
    </div>
  );
};

export default BookingDetailPage;
