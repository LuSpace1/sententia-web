import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Lock, Layout, Zap, ChevronRight } from 'lucide-react';
import '../index.css';

const FEATURES = [
  {
    icon: <Scale size={30} />,
    title: 'Base Legal Actualizada',
    desc: 'Desde la Constitución hasta el Código del Trabajo y las leyes más recientes.',
  },
  {
    icon: <Lock size={30} />,
    title: 'Privacidad Total',
    desc: 'Tus consultas nunca salen de tu equipo. Sin servidores externos, sin telemetría.',
  },
  {
    icon: <Layout size={30} />,
    title: 'Experiencia Fluida',
    desc: 'Interfaz minimalista diseñada para la claridad y el enfoque legal.',
  },
];

const LandingPage = ({ user, onLogout, onDemo }) => {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    onDemo();
    navigate('/chat');
  };

  return (
    <div className="min-vh-100" style={{ background: '#030303', color: 'white' }}>
      <nav
        className="navbar navbar-expand-lg navbar-dark py-4 sticky-top"
        style={{
          backgroundColor: 'rgba(3,3,3,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center fw-extrabold fs-4 ls-tighter" to="/">
            <Scale className="me-2 text-white" size={26} />
            SENTENTIA
          </Link>
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <Link className="text-white text-decoration-none fw-medium d-none d-sm-block opacity-60" to="/chat">
                  Panel de Chat
                </Link>
                <button className="btn btn-outline-light btn-sm px-4 rounded-pill border-opacity-25" onClick={onLogout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link className="text-white text-decoration-none d-none d-sm-block fw-medium opacity-60" to="/login">
                  Entrar
                </Link>
                <Link className="btn btn-minimal px-4 py-2 rounded-pill fw-bold" to="/register">
                  Empezar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header
        className="d-flex align-items-center position-relative overflow-hidden"
        style={{ minHeight: '88vh' }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(40,40,40,0.4) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div className="container position-relative pt-5">
          <div className="row align-items-center">
            <div className="col-lg-7 text-center text-lg-start">
              <span className="badge rounded-pill bg-dark border border-secondary border-opacity-25 text-secondary px-3 py-2 mb-4 ls-2 fw-medium">
                <Zap size={13} className="me-2 text-warning" />
                IA LEGAL DE ÚLTIMA GENERACIÓN
              </span>
              <h1
                className="display-1 fw-extrabold mb-4"
                style={{ letterSpacing: '-4px', lineHeight: '0.92' }}
              >
                Justicia{' '}
                <span
                  style={{
                    background: 'linear-gradient(to bottom right, #fff 30%, #444 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  instantánea
                </span>{' '}
                para Chile.
              </h1>
              <p className="lead mb-5 opacity-50 fs-5 fw-light" style={{ maxWidth: '560px' }}>
                Resuelve tus dudas legales con <strong className="text-white opacity-75">DeepSeek-R1</strong>.
                Inteligencia artificial experta en leyes chilenas, ejecutándose 100% en tu sistema.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link
                  to={user ? '/chat' : '/register'}
                  className="btn btn-minimal btn-lg px-5 py-3 fw-extrabold d-flex align-items-center justify-content-center"
                >
                  Consultar ahora <ChevronRight size={18} className="ms-2" />
                </Link>
                {!user && (
                  <button
                    onClick={handleDemoClick}
                    className="btn btn-dark border border-secondary border-opacity-25 btn-lg px-5 py-3 fw-bold"
                    style={{ transition: '0.2s' }}
                  >
                    Probar Demo
                  </button>
                )}
              </div>
              <div className="mt-5 pt-3 d-flex justify-content-center justify-content-lg-start gap-4">
                {['Constitución', 'Código Civil', 'Código del Trabajo'].map((label) => (
                  <span key={label} className="x-small-text opacity-20">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-lg-5 d-none d-lg-block">
              <div
                className="rounded-4 overflow-hidden border border-secondary border-opacity-10"
                style={{ opacity: 0.7 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200"
                  alt="Legal"
                  className="img-fluid"
                  style={{ filter: 'contrast(1.05) brightness(0.5) grayscale(0.3)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-5" style={{ background: '#010101', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container py-5">
          <div className="row g-4">
            {FEATURES.map((f) => (
              <div className="col-md-4" key={f.title}>
                <div className="p-5 card-minimal h-100">
                  <div className="text-white mb-4 opacity-50">{f.icon}</div>
                  <h3 className="h5 fw-bold mb-3">{f.title}</h3>
                  <p className="opacity-40 fw-light lh-lg">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: '#010101', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container py-5 text-center">
          <h2 className="display-5 fw-bold mb-4 ls-tighter">Tu asistente legal 24/7.</h2>
          <p className="opacity-40 mb-5 fs-5">Sin esperas, sin citas. Solo respuestas legales precisas.</p>
          <button onClick={handleDemoClick} className="btn btn-minimal btn-lg px-5 py-3 fw-bold">
            Entrar como Invitado
          </button>
        </div>
      </section>

      <footer className="py-4" style={{ background: '#010101', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <Scale className="me-2 text-white opacity-40" size={18} />
            <span className="fw-bold ls-tighter opacity-40 small">SENTENTIA</span>
          </div>
          <p className="opacity-20 small mb-0">© 2026 Sententia · Proyecto educativo sobre IA y Leyes.</p>
          <div className="d-flex gap-4 mt-3 mt-md-0">
            <a href="#" className="text-secondary text-decoration-none x-small-text opacity-40">Aviso Legal</a>
            <a href="#" className="text-secondary text-decoration-none x-small-text opacity-40">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
