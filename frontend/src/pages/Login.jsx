import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { authService } from '../services/api';
import '../styles/auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.login(formData);
      onLogin(data);
      navigate('/chat');
    } catch {
      setError('Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="mb-5">
          <Link to="/" className="auth-back-link">
            <ChevronLeft size={16} className="me-1" aria-hidden="true" /> Volver al inicio
          </Link>
          <h2 className="auth-title">Entrar.</h2>
          <p className="auth-subtitle">Accede a tu asesoría legal personal.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="login-username" className="auth-label">Usuario</label>
            <input
              id="login-username"
              type="text"
              name="username"
              className="auth-input"
              placeholder="Usuario"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="login-password" className="auth-label">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="auth-input"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Entrando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿No tienes cuenta? </span>
          <Link to="/register" className="auth-footer-link">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

