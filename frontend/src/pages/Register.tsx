import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-8"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(3,3,5,0.9) 0%, rgba(3,3,5,0.75) 100%), url(${heroBg})` }}>
      <div className="w-full max-w-[420px] bg-black/[0.4] backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} className="mr-1" /> Volver al inicio
          </Link>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Registro.</h2>
          <p className="text-zinc-400">Crea tu cuenta legal por $1.000/mes.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm border border-red-500/20 mb-6" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="register-username" className="text-sm font-medium text-white">Nombre de Usuario</label>
            <input
              id="register-username"
              type="text"
              name="username"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base transition-all focus:outline-none focus:border-indigo-400 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"
              placeholder="Nombre de Usuario"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="register-email" className="text-sm font-medium text-white">Email (Opcional)</label>
            <input
              id="register-email"
              type="email"
              name="email"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base transition-all focus:outline-none focus:border-indigo-400 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"
              placeholder="Email (Opcional)"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="register-password" className="text-sm font-medium text-white">Contraseña</label>
            <input
              id="register-password"
              type="password"
              name="password"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base transition-all focus:outline-none focus:border-indigo-400 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"
              placeholder="Contraseña (Mín. 8 caracteres)…"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <button className="w-full bg-white text-black font-semibold rounded-xl py-4 text-base mt-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Creando cuenta…' : 'Registrarse y Empezar'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          <span>¿Ya tienes cuenta? </span>
          <Link to="/login" className="text-white font-semibold ml-1 hover:underline">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
