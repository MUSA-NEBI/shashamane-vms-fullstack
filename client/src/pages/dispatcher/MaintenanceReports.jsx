import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { vehicleAPI } from '../../services/vehicleService';
import useFetch from '../../hooks/useFetch';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';

const MAINTENANCE_TYPES = ['routine', 'repair', 'inspection', 'emergency', 'breakdown'];

const MaintenanceReportModal = ({ onClose, onSaved }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [form, setForm] = useState({
    vehicle: '',
    type: 'breakdown',
    description: '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    cost: 0,
    technicianName: '',
    workshopName: '',
    blocksVehicle: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vehicleAPI.getAll({ limit: 100, status: 'active' })
      .then(r => setVehicles(r.data.data || []))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Maintenance report submitted successfully.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-tools me-2 text-warning" />
              Report Vehicle Issue
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loadingVehicles ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" />
                  <p className="text-muted mt-2 small">Loading vehicles...</p>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-bus-front me-1 text-primary" />Vehicle *
                    </label>
                    <select 
                      className="form-select" 
                      value={form.vehicle} 
                      onChange={e => set('vehicle', e.target.value)} 
                      required
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleCode} — {v.manufacturer} {v.model} ({v.plateNumber})
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <small className="text-warning">⚠️ No active vehicles available</small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-wrench me-1 text-danger" />Issue Type *
                    </label>
                    <select 
                      className="form-select" 
                      value={form.type} 
                      onChange={e => set('type', e.target.value)} 
                      required
                    >
                      {MAINTENANCE_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar me-1 text-info" />Date Reported *
                    </label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={form.scheduledDate} 
                      onChange={e => set('scheduledDate', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-card-text me-1 text-secondary" />Description *
                    </label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      value={form.description} 
                      onChange={e => set('description', e.target.value)} 
                      placeholder="Describe the issue in detail..."
                      required
                    />
                    <small className="text-muted">
                      Include: What happened? When? Current vehicle status? Safety concerns?
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person me-1" />Technician Name
                    </label>
                    <input 
                      className="form-control" 
                      value={form.technicianName} 
                      onChange={e => set('technicianName', e.target.value)} 
                      placeholder="If already assigned..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-building me-1" />Workshop Name
                    </label>
                    <input 
                      className="form-control" 
                      value={form.workshopName} 
                      onChange={e => set('workshopName', e.target.value)} 
                      placeholder="If already assigned..."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-currency-exchange me-1" />Estimated Cost (ETB)
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={form.cost} 
                      onChange={e => set('cost', +e.target.value)} 
                      min={0} 
                      step={0.5}
                    />
                    <small className="text-muted">Leave as 0 if unknown</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Vehicle Status</label>
                    <div className="form-check form-switch mt-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="blocksVehicle"
                        checked={form.blocksVehicle}
                        onChange={e => set('blocksVehicle', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="blocksVehicle">
                        <i className="bi bi-exclamation-triangle text-danger me-1" />
                        Vehicle cannot operate (blocks scheduling)
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-sticky me-1" />Additional Notes
                    </label>
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      value={form.notes} 
                      onChange={e => set('notes', e.target.value)} 
                      placeholder="Any additional information..."
                    />
                  </div>

                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2" />
                      <strong>Note:</strong> This report will be sent to the Administrator for review and action. 
                      If the vehicle is marked as blocked, it will be automatically set to maintenance status.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning px-4" disabled={loading || loadingVehicles}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                <i className="bi bi-send me-1" />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MaintenanceReports = () => {
  const [params, setParams] = useState({ page: 1, limit: 10 });
  const fetchFn = useCallback(p => api.get('/maintenance', { params: p }).then(r => r.data), []);
  const { data, isLoading, error, refetch } = useFetch(fetchFn, params, [JSON.stringify(params)]);
  const [modal, setModal] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-tools me-2" />Maintenance Reports
          </h1>
          <p className="page-subtitle">Report vehicle issues, breakdowns, and operational problems</p>
        </div>
        <button className="btn btn-warning" onClick={() => setModal(true)}>
          <i className="bi bi-exclamation-triangle me-2" />Report Issue
        </button>
      </div>

      {/* Info Card */}
      <div className="card mb-3 border-warning">
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-info-circle text-warning" style={{ fontSize: '1.5rem' }} />
            <div>
              <h6 className="fw-bold mb-1">Dispatcher Reporting</h6>
              <p className="text-muted small mb-0">
                Use this page to report vehicle breakdowns, delays, or any operational problems. 
                Your reports will be sent to the Administrator for immediate action. 
                If a vehicle is marked as unable to operate, it will be automatically set to maintenance status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="table-container">
        {isLoading ? <LoadingSpinner /> : error ? (
          <div className="alert alert-danger m-3">
            <i className="bi bi-exclamation-triangle me-2" />{error}
          </div>
        ) : !data || !data.data || data.data.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-tools text-muted d-block mb-2" style={{ fontSize: '3rem', opacity: 0.3 }} />
            <p className="text-muted">No maintenance reports yet.</p>
            <button className="btn btn-warning btn-sm mt-2" onClick={() => setModal(true)}>
              <i className="bi bi-plus-lg me-1" />Submit First Report
            </button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Blocks Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map(m => (
                    <tr key={m._id}>
                      <td>
                        <code className="fw-semibold">{m.vehicle?.vehicleCode || '—'}</code>
                        <div className="text-muted small">{m.vehicle?.plateNumber}</div>
                      </td>
                      <td className="text-capitalize small">{m.type}</td>
                      <td className="small" style={{ maxWidth: '300px' }}>
                        {m.description.length > 80 ? m.description.slice(0, 80) + '...' : m.description}
                      </td>
                      <td className="small">{formatDate(m.scheduledDate)}</td>
                      <td>
                        <span className={`badge ${
                          m.status === 'completed' ? 'bg-success' :
                          m.status === 'in_progress' ? 'bg-info' :
                          'bg-warning text-dark'
                        }`}>
                          {m.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-center">
                        {m.blocksVehicle ? (
                          <i className="bi bi-exclamation-circle text-danger" title="Vehicle blocked" />
                        ) : (
                          <i className="bi bi-check-circle text-success" title="Vehicle operational" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={p => setParams({ ...params, page: p })} />
          </>
        )}
      </div>

      {/* Report Modal */}
      {modal && (
        <MaintenanceReportModal 
          onClose={() => setModal(false)} 
          onSaved={() => { setModal(false); refetch(params); }} 
        />
      )}
    </div>
  );
};

export default MaintenanceReports;
