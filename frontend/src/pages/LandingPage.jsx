import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Shield, Zap, Search, Fingerprint, Book, Users, Briefcase, ArrowRight, Code } from 'lucide-react';
import styles from '../styles/LandingPage.module.css';
import heroBg from '../assets/images/hero_justice_hall.jpg';
import featureImg from '../assets/images/feature_evidence.jpg';
import audienceImg from '../assets/images/lady_justice_statue.jpg';

const FEATURES = [
  {
    icon: <Search size={24} />,
    title: 'Búsqueda Semántica Avanzada',
    desc: 'No dependas de palabras clave exactas. Encuentra artículos, incisos y leyes conectadas mediante contexto profundo que entiende la jurisprudencia.'
  },
  {
    icon: <Fingerprint size={24} />,
    title: 'Privacidad Radialmente Local',
    desc: 'Tu información nunca toca la nube. El procesamiento de RAG local asegura que la confidencialidad abogado-cliente permanezca infranqueable.'
  },
  {
    icon: <Zap size={24} />,
    title: 'Respuestas Instantáneas',
    desc: 'Acelera el análisis legal. Obtén resúmenes precisos y citaciones exactas de la Constitución y Códigos en microsegundos.'
  }
];

const AUDIENCES = [
  {
    icon: <Users size={24} />,
    title: 'Individuos y Familias',
    desc: 'Democratizamos el acceso a tus derechos. Consulta sobre arriendos, conflictos vecinales y trabajo sin los altos costos de entrada.'
  },
  {
    icon: <Book size={24} />,
    title: 'Estudiantes y Académicos',
    desc: 'Construye defensas y tesis rápidamente. Correlaciona artículos de distintos códigos con un solo "prompt".'
  },
  {
    icon: <Briefcase size={24} />,
    title: 'Emprendedores y PyMEs',
    desc: 'Asegura tu cumplimiento legal desde el día uno. Resuelve dudas operativas, laborales y contractuales con seguridad.'
  }
];

const LandingPage = ({ user, onLogout, onDemo }) => {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    if (onDemo) onDemo();
    navigate('/chat');
  };

  return (
    <div className={styles.mainContainer}>
      {/* Background Animated Orbs */}
      <div className={styles.ambientGlow} />

      {/* Glass Navigation */}
      <nav className={`${styles.glassNavbar} py-3`}>
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className={styles.brandLogo}>
            <Scale size={28} className="text-white" />
            <span>SENTENTIA</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <Link to="/chat" className={`${styles.btnGlass} d-none d-sm-inline-block`}>
                  Ir al Panel
                </Link>
                <button onClick={onLogout} className={styles.btnGlass}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${styles.btnGlass} d-none d-sm-inline-block`}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className={styles.btnPrimary}>
                  Comenzar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection} style={{ backgroundImage: `radial-gradient(circle at 30% 50%, rgba(3,3,5,0.85) 0%, rgba(3,3,5,0.98) 100%), url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="container position-relative z-10">
          <div className="row justify-content-center text-center">
            <div className="col-lg-10 col-xl-8 d-flex flex-column align-items-center">
              <div className={styles.heroBadge}>
                <Shield size={16} /> RAG Legal Open Source
              </div>
              <h1 className={styles.heroTitle}>
                Tu Asistente Legal Inteligente. <br />
                <span className={styles.gradientTextAccent}>100% Privado y Local.</span>
              </h1>
              <p className={styles.heroDesc}>
                Consulta la legislación chilena y redacta documentos sin comprometer tus datos. Un motor RAG offline diseñado para garantizar confidencialidad absoluta abogado-cliente.
              </p>
              
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mt-4 mb-5">
                <Link to={user ? '/chat' : '/register'} className={`${styles.btnPrimary} ${styles.btnPrimaryLg} d-flex align-items-center justify-content-center`}>
                  Iniciar Consulta Legal <ArrowRight size={18} className="ms-2" />
                </Link>
                {!user && (
                  <button onClick={handleDemoClick} className={`${styles.btnGlass} ${styles.btnPrimaryLg}`}>
                    Probar el Sistema
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="row justify-content-center mt-2 d-none d-lg-flex">
            <div className="col-lg-10 col-xl-8">
              {/* Terminal mock moved to Hero (Centered) */}
              <div className={`${styles.terminalMockup} mx-auto`} style={{ maxWidth: '850px', textAlign: 'left' }}>
                <div className={styles.terminalHeader}>
                  <div className={`${styles.terminalDot} ${styles.dotRed}`}></div>
                  <div className={`${styles.terminalDot} ${styles.dotYellow}`}></div>
                  <div className={`${styles.terminalDot} ${styles.dotGreen}`}></div>
                  <span className="ms-2 text-secondary small font-monospace">sententia-ai — bash</span>
                </div>
                <div className={styles.terminalBody}>
                  <p className="text-white-50 mb-1">$ sententia-cli query --index constitucion</p>
                  <p className="text-white mb-3">&gt; "¿Qué garantías constitucionales protegen la privacidad de mis comunicaciones?"</p>
                  
                  <p className="text-success mb-1">✓ Encontrados 3 nodos relevantes (score &gt; 0.89)</p>
                  <p className="text-success mb-3">✓ Inferencia DeepSeek completada: 4.2s</p>
                  
                  <p className="text-white opacity-75">
                    "Según el Artículo 19, Nº 5 de la Constitución Política de la República, se asegura a todas las personas: La inviolabilidad del hogar y de toda forma de comunicación privada. Las comunicaciones no pueden ser interceptadas, abiertas o registradas sino en los casos y formas determinados por la ley."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className={styles.socialProof}>
        <div className="container">
          <p className={styles.socialProofTitle}>Potenciado por Stack Tecnológico Moderno</p>
          <div className={styles.techLogos}>
            <span className={styles.techItem}><Code size={20} /> LangChain</span>
            <span className={styles.techItem}><Zap size={20} /> Ollama</span>
            <span className={styles.techItem}><Search size={20} /> ChromaDB</span>
            <span className={styles.techItem}><Book size={20} /> LlamaIndex</span>
          </div>
        </div>
      </section>

      {/* Features - Premium Glass Cards */}
      <section className={styles.sectionBlock}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Capacidades <span className={styles.gradientTextAccent}>Avanzadas</span></h2>
            <p className={styles.sectionDesc}>Diseñado para proteger la confidencialidad, revolucionando el acceso al texto normativo en tribunales y empresas.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {FEATURES.map((feature, idx) => (
              <div className="col-md-6 col-lg-4" key={idx}>
                <div className={styles.glassCard}>
                  <div className={styles.iconBox}>{feature.icon}</div>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                  <p className={styles.cardDesc}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (Terminal & Steps) */}
      <section className={styles.sectionBlock} style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Autónomo. Privado. Eficaz.</h2>
            <p className={styles.sectionDesc}>Flujo de trabajo optimizado para que te concentres en la estrategia legal, mientras la IA hace la extracción de datos.</p>
          </div>
          
          <div className="row align-items-center g-5">
            {/* Steps text */}
            <div className="col-lg-5">
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div>
                  <h4 className="fw-bold mb-2">Ingesta de Corpus</h4>
                  <p className="text-secondary mb-0">Sententia pre-vectoriza el Código Civil, la Constitución y jurisprudencia clave a través del backend RAG.</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div>
                  <h4 className="fw-bold mb-2">Inferencia Local</h4>
                  <p className="text-secondary mb-0">Al realizar una consulta, la búsqueda de similitud ocurre en la memoria local, seleccionando fragmentos exactos.</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div>
                  <h4 className="fw-bold mb-2">Generación Contextual</h4>
                  <p className="text-secondary mb-0">El modelo provee una respuesta precisa con citación explícita (Inciso, Artículo y Ley) sin inventar jurisprudencia.</p>
                </div>
              </div>
            </div>

            {/* Feature Image */}
            <div className="col-lg-7 text-center">
              <img src={featureImg} alt="Legal Tech Process" className={styles.glassFeatureImg} />
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className={styles.sectionBlock}>
        <div className="container">
          <div className="row align-items-center mb-5 pb-4">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>Democratización de la <span className={styles.gradientText}>Justicia</span></h2>
            </div>
            <div className="col-lg-6 text-center text-lg-end">
              <img src={audienceImg} alt="Justice Scale" className={styles.glassFeatureImg} style={{ maxWidth: '80%', display: 'inline-block' }} />
            </div>
          </div>
          <div className="row g-4">
            {AUDIENCES.map((audience, idx) => (
              <div className="col-md-4" key={idx}>
                <div className={styles.glassCard} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="text-white opacity-75">{audience.icon}</div>
                    <h4 className="m-0 fw-bold fs-5">{audience.title}</h4>
                  </div>
                  <p className={styles.cardDesc} style={{ fontSize: '0.95rem' }}>{audience.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container position-relative z-10">
          <h2 className="display-4 fw-bold mb-4">El despacho legal del futuro.</h2>
          <p className="fs-4 text-secondary mb-5 max-w-md mx-auto">
            Configura tu entorno. Protege tu información. Analiza las leyes. Todo en un solo lugar.
          </p>
          <div className="d-flex justify-content-center gap-3">
             <Link to="/register" className={`${styles.btnPrimary} ${styles.btnPrimaryLg}`}>
                Crear Cuenta Gratuita
             </Link>
          </div>
        </div>
      </section>

      {/* Footer minimalista */}
      <footer className={styles.glassFooter}>
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
            <Scale size={20} className="text-white opacity-50" />
            <span className="fw-bold opacity-75">SENTENTIA LABS</span>
          </div>
          <p className="text-secondary small mb-0">© 2026 Sententia. Inteligencia Artificial Aplicada al Derecho.</p>
          <div className={`d-flex gap-4 mt-3 mt-md-0 ${styles.footerLinks}`}>
            <a href="#" className="small text-decoration-none">Políticas</a>
            <a href="#" className="small text-decoration-none">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
