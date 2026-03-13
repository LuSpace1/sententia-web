import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { authService } from '../services/api';
import '../index.css';

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
    <div className="vh-100 d-flex align-items-center justify-content-center" style={{ background: '#000' }}>
      <div className="card border-dark p-5 rounded-4 shadow-2xl" style={{ width: '450px', background: '#080808' }}>
        <div className="mb-5">
          <Link to="/" className="text-secondary text-decoration-none small d-flex align-items-center mb-4 hover-white">
            <ChevronLeft size={16} className="me-1" /> Volver al inicio
          </Link>
          <h2 className="display-6 fw-extrabold tracking-tighter mb-2">Registro.</h2>
          <p className="text-secondary fw-light">Crea tu cuenta legal por $1.000/mes.</p>
        </div>

        {error && (
          <div className="alert alert-danger p-3 rounded-3 mb-4 bg-transparent border-danger text-danger small">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="username"
              className="form-control form-control-lg bg-black border-dark text-white rounded-3 shadow-none py-3"
              placeholder="Nombre de Usuario"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              className="form-control form-control-lg bg-black border-dark text-white rounded-3 shadow-none py-3"
              placeholder="Email (Opcional)"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-5">
            <input
              type="password"
              name="password"
              className="form-control form-control-lg bg-black border-dark text-white rounded-3 shadow-none py-3"
              placeholder="Contraseña (Mín. 8 caracteres)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>
          <button className="btn btn-minimal w-100 btn-lg py-3 fw-bold shadow-lg" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarse y Empezar'}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-secondary small">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-white text-decoration-none fw-bold border-bottom border-white ms-2">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
