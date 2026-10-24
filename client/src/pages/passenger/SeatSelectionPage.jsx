import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { scheduleAPI } from '../../services/scheduleService';
import { bookingAPI } from '../../services/bookingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime, formatCurrency, formatDuration } from '../../utils/formatters';

const SeatSelectionPage = () => {
  const { scheduleId } = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();

  const [seatMap,   setSeatMap]   = useState(null);
  const [schedule,  setSchedule]  = useState(location.state?.trip || null);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [booking,   setBooking]   = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mapRes, schedRes] = await Promise.all([
          scheduleAPI.getSeatMap(scheduleId),
          schedule ? Promise.resolve(null) : scheduleAPI.getOne(scheduleId),
        ]);
        setSeatMap(mapRes.data.data);
        if (!schedule && schedRes) setSchedule(schedRes.data.data);
      } catch (err) {
        toast.error('Failed to load seat map.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const handleBook = async () => {
    if (!selected) { toast.warning('Please select a seat first.'); return; }
    setBooking(true);
    try {
      const res = await bookingAPI.create({ scheduleId, seatNumber: selected });
      const booking = res.data.data;
      toast.success(`Seat ${selected} reserved! Booking ref: ${booking.bookingReference}`);
      navigate(`/passenger/bookings/${booking._id}`, { state: { justBooked: true } });
    } catch (err) {
      toast.error(err.message || 'Booking failed. The seat may have just been taken.');
      // Refresh seat map on failure — the seat may now be taken
      scheduleAPI.getSeatMap(scheduleId)
        .then((r) => { setSeatMap(r.data.data); setSelected(null); })
        .catch(() => {});
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading seat map…" />;

  const route = schedule?.route;

  return (
    <div>
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-2" />Back to Results
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Select Your Seat</h1>
          <p className="page-subtitle">
            {route?.origin} → {route?.destination} · {formatDateTime(schedule?.departureTime)}
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Seat Map */}
        <div className="col-lg-7">
          <div className="card p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-grid-3x3 me-2" />Seat Layout
              <span className="text-muted fw-normal small ms-2">
                {seatMap?.availableCount} of {seatMap?.capacity} seats available
              </span>
            </h6>

            {/* Legend */}
            <div className="d-flex gap-3 mb-4 flex-wrap">
              {[
                { color: 'white', border: '2px solid var(--color-gray-300)', label: 'Available' },
                { color: 'var(--color-primary)', border: 'none', label: 'Selected', textColor: 'white' },
                { color: 'var(--color-gray-200)', border: '2px solid var(--color-gray-200)', label: 'Booked', textColor: 'var(--color-gray-400)' },
              ].map((l) => (
                <div key={l.label} className="d-flex align-items-center gap-2">
                  <div style={{
                    width: 24, height: 24, borderRadius: 4,
                    background: l.color, border: l.border,
                  }} />
                  <span className="small text-muted">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Bus front indicator */}
            <div className="text-center mb-3">
              <span className="badge bg-secondary px-3 py-2 rounded-pill">
                <i className="bi bi-bus-front me-1" /> Driver
              </span>
            </div>

            {/* Seat Grid — 4 columns (2+aisle+2 layout) */}
            <div style={{ maxWidth: 340, margin: '0 auto' }}>
              {seatMap?.seats && (() => {
                const rows = [];
                const seats = seatMap.seats;
                for (let i = 0; i < seats.length; i += 4) {
                  rows.push(seats.slice(i, i + 4));
                }
                return rows.map((row, ri) => (
                  <div key={ri} className="d-flex gap-1 justify-content-center mb-1">
                    {row.map((seat, ci) => (
                      <>
                        {ci === 2 && <div style={{ width: 20 }} key="aisle" />}
                        <button
                          key={seat.seatNumber}
                          className={`seat-btn ${seat.isBooked ? 'booked' : selected === seat.seatNumber ? 'selected' : 'available'}`}
                          style={{ width: 52, height: 52 }}
                          disabled={seat.isBooked}
                          onClick={() => !seat.isBooked && setSelected(seat.seatNumber)}
                          title={seat.isBooked ? 'Booked' : `Seat ${seat.seatNumber}`}
                        >
                          {seat.isBooked
                            ? <i className="bi bi-x" />
                            : seat.seatNumber
                          }
                        </button>
                      </>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="col-lg-5">
          <div className="card p-4">
            <h6 className="fw-bold mb-4">Booking Summary</h6>

            <div className="mb-3 pb-3 border-bottom">
              <div className="small text-muted mb-1">Route</div>
              <div className="fw-semibold">{route?.routeName || `${route?.origin} → ${route?.destination}`}</div>
            </div>
            <div className="mb-3 pb-3 border-bottom row g-2">
              <div className="col-6">
                <div className="small text-muted mb-1">Departure</div>
                <div className="fw-semibold small">{formatDateTime(schedule?.departureTime)}</div>
              </div>
              <div className="col-6">
                <div className="small text-muted mb-1">Duration</div>
                <div className="fw-semibold small">{formatDuration(route?.estimatedDuration)}</div>
              </div>
            </div>
            <div className="mb-3 pb-3 border-bottom">
              <div className="small text-muted mb-1">Vehicle</div>
              <div className="fw-semibold small">
                {schedule?.vehicle?.manufacturer} {schedule?.vehicle?.model} ({schedule?.vehicle?.vehicleCode})
              </div>
            </div>

            <div className="mb-4 p-3 rounded-3" style={{ background: selected ? 'var(--color-primary)' : 'var(--color-gray-100)' }}>
              {selected ? (
                <div className="text-white text-center">
                  <div className="small opacity-75">Selected Seat</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{selected}</div>
                </div>
              ) : (
                <div className="text-muted text-center small">No seat selected</div>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="text-muted">Fare</span>
              <span className="fw-bold fs-5" style={{ color: 'var(--color-accent)' }}>
                {formatCurrency(schedule?.fare)}
              </span>
            </div>

            <button
              className="btn btn-primary w-100 py-3 fw-semibold fs-6"
              onClick={handleBook}
              disabled={!selected || booking}
            >
              {booking
                ? <><span className="spinner-border spinner-border-sm me-2" />Reserving…</>
                : selected
                  ? <><i className="bi bi-check2-circle me-2" />Reserve Seat {selected}</>
                  : 'Select a Seat to Continue'
              }
            </button>
            <p className="text-muted small text-center mt-2 mb-0">
              You will complete payment on the next screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
