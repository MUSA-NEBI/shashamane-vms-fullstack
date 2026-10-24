const LoadingSpinner = ({ message = 'Loading…', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
          <p className="text-muted">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted small mb-0">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
