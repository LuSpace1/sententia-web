import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/useAuth';
import heroBg from '../assets/images/hero_justice_hall.jpg';

export default function Register() {
  const { handleLogin } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.register(formData);
      handleLogin(data);
      navigate('/chat');
    } catch {
      setError('Error en el registro. Es posible que el usuario ya exista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-hero-diagonal min-h-screen flex items-center justify-center p-8 relative overflow-hidden"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(7,7,10,0.92) 0%, rgba(7,7,10,0.85) 100%), url(${heroBg})` }}>
      <div className="bg-glow-gold-right absolute inset-0 pointer-events-none" />

      <div className="w-full max-w-[400px] glass-panel-strong rounded-2xl p-10 animate-modal">
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-sub transition-colors mb-6 group">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-accent" />
            <h2 className="font-serif text-3xl font-normal tracking-[-0.02em]">Registro</h2>
          </div>
          <p className="text-text-sub text-sm font-subtle">Crea tu cuenta gratuita.</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm p-3.5 rounded-xl border border-danger/20 mb-6 font-subtle" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-username" className="text-sm font-emphasized text-text-main">Usuario</label>
            <input
              id="reg-username"
              type="text"
              name="username"
              className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3.5 text-text-main text-base transition-all focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] font-subtle placeholder:text-text-muted"
              placeholder="Nombre de usuario"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-sm font-emphasized text-text-main">Email <span className="text-text-muted font-subtle">(opcional)</span></label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3.5 text-text-main text-base transition-all focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] font-subtle placeholder:text-text-muted"
              placeholder="email@ejemplo.cl"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-sm font-emphasized text-text-main">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3.5 text-text-main text-base transition-all focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] font-subtle placeholder:text-text-muted"
              placeholder="Mín. 8 caracteres"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <button
            className="w-full py-3.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-emphasized mt-3 transition-all hover:bg-accent/15 hover:border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            type="submit"
            disabled={loading}
            aria-busy={loading}>
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted font-subtle">
          <span>¿Ya tienes cuenta? </span>
          <Link to="/login" className="text-accent font-emphasized ml-1 hover:opacity-80 transition-opacity">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
