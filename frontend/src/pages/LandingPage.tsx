import { Link, useNavigate } from 'react-router-dom';
import { Scale, Shield, Zap, Search, Fingerprint, Book, Users, Briefcase, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import heroBg from '../assets/images/hero_justice_hall.jpg';

const FEATURES = [
  {
    icon: <Search size={22} />,
    title: 'Búsqueda Semántica',
    desc: 'Encuentra artículos y jurisprudencia por contexto, no por palabras clave. El motor RAG entiende el lenguaje legal.'
  },
  {
    icon: <Fingerprint size={22} />,
    title: 'Confidencialidad Total',
    desc: 'Nunca toca la nube. El procesamiento local garantiza el secreto abogado-cliente sin concesiones.'
  },
  {
    icon: <Zap size={22} />,
    title: 'Respuestas al Instante',
    desc: 'Análisis legal en tiempo real con citaciones precisas de la Constitución y Códigos chilenos.'
  }
];

const STEPS = [
  { num: '01', title: 'Ingesta de Datos', desc: 'Pre-vectorización de la Constitución, Códigos y jurisprudencia clave en el backend RAG.' },
  { num: '02', title: 'Inferencia Local', desc: 'Al consultar, la búsqueda semántica ocurre en memoria local seleccionando fragmentos exactos.' },
  { num: '03', title: 'Generación Contextual', desc: 'Respuesta con citación explícita: inciso, artículo y ley, sin alucinaciones.' },
];

const AUDIENCES = [
  {
    icon: <Users size={20} />,
    title: 'Individuos y Familias',
    desc: 'Acceso democrático a la justicia. Consultas sobre arriendos, conflictos vecinales y laborales.'
  },
  {
    icon: <Book size={20} />,
    title: 'Estudiantes y Académicos',
    desc: 'Seguridad jurídica para investigar el CAE, la ley de educación superior y más.'
  },
  {
    icon: <Briefcase size={20} />,
    title: 'Emprendedores y PyMEs',
    desc: 'Cumplimiento legal desde el día uno. Resuelve dudas operativas, laborales y contractuales.'
  }
];

export default function LandingPage() {
  const { handleDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    await handleDemo();
    navigate('/chat');
  };

  return (
    <div className="relative min-h-screen bg-surface text-text-main overflow-x-hidden">

      {/* Ambient glow backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[40vw] h-[40vw] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'glowPulse 12s ease-in-out infinite alternate'
          }} />
        <div className="absolute bottom-[15%] right-[5%] w-[50vw] h-[50vw] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #e0c878 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'glowPulse 12s ease-in-out infinite alternate',
            animationDelay: '-6s'
          }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-100 bg-surface/70 backdrop-blur-2xl border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-center gap-3 text-white no-underline">
            <Scale size={22} className="text-accent" />
            <span className="font-serif text-xl tracking-wide font-[450] text-white/93">Sententia</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-full text-sm font-[450] text-text-sub hover:text-text-main transition-all">
              Iniciar Sesión
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-[450] hover:bg-accent/15 hover:border-accent/30 transition-all">
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[88vh] flex items-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(7,7,10,0.92) 0%, rgba(7,7,10,0.85) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        <div className="max-w-7xl mx-auto px-8 w-full pt-16 pb-24">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent-muted text-accent text-[0.7rem] font-[450] tracking-[0.12em] uppercase mb-10 animate-fade-in">
              <Shield size={12} />
              RAG Legal · Open Source · 100% Local
            </div>

            <h1 className="font-serif text-[clamp(3rem,5.5vw,5rem)] font-[400] leading-[1.08] tracking-[-0.03em] mb-6 animate-slide-up">
              Tu Asistente Legal
              <br />
              <span className="text-accent-gradient">Inteligente y Privado</span>
            </h1>

            <p className="text-lg md:text-xl text-text-sub font-[350] leading-relaxed max-w-[600px] mx-auto mb-12 animate-slide-up stagger-2">
              Consulta la legislación chilena y redacta documentos sin comprometer tus datos. Un motor RAG offline para garantizar la confidencialidad absoluta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-24 animate-slide-up stagger-3">
              <Link to={user ? '/chat' : '/register'}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full glass-panel-strong border border-accent/20 text-accent font-[450] hover:bg-accent/10 hover:border-accent/30 transition-all text-base">
                Iniciar Consulta Legal
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {!user && (
                <button onClick={handleDemoClick}
                  className="px-8 py-3.5 rounded-full bg-white/[0.03] border border-glass-border-light text-text-sub font-[400] cursor-pointer hover:text-accent hover:border-accent/25 hover:bg-accent/[0.04] hover:-translate-y-0.5 transition-all text-base">
                  Probar el Sistema
                </button>
              )}
            </div>

            {/* Terminal demo */}
            <div className="hidden lg:block w-full max-w-[820px] mx-auto animate-slide-up stagger-4">
              <div className="glass-panel-strong rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 bg-white/[0.02] border-b border-glass-border">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <span className="ml-3 text-text-muted text-xs font-sans tracking-wide">sententia — consulta legal</span>
                </div>
                <div className="p-6 font-sans text-sm leading-relaxed">
                  <p className="text-text-muted mb-1.5"><span className="text-accent/70">$</span> sententia query --codigo civil</p>
                  <p className="text-text-main mb-3">&gt; "¿Qué dice el Artículo 19 sobre la privacidad de las comunicaciones?"</p>
                  <p className="text-accent/80 mb-1">✓ 3 nodos relevantes (score &gt; 0.89)</p>
                  <p className="text-accent/80 mb-3">✓ Inferencia completada: 4.2s</p>
                  <p className="text-text-sub leading-relaxed">
                    "Conforme al Artículo 19, Nº 5 de la Constitución Política: La inviolabilidad del hogar y de toda forma de comunicación privada. Las comunicaciones no pueden ser interceptadas sino en los casos determinados por la ley."
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 animate-slide-up stagger-5">
              <ChevronDown size={20} className="text-text-muted animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 border-t border-b border-glass-border bg-white/[0.01] py-14">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-text-muted text-[0.6rem] font-[450] tracking-[0.2em] uppercase mb-10">Stack Tecnológico</p>
          <div className="flex justify-center items-center gap-10 md:gap-20 flex-wrap opacity-40 hover:opacity-70 transition-all">
            {['LangChain', 'Ollama', 'ChromaDB', 'DeepSeek-R1'].map((tech) => (
              <span key={tech} className="font-sans text-sm font-[400] tracking-wide text-text-sub">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-28">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-[clamp(2.2rem,3.5vw,3.2rem)] font-[400] tracking-[-0.02em] mb-5">
              Capacidades <span className="text-accent-gradient">Avanzadas</span>
            </h2>
            <p className="text-text-sub text-base max-w-[540px] mx-auto font-[350]">
              Diseñado para proteger la confidencialidad y revolucionar el acceso al texto normativo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div key={i}
                className="group relative glass-panel rounded-2xl p-10 transition-all duration-500 hover:-translate-y-1.5 hover:bg-glass-hover overflow-hidden animate-slide-up"
                style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-xl bg-accent-muted border border-accent/15 flex items-center justify-center mb-6 text-accent transition-all duration-300 group-hover:bg-accent/15 group-hover:border-accent/30">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-xl font-[450] text-text-main mb-3">{feature.title}</h3>
                <p className="text-text-sub text-sm font-[350] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-28 border-t border-glass-border bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-[clamp(2rem,3vw,2.8rem)] font-[400] tracking-[-0.02em] mb-4">
                Autónomo. Privado. <span className="text-accent-gradient">Eficaz.</span>
              </h2>
              <p className="text-text-sub text-base font-[350] mb-10 max-w-[480px]">
                Flujo optimizado para que te concentres en la estrategia legal mientras la IA extrae los datos.
              </p>
              <div className="flex flex-col gap-8">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex gap-5 relative animate-slide-up" style={{ animationDelay: `${0.1 * i}s` }}>
                    {i < STEPS.length - 1 && (
                      <div className="absolute top-[44px] left-[20px] bottom-[-20px] w-px bg-gradient-to-b from-accent/30 to-transparent" />
                    )}
                    <div className="w-10 h-10 shrink-0 rounded-full bg-accent-muted border border-accent/15 flex items-center justify-center font-serif text-sm text-accent z-2">
                      {step.num}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-serif text-lg font-[450] text-text-main mb-1.5">{step.title}</h4>
                      <p className="text-text-sub text-sm font-[350] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden glass-panel-strong">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent" />
                <div className="p-8 flex flex-col justify-center h-full">
                  <div className="space-y-4">
                    {[
                      { label: 'Precisión', value: '94%' },
                      { label: 'Latencia', value: '&lt; 2s' },
                      { label: 'Cobertura', value: '11 Códigos' },
                      { label: 'Privacidad', value: '100% Local' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
                        <span className="text-text-sub text-sm font-[350]">{stat.label}</span>
                        <span className="text-accent font-serif text-lg">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="relative z-10 py-28">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[clamp(2rem,3vw,2.8rem)] font-[400] tracking-[-0.02em] mb-4">
              Para <span className="text-accent-gradient">Quiénes</span>
            </h2>
            <p className="text-text-sub text-base font-[350] max-w-[500px] mx-auto">
              Democratizamos el acceso a la justicia con tecnología legal de vanguardia.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {AUDIENCES.map((item, i) => (
              <div key={i}
                className="glass-panel rounded-2xl p-8 transition-all duration-400 hover:-translate-y-1.5 hover:bg-glass-hover animate-slide-up"
                style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-accent/80">{item.icon}</div>
                  <h4 className="font-serif text-lg font-[450] text-text-main">{item.title}</h4>
                </div>
                <p className="text-text-sub text-sm font-[350] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 text-center border-t border-glass-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-8 relative">
          <h2 className="font-serif text-[clamp(2.2rem,3.5vw,3.5rem)] font-[400] tracking-[-0.02em] mb-5">
            El despacho legal del futuro.
          </h2>
          <p className="text-text-sub text-lg font-[350] mb-10 max-w-[500px] mx-auto">
            Configura tu entorno. Protege tu información. Analiza las leyes. Todo en un solo lugar.
          </p>
          <Link to="/register"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full glass-panel-strong border border-accent/20 text-accent font-[450] hover:bg-accent/10 hover:border-accent/30 transition-all text-base">
            Crear Cuenta Gratuita
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-border py-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Scale size={16} className="text-text-muted" />
            <span className="font-serif text-sm text-text-muted tracking-wide">Sententia</span>
          </div>
          <p className="text-text-muted text-xs font-[350]">
            © 2026 Sententia. Inteligencia Artificial aplicada al Derecho.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-text-muted hover:text-text-sub transition-colors">Políticas</a>
            <a href="https://github.com/LuSpace1/sententia-web" className="text-xs text-text-muted hover:text-text-sub transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
