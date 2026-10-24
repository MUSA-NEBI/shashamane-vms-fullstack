/**
 * ConfirmDialog — modal confirmation before destructive actions.
 * Usage: <ConfirmDialog open onConfirm={fn} onCancel={fn} title="..." message="..." danger />
 */
const ConfirmDialog = ({ open, title = 'Confirm Action', message, onConfirm, onCancel, danger = false, loading = false }) => {
  if (!open) return null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-3">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button className="btn-close" onClick={onCancel} disabled={loading} />
          </div>
          <div className="modal-body pt-2">
            <p className="text-muted mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-light" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
