import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onToggleForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password); // AuthContext will handle navigation
    } catch (err: any) {
      const msg = typeof err === 'string'
        ? err
        : err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    }
  };

  return (
    <div className="auth-form-container" style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      margin: '0 auto',
      padding: '24px'
    }}>
      <h2 className="text-center mb-4" style={{
        color: '#2C3E50',
        fontWeight: 'bold'
      }}>Login</h2>
      {error && (
        <div className="error-message" style={{
          background: '#FFEBEE',
          color: '#C62828',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#2C3E50',
            fontWeight: '500'
          }}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #BDC3C7',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#2C3E50',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#2C3E50',
            fontWeight: '500'
          }}>Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #BDC3C7',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#2C3E50',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <div className="flex items-center" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '16px'
          }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                verticalAlign: 'middle'
              }}
            />
            <label htmlFor="remember" style={{
              color: '#2C3E50',
              fontWeight: '500',
              verticalAlign: 'middle'
            }}>Remember me</label>
          </div>
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3498DB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          Login
        </button>
      </form>
      <div className="text-center mt-4">
        <span className="text-gray-600">Don't have an account? </span>
        <span 
          onClick={onToggleForm}
          style={{
            color: '#3498DB',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          Register
        </span>
      </div>
    </div>
  );
};

export default LoginForm;