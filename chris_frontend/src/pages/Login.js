import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import './Login.css';

// PUBLIC_INTERFACE
/**
 * Login page component with email/password authentication.
 * Features two-panel design with form on left and branding on right.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel auth-form-panel">
        <div className="auth-form">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access CHRIS platform</p>

          {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="large" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>

      <div className="auth-panel auth-brand-panel">
        <div className="auth-brand-content">
          <h2 className="brand-title">CHRIS</h2>
          <p className="brand-tagline">Chennai Hydro-Resilience Intelligence System</p>
          <p className="brand-description">
            Advanced flood risk prediction and resilience planning for Chennai metropolitan area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
