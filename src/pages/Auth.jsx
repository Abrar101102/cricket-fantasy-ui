import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const isExpired = params.get('reason') === 'expired';

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
    setRateLimitError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRateLimitError(null);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
        
      const response = await api.post(endpoint, payload);
      localStorage.setItem('token', response.data.token);
      navigate('/lobby');
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimitError(err.response.data.error || 'Too many attempts. Try again later.');
      } else {
        setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      {isExpired && (
        <div style={{ backgroundColor: '#eab308', color: '#000', padding: '1rem', textAlign: 'center', fontWeight: 'bold', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
          Your session expired. Please log in again.
        </div>
      )}
      <div className="auth-hero" style={{ marginTop: isExpired ? '3rem' : '0' }}>
        <h1 className="auth-title">Cricket Fantasy<span className="text-gradient">PRO</span></h1>
        <p className="auth-subtitle">Build your ultimate dream team. Analyze player forms, join contests, and dominate the global leaderboard.</p>
      </div>

      <div className="glass-panel auth-card">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { if(!loading) handleToggle() }}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { if(!loading) handleToggle() }}
            type="button"
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-banner animate-fade-in">{error}</div>}

          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                name="name" 
                className="input-field" 
                placeholder="Virat Kohli"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              name="email" 
              className="input-field" 
              placeholder="player@fantasy.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              name="password" 
              className="input-field" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Authenticating...' : (isLogin ? 'Enter Arena' : 'Join the League')}
          </button>
        </form>
        {rateLimitError && (
          <div style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
            {rateLimitError}
          </div>
        )}
      </div>
    </div>
  );
}
