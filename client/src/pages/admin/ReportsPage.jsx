import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/dashboardService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#1e3a5f', '#f0a500', '#198754', '#dc3545', '#0dcaf0', '#6f42c1'];

// Resolve CSS variables to actual color values for Recharts
const COLORS = {
  primary: '#1e3a5f',
  accent: '#f0a500',
  success: '#198754',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  gray100: '#e9ecef',
};

const ReportsPage = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    dashboardAPI.getAdmin()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const body    = rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const blob    = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message="Loading reports…"/>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!data)   return <div className="alert alert-warning">No data available</div>;

  const { vehicles = {}, drivers = {}, bookings = {}, revenue = {}, maintenance = {}, charts = {} } = data;
  
  // Provide default values
  const safeVehicles = { total: 0, active: 0, maintenance: 0, inactive: 0, ...vehicles };
  const safeDrivers = { total: 0, active: 0, ...drivers };
  const safeBookings = { total: 0, confirmed: 0, pending: 0, ...bookings };
  const safeRevenue = { total: 0, ...revenue };
  const safeMaintenance = { pending: 0, ...maintenance };
  const safeCharts = { bookingsByDay: [], revenueByMonth: [], ...charts };
  const safeSchedules = data.schedules || { upcomingThisWeek: 0 };

  // Booking status breakdown for pie chart
  const bookingStatusData = [
    { name: 'Confirmed', value: safeBookings.confirmed || 0 },
    { name: 'Pending',   value: safeBookings.pending || 0 },
    { name: 'Other',     value: Math.max(0, (safeBookings.total || 0) - (safeBookings.confirmed || 0) - (safeBookings.pending || 0)) },
  ].filter(d => d.value > 0);

  // Vehicle status breakdown
  const vehicleStatusData = [
    { name: 'Active',      value: safeVehicles.active || 0 },
    { name: 'Maintenance', value: safeVehicles.maintenance || 0 },
    { name: 'Inactive',    value: safeVehicles.inactive || 0 },
  ].filter(d => d.value > 0);

  const exportBookingsCSV = () => {
    const rows = (safeCharts.bookingsByDay || []).map(d => ({ date: d._id, count: d.count }));
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }
    exportCSV(rows, `bookings-by-day-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportRevenueCSV = () => {
    const rows = (safeCharts.revenueByMonth || []).map(d => ({ month: d._id, total_etb: d.total, transactions: d.count }));
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }
    exportCSV(rows, `revenue-by-month-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Business analytics from live database data</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={exportBookingsCSV}>
            <i className="bi bi-download me-1"/>Export Bookings CSV
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={exportRevenueCSV}>
            <i className="bi bi-download me-1"/>Export Revenue CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card p-0 mb-4 overflow-hidden">
        <div className="d-flex border-bottom">
          {[
            { key: 'overview',  label: 'Overview',  icon: 'bi-grid-1x2' },
            { key: 'bookings',  label: 'Bookings',  icon: 'bi-ticket' },
            { key: 'revenue',   label: 'Revenue',   icon: 'bi-cash-coin' },
            { key: 'fleet',     label: 'Fleet',     icon: 'bi-bus-front' },
          ].map(t => (
            <button key={t.key}
              className={`btn btn-sm px-4 py-3 rounded-0 border-0 ${tab === t.key ? 'bg-primary text-white' : 'text-muted'}`}
              style={{ transition: 'var(--transition)' }}
              onClick={() => setTab(t.key)}>
              <i className={`bi ${t.icon} me-2`}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          {/* KPI Summary */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Revenue',    value: formatCurrency(safeRevenue.total),  icon: 'bi-cash-coin',   color: '#f0a500',             bg: '#f0a50018' },
              { label: 'Total Bookings',   value: safeBookings.total,                 icon: 'bi-ticket',      color: 'var(--color-primary)', bg: 'rgba(30,58,95,0.1)' },
              { label: 'Confirmed',        value: safeBookings.confirmed,             icon: 'bi-check-circle',color: 'var(--color-success)', bg: 'var(--color-success-light)' },
              { label: 'Pending Payment',  value: safeBookings.pending,               icon: 'bi-clock',       color: '#fd7e14',              bg: '#fd7e1418' },
              { label: 'Fleet Size',       value: safeVehicles.total,                 icon: 'bi-bus-front',   color: '#6f42c1',             bg: '#6f42c118' },
              { label: 'Maintenance Alerts', value: safeMaintenance.pending,          icon: 'bi-wrench',      color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
            ].map(k => (
              <div key={k.label} className="col-6 col-md-4 col-lg-2">
                <div className="stat-card">
                  <div className="stat-card-icon mb-2" style={{ background: k.bg, color: k.color }}>
                    <i className={`bi ${k.icon}`}/>
                  </div>
                  <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{k.value}</div>
                  <div className="stat-card-label">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend charts */}
          <div className="row g-4">
            <div className="col-md-8">
              <div className="card p-4">
                <h6 className="fw-bold mb-3">Booking Trend — Last 30 Days</h6>
                {safeCharts.bookingsByDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={safeCharts.bookingsByDay}>
                      <defs>
                        <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100}/>
                      <XAxis dataKey="_id" tick={{fontSize:10}} tickFormatter={v => v.slice(5)}/>
                      <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                      <Tooltip/>
                      <Area type="monotone" dataKey="count" name="Bookings" stroke={COLORS.primary} fill="url(#bGrad)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="text-muted text-center py-5 small">No booking data in the last 30 days.</div>}
              </div>
            </div>
            <div className="col-md-4">
              <div className="card p-4">
                <h6 className="fw-bold mb-3">Booking Status</h6>
                {bookingStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bookingStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {bookingStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="text-muted text-center py-5 small">No data yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Daily Bookings — Last 30 Days</h6>
                <button className="btn btn-sm btn-outline-primary" onClick={exportBookingsCSV}>
                  <i className="bi bi-download me-1"/>CSV
                </button>
              </div>
              {safeCharts.bookingsByDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={safeCharts.bookingsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100}/>
                    <XAxis dataKey="_id" tick={{fontSize:10}} tickFormatter={v => v.slice(5)}/>
                    <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                    <Tooltip/>
                    <Bar dataKey="count" name="Bookings" fill={COLORS.primary} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-muted text-center py-5">No booking data yet.</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Booking Summary</h6>
              <table className="table table-sm">
                <tbody>
                  {[
                    { label: 'Total Bookings',    value: safeBookings.total },
                    { label: 'Confirmed',         value: safeBookings.confirmed },
                    { label: 'Pending Payment',   value: safeBookings.pending },
                    { label: 'Cancelled/Other',   value: safeBookings.total - safeBookings.confirmed - safeBookings.pending },
                    { label: 'Confirmation Rate', value: safeBookings.total > 0 ? `${((safeBookings.confirmed/safeBookings.total)*100).toFixed(1)}%` : '0%' },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="text-muted small">{row.label}</td>
                      <td className="fw-semibold text-end">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Booking Status Distribution</h6>
              {bookingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={bookingStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                      {bookingStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="text-muted text-center py-5 small">No data yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {tab === 'revenue' && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Monthly Revenue — Last 6 Months</h6>
                <button className="btn btn-sm btn-outline-success" onClick={exportRevenueCSV}>
                  <i className="bi bi-download me-1"/>CSV
                </button>
              </div>
              {safeCharts.revenueByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={safeCharts.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray100}/>
                    <XAxis dataKey="_id" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={v => [`ETB ${v.toLocaleString()}`, 'Revenue']}/>
                    <Bar dataKey="total" name="Revenue (ETB)" fill={COLORS.accent} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-muted text-center py-5">No revenue data yet. Complete some payments to see this chart.</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Revenue Summary</h6>
              <table className="table table-sm">
                <tbody>
                  {[
                    { label: 'Total Confirmed Revenue', value: formatCurrency(safeRevenue.total) },
                    { label: 'Currency',                value: 'ETB (Ethiopian Birr)' },
                    { label: 'Confirmed Bookings',      value: safeBookings.confirmed },
                    { label: 'Avg per Booking',         value: safeBookings.confirmed > 0 ? formatCurrency(safeRevenue.total / safeBookings.confirmed) : 'ETB 0.00' },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="text-muted small">{row.label}</td>
                      <td className="fw-semibold text-end">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Monthly Transactions</h6>
              {safeCharts.revenueByMonth?.length > 0 ? (
                <table className="table table-sm">
                  <thead>
                    <tr><th className="small">Month</th><th className="small text-end">Revenue</th><th className="small text-end">Transactions</th></tr>
                  </thead>
                  <tbody>
                    {safeCharts.revenueByMonth.map(m => (
                      <tr key={m._id}>
                        <td className="small">{m._id}</td>
                        <td className="small text-end fw-semibold">{formatCurrency(m.total)}</td>
                        <td className="small text-end">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-muted small text-center py-3">No data yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Fleet Tab */}
      {tab === 'fleet' && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Fleet Status Distribution</h6>
              {vehicleStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={vehicleStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                      {vehicleStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="text-muted text-center py-5 small">No vehicle data.</div>}
            </div>
          </div>

          <div className="col-md-7">
            <div className="card p-4">
              <h6 className="fw-bold mb-3">Fleet & Operations Summary</h6>
              <table className="table table-sm">
                <tbody>
                  {[
                    { label: 'Total Vehicles',         value: safeVehicles.total },
                    { label: 'Active',                 value: safeVehicles.active },
                    { label: 'In Maintenance',         value: safeVehicles.maintenance },
                    { label: 'Inactive',               value: safeVehicles.inactive },
                    { label: 'Fleet Utilization',      value: safeVehicles.total > 0 ? `${((safeVehicles.active/safeVehicles.total)*100).toFixed(1)}%` : '0%' },
                    { label: 'Total Drivers',          value: safeDrivers.total },
                    { label: 'Active Drivers',         value: safeDrivers.active },
                    { label: 'Upcoming Trips (7 days)',value: safeSchedules.upcomingThisWeek },
                    { label: 'Pending Maintenance',    value: safeMaintenance.pending },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="text-muted small">{row.label}</td>
                      <td className="fw-semibold text-end">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
