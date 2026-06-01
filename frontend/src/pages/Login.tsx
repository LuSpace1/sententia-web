import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/useAuth';
import heroBg from '../assets/images/hero_justice_hall.jpg';

export default function Login() {
  const { handleLogin } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
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
      const { data } = await authService.login(formData);
      handleLogin(data);
      navigate('/chat');
    } catch {
      setError('Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-8"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(3,3,5,0.9) 0%, rgba(3,3,5,0.75) 100%), url(${heroBg})` }}>
      <div className="w-full max-w-[420px] bg-black/[0.4] backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} className="mr-1" /> Volver al inicio
          </Link>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Entrar.</h2>
          <p className="text-zinc-400">Accede a tu asesoría legal personal.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm border border-red-500/20 mb-6" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-username" className="text-sm font-medium text-white">Usuario</label>
            <input
              id="login-username"
              type="text"
              name="username"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base transition-all focus:outline-none focus:border-indigo-400 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"
              placeholder="Usuario"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-white">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base transition-all focus:outline-none focus:border-indigo-400 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button className="w-full bg-white text-black font-semibold rounded-xl py-4 text-base mt-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Entrando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          <span>¿No tienes cuenta? </span>
          <Link to="/register" className="text-white font-semibold ml-1 hover:underline">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
