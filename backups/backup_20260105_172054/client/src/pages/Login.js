import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
   
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Inloggen</h1>
        <p className="auth-subtitle">Welkom terug! Log in om verder te gaan met leren.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="student@student.nl"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Wachtwoord</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{width: '100%'}}>
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>

        <p className="auth-footer">
          Nog geen account? <Link to="/register">Registreer hier</Link>
        </p>

        <div className="demo-accounts">
          <p><strong>Demo Accounts:</strong></p>
          <p>student@student.nl / password123</p>
          <p>admin@ailiteracy.nl / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
