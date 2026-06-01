import { Link, useNavigate } from 'react-router-dom';
import { Scale, Shield, Zap, Search, Fingerprint, Book, Users, Briefcase, ArrowRight, Code, Cpu } from 'lucide-react';
import { useAuth } from '../context/useAuth';
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
    title: 'Privacidad en Local',
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
    desc: 'Seguridad juridica para estudiantes y académicos. consulta sobre la legalidad del CAE o la ley de educación superior.'
  },
  {
    icon: <Briefcase size={24} />,
    title: 'Emprendedores y PyMEs',
    desc: 'Asegura tu cumplimiento legal desde el día uno. Resuelve dudas operativas, laborales y contractuales con seguridad.'
  }
];

export default function LandingPage() {
  const { user, handleLogout, handleDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    if (handleDemo) {
      await handleDemo();
    }
    navigate('/chat');
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden font-[Outfit]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #c3a564 0%, transparent 70%)', filter: 'blur(120px)', animation: 'pulseGlow 10s ease-in-out infinite alternate' }} />
        <div className="absolute bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #dcb773 0%, transparent 70%)', filter: 'blur(120px)', animation: 'pulseGlow 10s ease-in-out infinite alternate', animationDelay: '-5s' }} />
      </div>

      <nav className="sticky top-0 z-100 bg-black/60 backdrop-blur-2xl border-b border-white/5 py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
            <Scale size={28} className="text-white" />
            <span className="font-[Outfit] font-extrabold">SENTENTIA</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/chat" className="hidden sm:inline-block px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white font-medium backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all">
                  Ir al Panel
                </Link>
                <button onClick={handleLogout} className="px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white font-medium backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-block px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white font-medium backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="px-5 py-2.5 rounded-full bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-100 hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] transition-all">
                  Comenzar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative z-10 flex items-center min-h-[85vh] py-16 md:py-24"
        style={{ backgroundImage: `radial-gradient(circle at 30% 50%, rgba(3,3,5,0.85) 0%, rgba(3,3,5,0.98) 100%), url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/10 text-[#c3a564] text-sm font-semibold tracking-wider backdrop-blur-md mb-8">
              <Shield size={16} /> RAG Legal Open Source
            </div>
            <h1 className="font-[Outfit] text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight mb-6">
              Tu Asistente Legal Inteligente. <br />
              <span className="text-gradient-accent">100% Privado y Local.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed max-w-[650px] mx-auto mb-12">
              Consulta la legislación chilena y redacta documentos sin comprometer tus datos. Un motor RAG offline diseñado para garantizar confidencialidad absoluta abogado-cliente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <Link to={user ? '/chat' : '/register'} className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-semibold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-100 hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] transition-all">
                Iniciar Consulta Legal <ArrowRight size={18} className="ml-2" />
              </Link>
              {!user && (
                <button onClick={handleDemoClick} className="px-8 py-4 rounded-full border border-white/10 bg-white/[0.03] text-white font-medium backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 transition-all text-lg">
                  Probar el Sistema
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block max-w-[850px] mx-auto">
            <div className="bg-[#09090b] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-zinc-500 text-xs font-mono">sententia-ai — bash</span>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed">
                <p className="text-zinc-400 mb-1">$ sententia-cli query --index constitucion</p>
                <p className="text-white mb-3">&gt; "¿Qué garantías constitucionales protegen la privacidad de mis comunicaciones?"</p>
                <p className="text-green-500 mb-1">✓ Encontrados 3 nodos relevantes (score &gt; 0.89)</p>
                <p className="text-green-500 mb-3">✓ Inferencia DeepSeek completada: 4.2s</p>
                <p className="text-white/75">
                  "Según el Artículo 19, Nº 5 de la Constitución Política de la República, se asegura a todas las personas: La inviolabilidad del hogar y de toda forma de comunicación privada. Las comunicaciones no pueden ser interceptadas, abiertas o registradas sino en los casos y formas determinados por la ley."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/5 bg-white/[0.01] py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-zinc-600 text-xs font-semibold tracking-widest uppercase mb-8">Potenciado por Stack Tecnológico Moderno</p>
          <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap opacity-50 grayscale hover:opacity-80 transition-all">
            <span className="flex items-center gap-2 font-bold text-lg tracking-tight"><Code size={20} /> LangChain</span>
            <span className="flex items-center gap-2 font-bold text-lg tracking-tight"><Zap size={20} /> Ollama</span>
            <span className="flex items-center gap-2 font-bold text-lg tracking-tight"><Search size={20} /> ChromaDB</span>
            <span className="flex items-center gap-2 font-bold text-lg tracking-tight"><Cpu size={20} /> DeepSeek-R1</span>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-[Outfit] text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-tight mb-4">Capacidades <span className="text-gradient-accent">Avanzadas</span></h2>
            <p className="text-zinc-400 text-lg max-w-[600px] mx-auto">Diseñado para proteger la confidencialidad, revolucionando el acceso al texto normativo en tribunales y empresas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/5 rounded-2xl p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/10 hover:bg-white/[0.06] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-15 h-15 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 text-white transition-all duration-300 group-hover:bg-accent/10 group-hover:border-accent/30 group-hover:text-accent group-hover:scale-105">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-light">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-[Outfit] text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-tight mb-4">Autónomo. Privado. Eficaz.</h2>
            <p className="text-zinc-400 text-lg max-w-[600px] mx-auto">Flujo de trabajo optimizado para que te concentres en la estrategia legal, mientras la IA hace la extracción de datos.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {[
                { num: '1', title: 'Ingesta de Datos', desc: 'Sententia pre-vectoriza el Código Civil, la Constitución y jurisprudencia clave a través del backend RAG.' },
                { num: '2', title: 'Inferencia Local', desc: 'Al realizar una consulta, la búsqueda de similitud ocurre en la memoria local, seleccionando fragmentos exactos.' },
                { num: '3', title: 'Generación Contextual', desc: 'El modelo provee una respuesta precisa con citación explícita (Inciso, Artículo y Ley) sin inventar jurisprudencia.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-6 mb-10 relative">
                  {i < 2 && <div className="absolute top-[50px] left-[24px] bottom-[-20px] w-px bg-white/10" />}
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-white z-2">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                    <p className="text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <img src={featureImg} alt="Legal Tech Process" className="max-w-full rounded-2xl shadow-2xl border border-white/5 transition-transform hover:-translate-y-1 hover:scale-[1.01]" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 pb-4">
            <div>
              <h2 className="font-[Outfit] text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-tight text-left">Democratización de la <span className="text-gradient-white">Justicia</span></h2>
            </div>
            <div className="text-center lg:text-right">
              <img src={audienceImg} alt="Justice Scale" className="max-w-[80%] inline-block rounded-2xl shadow-2xl border border-white/5 transition-transform hover:-translate-y-1 hover:scale-[1.01]" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCES.map((audience, idx) => (
              <div key={idx} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-white/10 hover:bg-white/[0.04]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-white/75">{audience.icon}</div>
                  <h4 className="font-bold text-lg">{audience.title}</h4>
                </div>
                <p className="text-zinc-400 leading-relaxed font-light text-sm">{audience.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-32 text-center border-t border-white/[0.02]"
        style={{ background: 'radial-gradient(circle at center, rgba(30,30,40,0.8) 0%, transparent 70%)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">El despacho legal del futuro.</h2>
          <p className="text-xl md:text-2xl text-zinc-500 mb-12 max-w-lg mx-auto">
            Configura tu entorno. Protege tu información. Analiza las leyes. Todo en un solo lugar.
          </p>
          <Link to="/register" className="inline-flex px-8 py-4 rounded-full bg-white text-black font-semibold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-100 hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] transition-all">
            Crear Cuenta Gratuita
          </Link>
        </div>
      </section>

      <footer className="relative z-10 bg-black/50 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-white/50" />
            <span className="font-bold text-white/75">SENTENTIA LABS</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 Sententia. Inteligencia Artificial Aplicada al Derecho.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Políticas</a>
            <a href="https://github.com/LuSpace1/sententia-web" className="text-sm text-zinc-400 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
