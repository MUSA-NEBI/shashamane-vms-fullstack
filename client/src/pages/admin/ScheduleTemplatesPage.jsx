import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { vehicleAPI } from '../../services/vehicleService';
import { driverAPI } from '../../services/driverService';
import { routeAPI } from '../../services/routeService';
import useFetch from '../../hooks/useFetch';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TemplateModal = ({ template, onClose, onSaved }) => {
  const isEdit = !!template?._id;
  const [form, setForm] = useState(isEdit ? {
    name: template.name,
    route: template.route?._id || template.route,
    vehicle: template.vehicle?._id || template.vehicle,
    driver: template.driver?._id || template.driver,
    daysOfWeek: template.daysOfWeek || [],
    departureTime: template.departureTime || '06:00',
    durationMinutes: template.durationMinutes || 240,
    fare: template.fare || 0,
    validFrom: template.validFrom?.slice(0,10) || '',
    validUntil: template.validUntil?.slice(0,10) || '',
    isActive: template.isActive !== false,
  } : {
    name:'', route:'', vehicle:'', driver:'', daysOfWeek:[1,2,3,4,5],
    departureTime:'06:00', durationMinutes:240, fare:0,
    validFrom: new Date().toISOString().slice(0,10),
    validUntil: '', isActive: true,
  });
  const [routes, setRoutes]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  useEffect(() => {
    Promise.all([
      routeAPI.getAll({ limit:100, isActive:'true' }),
      vehicleAPI.getAll({ limit:100, status:'active' }),
      driverAPI.getAll({ limit:100, status:'active' }),
    ]).then(([r,v,d]) => {
      setRoutes(r.data.data||[]);
      setVehicles(v.data.data||[]);
      setDrivers(d.data.data||[]);
    });
  }, []);

  const toggleDay = (d) => {
    set('daysOfWeek', form.daysOfWeek.includes(d)
      ? form.daysOfWeek.filter(x => x !== d)
      : [...form.daysOfWeek, d].sort());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.daysOfWeek.length === 0) { toast.error('Select at least one day.'); return; }
    setLoading(true);
    try {
      if (isEdit) await api.patch(`/schedules/templates/${template._id}`, form);
      else        await api.post('/schedules/templates', form);
      toast.success(`Template ${isEdit ? 'updated' : 'created'}.`);
      onSaved();
    } catch(err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)',zIndex:1050}}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Template' : 'New Schedule Template'}</h5>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Template Name *</label>
                  <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="e.g. Daily Shashamane–Addis Morning" />
                </div>
                <div className="col-12">
                  <label className="form-label">Route *</label>
                  <select className="form-select" value={form.route} onChange={e=>set('route',e.target.value)} required>
                    <option value="">Select route…</option>
                    {routes.map(r=><option key={r._id} value={r._id}>{r.routeName}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vehicle *</label>
                  <select className="form-select" value={form.vehicle} onChange={e=>set('vehicle',e.target.value)} required>
                    <option value="">Select vehicle…</option>
                    {vehicles.map(v=><option key={v._id} value={v._id}>{v.vehicleCode} — {v.manufacturer} {v.model}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Driver *</label>
                  <select className="form-select" value={form.driver} onChange={e=>set('driver',e.target.value)} required>
                    <option value="">Select driver…</option>
                    {drivers.map(d=><option key={d._id} value={d._id}>{d.user?.firstName} {d.user?.lastName}</option>)}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Days of Week *</label>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {DAYS.map((day, i) => (
                      <button key={i} type="button"
                        className={`btn btn-sm ${form.daysOfWeek.includes(i) ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{minWidth:52}}
                        onClick={() => toggleDay(i)}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Departure Time *</label>
                  <input type="time" className="form-control" value={form.departureTime} onChange={e=>set('departureTime',e.target.value)} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Duration (minutes) *</label>
                  <input type="number" className="form-control" value={form.durationMinutes} onChange={e=>set('durationMinutes',+e.target.value)} required min={1}/>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Fare (ETB) *</label>
                  <input type="number" className="form-control" value={form.fare} onChange={e=>set('fare',+e.target.value)} required min={0} step={0.5}/>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid From *</label>
                  <input type="date" className="form-control" value={form.validFrom} onChange={e=>set('validFrom',e.target.value)} required/>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid Until *</label>
                  <input type="date" className="form-control" value={form.validUntil} onChange={e=>set('validUntil',e.target.value)} required/>
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="tplActive"
                      checked={form.isActive} onChange={e=>set('isActive',e.target.checked)}/>
                    <label className="form-check-label" htmlFor="tplActive">Template is active</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2"/>}
                {isEdit ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const GenerateModal = ({ template, onClose, onDone }) => {
  const [form, setForm] = useState({
    fromDate: new Date().toISOString().slice(0,10),
    toDate: new Date(Date.now() + 30*24*3600000).toISOString().slice(0,10),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/schedules/generate-from-template', {
        templateId: template._id,
        fromDate: form.fromDate,
        toDate: form.toDate,
      });
      setResult(res.data.data);
      toast.success(`Generated ${res.data.data.created} schedule(s).`);
    } catch(err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)',zIndex:1050}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Generate Schedules</h5>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-3">Generate trip schedules from template: <strong>{template.name}</strong></p>
            {!result ? (
              <form onSubmit={handleGenerate}>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label">From Date</label>
                    <input type="date" className="form-control" value={form.fromDate}
                      onChange={e=>setForm({...form,fromDate:e.target.value})} required/>
                  </div>
                  <div className="col-6">
                    <label className="form-label">To Date</label>
                    <input type="date" className="form-control" value={form.toDate}
                      onChange={e=>setForm({...form,toDate:e.target.value})} required/>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <i className="bi bi-lightning me-2"/>}
                  Generate Schedules
                </button>
              </form>
            ) : (
              <div>
                <div className="alert alert-success border-0 rounded-3">
                  <div className="fw-semibold"><i className="bi bi-check-circle me-2"/>Generation Complete</div>
                  <div className="small mt-1">Created: <strong>{result.created}</strong> schedules · Skipped: <strong>{result.skipped}</strong></div>
                </div>
                {result.skippedDetails?.length > 0 && (
                  <div className="small text-muted">
                    <div className="fw-semibold mb-1">Skipped (conflicts or duplicates):</div>
                    {result.skippedDetails.slice(0,5).map((s,i) => <div key={i} className="text-truncate">{s}</div>)}
                    {result.skippedDetails.length > 5 && <div>…and {result.skippedDetails.length - 5} more</div>}
                  </div>
                )}
                <button className="btn btn-outline-primary w-100 mt-3" onClick={onDone}>Done</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [genTarget, setGenTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules/templates');
      setTemplates(res.data.data || []);
    } catch(err) { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/schedules/templates/${deleteTarget._id}`);
      toast.success('Template deleted.');
      setDeleteTarget(null);
      fetchTemplates();
    } catch(err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule Templates</h1>
          <p className="page-subtitle">Create recurring trip templates and generate schedules in bulk</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <i className="bi bi-plus-lg me-2"/>New Template
        </button>
      </div>

      {loading ? <LoadingSpinner/> : templates.length === 0 ? (
        <EmptyState icon="bi-calendar-week" title="No templates yet"
          subtitle="Create a recurring template to generate multiple schedules at once."
          action={<button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Create First Template</button>}/>
      ) : (
        <div className="row g-3">
          {templates.map(t => (
            <div key={t._id} className="col-md-6 col-lg-4">
              <div className="card p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="fw-bold">{t.name}</div>
                    <div className="text-muted small mt-1">
                      {t.route?.origin} → {t.route?.destination}
                    </div>
                  </div>
                  <span className={`badge ${t.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="d-flex gap-1 mb-3 flex-wrap">
                  {DAYS.map((day, i) => (
                    <span key={i} className={`badge rounded-pill ${t.daysOfWeek?.includes(i) ? 'bg-primary' : 'bg-light text-muted'}`}
                      style={{fontSize:'0.7rem'}}>
                      {day}
                    </span>
                  ))}
                </div>

                <div className="row g-2 small text-muted mb-4">
                  <div className="col-6"><i className="bi bi-clock me-1"/>{t.departureTime}</div>
                  <div className="col-6"><i className="bi bi-hourglass me-1"/>{t.durationMinutes}min</div>
                  <div className="col-6"><i className="bi bi-cash me-1"/>{formatCurrency(t.fare)}</div>
                  <div className="col-6"><i className="bi bi-calendar me-1"/>{formatDate(t.validFrom)} – {formatDate(t.validUntil)}</div>
                </div>

                <div className="mt-auto d-flex gap-2">
                  <button className="btn btn-sm btn-primary flex-grow-1" onClick={() => setGenTarget(t)}>
                    <i className="bi bi-lightning me-1"/>Generate
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setModal(t)}>
                    <i className="bi bi-pencil"/>
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(t)}>
                    <i className="bi bi-trash"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TemplateModal
          template={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchTemplates(); }}
        />
      )}

      {genTarget && (
        <GenerateModal
          template={genTarget}
          onClose={() => setGenTarget(null)}
          onDone={() => { setGenTarget(null); }}
        />
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Template" danger loading={deleting}
        message={`Delete template "${deleteTarget?.name}"? This won't remove already-generated schedules.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}/>
    </div>
  );
};

export default ScheduleTemplatesPage;
