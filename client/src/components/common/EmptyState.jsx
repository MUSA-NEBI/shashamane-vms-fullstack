const EmptyState = ({ icon = 'bi-inbox', title = 'No records found', subtitle = '', action }) => (
  <div className="empty-state">
    <i className={`bi ${icon}`} />
    <p className="fw-semibold text-muted">{title}</p>
    {subtitle && <p className="small text-muted mt-1">{subtitle}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default EmptyState;
