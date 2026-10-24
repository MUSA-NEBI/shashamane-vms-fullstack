import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const languages = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'am-ET', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'om-ET', name: 'Afaan Oromoo', nativeName: 'Afaan Oromoo' }
  ];
  
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  
  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };
  
  return (
    <div className="position-relative">
      <button 
        className="btn btn-sm d-flex align-items-center gap-2 nav-link"
        onClick={() => setOpen(!open)}
        style={{ 
          background: 'transparent', 
          color: 'var(--color-gray-700)',
          border: 'none',
          fontWeight: 600,
          padding: '0.625rem 1rem',
          position: 'relative'
        }}
      >
        <i className="bi bi-globe" />
        <span className="d-none d-md-inline fw-semibold">{currentLang.nativeName}</span>
      </button>
      {open && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setOpen(false)} style={{ zIndex: 1049 }} />
          <div className="position-absolute top-100 end-0 mt-2 bg-white rounded-3 shadow-lg border overflow-hidden" style={{ minWidth: 180, zIndex: 1050 }}>
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`w-100 text-start px-3 py-2 border-0 bg-white ${i18n.language === lang.code ? 'bg-primary bg-opacity-10' : ''}`}
                onClick={() => changeLang(lang.code)}
                style={{ transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'var(--color-gray-100)'}
                onMouseLeave={(e) => e.target.style.background = i18n.language === lang.code ? 'rgba(var(--color-primary-rgb),0.1)' : 'white'}
              >
                <div className="fw-semibold small">{lang.nativeName}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{lang.name}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const LandingPage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState({ origin: '', destination: '', date: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search);
    if (user) {
      navigate(`/passenger/search?${params}`);
    } else {
      navigate(`/login?redirect=/passenger/search&${params}`);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* ── Navbar ── */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-3" to="/">
            <div style={{
              width: 50, 
              height: 50, 
              background: 'linear-gradient(135deg, #f0a500 0%, #d89500 100%)',
              borderRadius: 14, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(240,165,0,0.3)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              <svg width="34" height="34" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Realistic front-view intercity bus */}
                
                {/* Bus main body - white/silver */}
                <path d="M15 18 C15 15 17 13 20 13 L44 13 C47 13 49 15 49 18 L49 42 L15 42 Z" fill="#E8EDF4"/>
                
                {/* Front top section - darker */}
                <rect x="16" y="13" width="32" height="6" rx="2" fill="#1e3a5f"/>
                
                {/* Gold accent stripe */}
                <rect x="16" y="19" width="32" height="2" fill="#f0a500"/>
                
                {/* Large windshield - realistic glass effect */}
                <path d="M18 22 L46 22 L46 34 L18 34 Z" fill="url(#glassGradient)"/>
                
                {/* Windshield frame */}
                <rect x="18" y="22" width="28" height="12" rx="1" fill="none" stroke="#2c3e50" strokeWidth="0.5"/>
                
                {/* Center windshield divider */}
                <line x1="32" y1="22" x2="32" y2="34" stroke="#2c3e50" strokeWidth="1"/>
                
                {/* Side windows reflection */}
                <rect x="20" y="24" width="10" height="8" rx="1" fill="#B8D4E8" opacity="0.6"/>
                <rect x="34" y="24" width="10" height="8" rx="1" fill="#B8D4E8" opacity="0.6"/>
                
                {/* Front panel below windshield */}
                <rect x="18" y="34" width="28" height="8" fill="#F5F7FA"/>
                
                {/* Headlights - realistic glow */}
                <circle cx="22" cy="37" r="3" fill="#FFF9E6"/>
                <circle cx="22" cy="37" r="2" fill="#FFFEF0"/>
                <circle cx="42" cy="37" r="3" fill="#FFF9E6"/>
                <circle cx="42" cy="37" r="2" fill="#FFFEF0"/>
                
                {/* Front grille */}
                <rect x="28" y="36" width="8" height="4" rx="1" fill="#0d1f36"/>
                <line x1="29" y1="36" x2="29" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                <line x1="31" y1="36" x2="31" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                <line x1="33" y1="36" x2="33" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                <line x1="35" y1="36" x2="35" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                
                {/* Lower bumper - gold accent */}
                <rect x="17" y="42" width="30" height="3" rx="1.5" fill="#f0a500"/>
                
                {/* Wheels - realistic with depth */}
                <g>
                  {/* Left wheel */}
                  <circle cx="22" cy="46" r="5" fill="#2c3e50"/>
                  <circle cx="22" cy="46" r="3.5" fill="#34495e"/>
                  <circle cx="22" cy="46" r="2" fill="#7f8c8d"/>
                  <circle cx="22" cy="46" r="0.8" fill="#2c3e50"/>
                  
                  {/* Right wheel */}
                  <circle cx="42" cy="46" r="5" fill="#2c3e50"/>
                  <circle cx="42" cy="46" r="3.5" fill="#34495e"/>
                  <circle cx="42" cy="46" r="2" fill="#7f8c8d"/>
                  <circle cx="42" cy="46" r="0.8" fill="#2c3e50"/>
                </g>
                
                {/* Side mirrors */}
                <rect x="13" y="24" width="3" height="5" rx="1" fill="#2c3e50"/>
                <rect x="12" y="25" width="2" height="4" rx="0.5" fill="#5a7a9f" opacity="0.7"/>
                
                <rect x="48" y="24" width="3" height="5" rx="1" fill="#2c3e50"/>
                <rect x="50" y="25" width="2" height="4" rx="0.5" fill="#5a7a9f" opacity="0.7"/>
                
                {/* Destination sign on top */}
                <rect x="24" y="14" width="16" height="3" rx="1" fill="#1e3a5f" opacity="0.6"/>
                
                {/* Glass gradient definition */}
                <defs>
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A8C5E0" stopOpacity="0.9"/>
                    <stop offset="50%" stopColor="#B8D4E8" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#8FB3D5" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ 
                color: '#1e3a5f', 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                letterSpacing: '-0.03em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>SVMS</span>
              <span className="d-none d-sm-inline" style={{ 
                color: '#6c757d', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                letterSpacing: '0.02em',
                marginTop: '2px'
              }}>Shashamane</span>
            </div>
          </Link>

          <button className="navbar-toggler border-0 shadow-none" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <i className="bi bi-list" style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }} />
          </button>

          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-1 mt-3 mt-lg-0">
              <li className="nav-item">
                <a className="nav-link fw-semibold px-3 py-2" href="#home">{t('nav.home')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold px-3 py-2" href="#services">{t('nav.services')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold px-3 py-2" href="#about">{t('nav.about')}</a>
              </li>
              <li className="nav-item">
                <LanguageSelector />
              </li>
              <li className="nav-item">
                <Link to="/login" className="nav-button nav-button-outline">
                  <i className="bi bi-box-arrow-in-right me-2" />{t('nav.signIn')}
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-button nav-button-outline">
                  <i className="bi bi-ticket-perforated me-2" />Book a Trip
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="landing-hero-modern">
        <div className="hero-overlay" />
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-5 py-5">
            <div className="col-lg-6">
              <span className="badge rounded-pill px-3 py-2 mb-3 animate-fade-in"
                style={{ background: 'rgba(240,165,0,0.25)', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                <i className="bi bi-geo-alt-fill me-1" /> {t('hero.badge')}
              </span>
              <h1 className="display-4 fw-bold text-white mb-3 animate-slide-up" style={{ lineHeight: 1.2 }}>
                {t('hero.title')}<br />
                <span style={{ color: 'var(--color-accent)' }}>{t('hero.titleAccent')}</span>
              </h1>
              <p className="text-white opacity-90 mb-4 fs-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {t('hero.subtitle')}
              </p>
              <div className="d-flex gap-3 flex-wrap animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/register" className="btn btn-accent px-5 py-3 fw-semibold shadow-lg btn-hover-lift">
                  <i className="bi bi-person-plus me-2" />{t('hero.getStarted')}
                </Link>
                <a href="#search" className="btn btn-outline-light px-5 py-3 fw-semibold btn-hover-lift">
                  <i className="bi bi-search me-2" />{t('hero.searchTrips')}
                </a>
              </div>
            </div>

            <div className="col-lg-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="row g-3">
                {[
                  { icon: 'bi-bus-front-fill', val: '50+', label: t('stats.vehicles') },
                  { icon: 'bi-people-fill',    val: '200+', label: t('stats.passengers') },
                  { icon: 'bi-map-fill',       val: '15+', label: t('stats.routes') },
                  { icon: 'bi-shield-check',   val: '99%', label: t('stats.onTime') },
                ].map((s, idx) => (
                  <div key={s.label} className="col-6">
                    <div className="stat-card-modern h-100 animate-scale-up" style={{ animationDelay: `${0.4 + idx * 0.1}s` }}>
                      <div className="stat-icon-modern mb-3">
                        <i className={`bi ${s.icon} text-white`} />
                      </div>
                      <div className="text-white fw-bold fs-3 mb-1">{s.val}</div>
                      <div className="text-white opacity-75 small">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trip Search ── */}
      <section id="search" style={{ background: '#f8f9fa', padding: '4rem 0' }}>
        <div className="container">
          <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                {t('search.title')}
              </h2>
              <p className="text-muted">{t('search.subtitle')}</p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="row g-3 align-items-end">
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">{t('search.from')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-geo-alt text-primary" />
                    </span>
                    <input className="form-control border-start-0 ps-0" placeholder={t('search.fromPlaceholder')}
                      value={search.origin} onChange={(e) => setSearch({ ...search, origin: e.target.value })} required />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">{t('search.to')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-geo text-danger" />
                    </span>
                    <input className="form-control border-start-0 ps-0" placeholder={t('search.toPlaceholder')}
                      value={search.destination} onChange={(e) => setSearch({ ...search, destination: e.target.value })} required />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">{t('search.date')}</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-calendar3 text-success" />
                    </span>
                    <input type="date" className="form-control border-start-0 ps-0" min={today}
                      value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} required />
                  </div>
                </div>
                <div className="col-lg-3 col-md-6">
                  <button type="submit" className="btn w-100 fw-semibold py-3 btn-hover-lift"
                    style={{ background: 'var(--color-primary)', color: 'white' }}>
                    <i className="bi bi-search me-2" /> {t('search.search')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" style={{ padding: '5rem 0', background: 'white' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6 mb-2" style={{ color: 'var(--color-primary-dark)' }}>{t('services.title')}</h2>
            <p className="text-muted fs-5">{t('services.subtitle')}</p>
          </div>
          <div className="row g-4">
            {[
              { icon: 'bi-ticket-perforated', color: '#1e3a5f', bgGradient: 'linear-gradient(135deg, #e8edf4 0%, #d4e3f3 100%)', title: t('services.digitalTickets'), desc: t('services.digitalTicketsDesc') },
              { icon: 'bi-shield-lock', color: '#198754', bgGradient: 'linear-gradient(135deg, #e8f5ec 0%, #d1f0dd 100%)', title: t('services.securePayments'), desc: t('services.securePaymentsDesc') },
              { icon: 'bi-clock-history', color: '#f0a500', bgGradient: 'linear-gradient(135deg, #fef6e6 0%, #fdedc8 100%)', title: t('services.liveSchedules'), desc: t('services.liveSchedulesDesc') },
              { icon: 'bi-person-check', color: '#6f42c1', bgGradient: 'linear-gradient(135deg, #f2edf8 0%, #e5d9f2 100%)', title: t('services.seatSelection'), desc: t('services.seatSelectionDesc') },
              { icon: 'bi-bar-chart-line', color: '#20c997', bgGradient: 'linear-gradient(135deg, #e7f9f4 0%, #ccf2e8 100%)', title: t('services.fullReporting'), desc: t('services.fullReportingDesc') },
              { icon: 'bi-bell', color: '#fd7e14', bgGradient: 'linear-gradient(135deg, #fff3e6 0%, #ffe7cc 100%)', title: t('services.notifications'), desc: t('services.notificationsDesc') },
            ].map((f, idx) => (
              <div key={f.title} className="col-md-6 col-lg-4">
                <div 
                  className="service-card-colorful h-100" 
                  style={{ 
                    '--hover-color': f.color,
                    '--card-gradient': f.bgGradient
                  }}
                >
                  <div className="service-icon-colorful mb-3" style={{ background: f.bgGradient }}>
                    <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: '2.5rem' }} />
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--color-gray-800)' }}>{f.title}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ padding: '5rem 0', background: '#f8f9fa' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h2 className="fw-bold display-6 mb-3" style={{ color: 'var(--color-primary)' }}>
                {t('about.title')}
              </h2>
              <p className="text-muted mb-4 fs-6">
                {t('about.intro')}
              </p>
              <ul className="list-unstyled">
                {[
                  t('about.feature1'),
                  t('about.feature2'),
                  t('about.feature3'),
                  t('about.feature4'),
                ].map((item) => (
                  <li key={item} className="d-flex align-items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                      <i className="bi bi-check-circle-fill text-success fs-5" />
                    </div>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 d-flex gap-3 flex-wrap">
                <Link to="/register" className="btn px-5 py-3 fw-semibold btn-hover-lift"
                  style={{ background: 'var(--color-primary)', color: 'white' }}>
                  {t('about.createAccount')}
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-image-card">
                <div className="rounded-4 overflow-hidden text-center"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                    boxShadow: '0 20px 60px rgba(30,58,95,0.3)'
                  }}>
                  <div className="position-relative" style={{ width: '100%', paddingTop: '60%' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=90"
                      alt="Modern intercity bus at station"
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=90';
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 w-100" 
                      style={{ 
                        background: 'linear-gradient(to top, rgba(30,58,95,0.95) 0%, transparent 100%)',
                        padding: '2rem 1.5rem 1.5rem'
                      }}>
                      <div className="text-white fw-bold fs-2">SVMS</div>
                      <div className="text-white opacity-90 mt-1 small">{t('footer.tagline')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-modern">
        <div className="container">
          {/* Main Footer Content */}
          <div className="row g-4 pb-4">
            {/* Brand Column */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-brand mb-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{
                    width: 48, 
                    height: 48, 
                    background: 'linear-gradient(135deg, #f0a500 0%, #d89500 100%)',
                    borderRadius: 12, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(240,165,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18 C15 15 17 13 20 13 L44 13 C47 13 49 15 49 18 L49 42 L15 42 Z" fill="#E8EDF4"/>
                      <rect x="16" y="13" width="32" height="6" rx="2" fill="#1e3a5f"/>
                      <rect x="16" y="19" width="32" height="2" fill="#f0a500"/>
                      <path d="M18 22 L46 22 L46 34 L18 34 Z" fill="url(#glassGradient)"/>
                      <rect x="18" y="22" width="28" height="12" rx="1" fill="none" stroke="#2c3e50" strokeWidth="0.5"/>
                      <line x1="32" y1="22" x2="32" y2="34" stroke="#2c3e50" strokeWidth="1"/>
                      <rect x="20" y="24" width="10" height="8" rx="1" fill="#B8D4E8" opacity="0.6"/>
                      <rect x="34" y="24" width="10" height="8" rx="1" fill="#B8D4E8" opacity="0.6"/>
                      <rect x="18" y="34" width="28" height="8" fill="#F5F7FA"/>
                      <circle cx="22" cy="37" r="3" fill="#FFF9E6"/>
                      <circle cx="22" cy="37" r="2" fill="#FFFEF0"/>
                      <circle cx="42" cy="37" r="3" fill="#FFF9E6"/>
                      <circle cx="42" cy="37" r="2" fill="#FFFEF0"/>
                      <rect x="28" y="36" width="8" height="4" rx="1" fill="#0d1f36"/>
                      <line x1="29" y1="36" x2="29" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                      <line x1="31" y1="36" x2="31" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                      <line x1="33" y1="36" x2="33" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                      <line x1="35" y1="36" x2="35" y2="40" stroke="#1e3a5f" strokeWidth="0.5"/>
                      <rect x="17" y="42" width="30" height="3" rx="1.5" fill="#f0a500"/>
                      <circle cx="22" cy="46" r="5" fill="#2c3e50"/>
                      <circle cx="22" cy="46" r="3.5" fill="#34495e"/>
                      <circle cx="22" cy="46" r="2" fill="#7f8c8d"/>
                      <circle cx="42" cy="46" r="5" fill="#2c3e50"/>
                      <circle cx="42" cy="46" r="3.5" fill="#34495e"/>
                      <circle cx="42" cy="46" r="2" fill="#7f8c8d"/>
                      <rect x="13" y="24" width="3" height="5" rx="1" fill="#2c3e50"/>
                      <rect x="48" y="24" width="3" height="5" rx="1" fill="#2c3e50"/>
                      <rect x="24" y="14" width="16" height="3" rx="1" fill="#1e3a5f" opacity="0.6"/>
                      <defs>
                        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#A8C5E0" stopOpacity="0.9"/>
                          <stop offset="50%" stopColor="#B8D4E8" stopOpacity="0.7"/>
                          <stop offset="100%" stopColor="#8FB3D5" stopOpacity="0.8"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div>
                    <div className="footer-logo-text">SVMS</div>
                    <div className="footer-logo-sub">Shashamane</div>
                  </div>
                </div>
                <p className="footer-text mb-3">{t('footer.tagline')}</p>
                <p className="footer-text small mb-0">
                  {t('hero.subtitle')}
                </p>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="col-lg-2 col-md-6 col-6">
              <h6 className="footer-heading">{t('footer.quickLinks')}</h6>
              <ul className="footer-links">
                <li><a href="#home">{t('nav.home')}</a></li>
                <li><a href="#services">{t('nav.services')}</a></li>
                <li><a href="#about">{t('nav.about')}</a></li>
                <li><a href="#search">{t('search.title')}</a></li>
                <li><Link to="/register">{t('hero.getStarted')}</Link></li>
              </ul>
            </div>

            {/* Services Column */}
            <div className="col-lg-2 col-md-6 col-6">
              <h6 className="footer-heading">{t('nav.services')}</h6>
              <ul className="footer-links">
                <li><a href="#services">{t('services.digitalTickets')}</a></li>
                <li><a href="#services">{t('services.seatSelection')}</a></li>
                <li><a href="#services">{t('services.liveSchedules')}</a></li>
                <li><a href="#services">{t('services.securePayments')}</a></li>
                <li><Link to="/login">{t('nav.signIn')}</Link></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="col-lg-4 col-md-6">
              <h6 className="footer-heading">{t('footer.contact')}</h6>
              <ul className="footer-contact">
                <li>
                  <i className="bi bi-geo-alt-fill"></i>
                  <span>Shashamane, Ethiopia</span>
                </li>
                <li>
                  <i className="bi bi-envelope-fill"></i>
                  <a href="mailto:shashamane@svms.et">shashamane@svms.et</a>
                </li>
                <li>
                  <i className="bi bi-telephone-fill"></i>
                  <a href="tel:+251951515996">+251 951 515 996</a>
                </li>
              </ul>

              {/* Social Media */}
              <div className="footer-social mt-4">
                <a href="https://www.facebook.com/share/1bwigXVYUL/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="https://www.instagram.com/musaibrahimshurichabedaso" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="https://www.linkedin.com/in/musa-ibrahim-shuricha-7ba7a83b6" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn">
                  <i className="bi bi-linkedin"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="row align-items-center">
              <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
                <p className="footer-copyright mb-0">
                  © {new Date().getFullYear()} {t('footer.copyright')}
                </p>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="footer-bottom-links">
                  <a href="#">Privacy Policy</a>
                  <span className="footer-separator">•</span>
                  <a href="#">Terms of Service</a>
                  <span className="footer-separator">•</span>
                  <a href="#">Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
