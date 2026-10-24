import { statusLabel } from '../../utils/formatters';

const STATUS_CLASS = {
  active: 'badge-active', confirmed: 'badge-confirmed', completed: 'badge-completed',
  valid: 'badge-active',
  inactive: 'badge-inactive', cancelled: 'badge-cancelled', suspended: 'badge-inactive',
  pending: 'badge-pending', scheduled: 'badge-scheduled', maintenance: 'badge-maintenance',
  on_leave: 'badge-pending', delayed: 'badge-pending',
  in_transit: 'badge-in_transit', boarding: 'badge-boarding',
  failed: 'badge-inactive', refunded: 'badge-pending',
  used: 'badge-pending', expired: 'badge-inactive',
  in_progress: 'badge-boarding',
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${STATUS_CLASS[status] || 'badge-pending'}`}>
    {statusLabel(status)}
  </span>
);

export default StatusBadge;
