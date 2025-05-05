import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
  onToggleForm: () => void;
}

interface ErrorType {
  message: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError({ message: 'Please enter a valid name' });
      return;
    }

    try {
      await register(email, password, name);
      setSuccessMessage('Registration successful. Please login to continue.');
      setTimeout(() => {
        onToggleForm();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle API errors specifically for registration
      if (err.response?.data?.email?.[0]?.includes('already exists')) {
        setError({ message: 'This email is already registered. Please login or use a different email.' });
      } else if (err.response?.data?.email?.[0]?.includes('valid')) {
        setError({ message: 'Please enter a valid email address.' });
      } else if (err.response?.data?.password) {
        setError({ message: err.response.data.password[0] });
      } else {
        setError({ message: err.response?.data?.detail || 'Registration failed. Please try again.' });
      }
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
      }}>Register</h2>
      
      {/* Display error message */}
      {error && (
        <div className="error-message" style={{
          background: '#FFEBEE',
          color: '#C62828',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error.message}
          {error.message?.includes('already exists') && (
            <div className="mt-2">
              <span 
                onClick={() => {
                  onToggleForm();
                  navigate('/login');
                }}
                style={{
                  color: '#3498DB',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                Click here to login
              </span>
            </div>
          )}
        </div>
      )}

      {/* Display success message */}
      {successMessage && (
        <div className="success-message" style={{
          background: '#C6E2B5',
          color: '#2E865F',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="name" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#2C3E50',
            fontWeight: '500'
          }}>Full Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        <button
          type="submit"
          className="auth-button"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3498DB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease'
          }}
        >
          Register
        </button>
      </form>
      <div className="auth-switch" style={{
        textAlign: 'center',
        marginTop: '24px',
        color: '#7F8C8D'
      }}>
        <span
          onClick={onToggleForm}
          style={{
            color: '#3498DB',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Already have an account? Login
        </span>
      </div>
    </div>
  );
};

export default RegisterForm;