import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { authService } from '../services/api';
import '../styles/auth.css';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
      const { data } = await authService.register(formData);
      onLogin(data);
      navigate('/chat');
    } catch {
      setError('Error en el registro. Es posible que el usuario ya exista.');
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
          <h2 className="auth-title">Registro.</h2>
          <p className="auth-subtitle">Crea tu cuenta legal por $1.000/mes.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="register-username" className="auth-label">Nombre de Usuario</label>
            <input
              id="register-username"
              type="text"
              name="username"
              className="auth-input"
              placeholder="Nombre de Usuario"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="register-email" className="auth-label">Email (Opcional)</label>
            <input
              id="register-email"
              type="email"
              name="email"
              className="auth-input"
              placeholder="Email (Opcional)"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="register-password" className="auth-label">Contraseña</label>
            <input
              id="register-password"
              type="password"
              name="password"
              className="auth-input"
              placeholder="Contraseña (Mín. 8 caracteres)…"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Creando cuenta…' : 'Registrarse y Empezar'}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿Ya tienes cuenta? </span>
          <Link to="/login" className="auth-footer-link">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
