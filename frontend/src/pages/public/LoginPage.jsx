import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BookOpen, LogIn, Mail, Lock, Shield, UserCheck, KeyRound } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'staff') navigate('/staff/dashboard', { replace: true });
      else navigate('/user/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');

      if (loggedUser.role === 'admin') navigate('/admin/dashboard');
      else if (loggedUser.role === 'staff') navigate('/staff/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Invalid login credentials', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo auto-fill helper
  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@library.com');
      setPassword('Admin@123');
    } else if (role === 'staff') {
      setEmail('staff@library.com');
      setPassword('Staff@123');
    } else {
      setEmail('student@library.com');
      setPassword('Student@123');
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="auth-split-wrapper">
        <div className="auth-split-card">
          {/* Left Hero Banner (Screen 2 Reference) */}
          <div className="auth-banner-side">
            <div className="auth-banner-bg" />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <BookOpen size={28} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                Library Management System
              </h2>
              <p style={{ color: '#93c5fd', fontSize: '0.95rem' }}>
                Centralized academic resources and circulation platform.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                Welcome Back!
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Access your library account, track issued books, manage due dates and settle fines seamlessly.
              </p>
            </div>
          </div>

          {/* Right Form Card (Screen 2 Reference) */}
          <div className="auth-form-side">
            {/* Role Switcher Tabs */}
            <div className="role-segmented-tabs">
              <button
                type="button"
                className={`role-segmented-tab ${email.includes('student') || email.includes('rahul') || (!email.includes('staff') && !email.includes('admin')) ? 'active' : ''}`}
                onClick={() => setDemoCredentials('user')}
              >
                User
              </button>
              <button
                type="button"
                className={`role-segmented-tab ${email.includes('staff') ? 'active' : ''}`}
                onClick={() => setDemoCredentials('staff')}
              >
                Staff
              </button>
              <button
                type="button"
                className={`role-segmented-tab ${email.includes('admin') ? 'active' : ''}`}
                onClick={() => setDemoCredentials('admin')}
              >
                Admin
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Login to Your Account
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Enter your credentials or click any role tab above for 1-click login.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); showToast('Demo accounts password is: Admin@123 / Staff@123 / Student@123', 'info'); }} style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.75rem', fontSize: '1rem', borderRadius: '10px' }}
              >
                <LogIn size={18} />
                <span>{submitting ? 'Authenticating...' : 'Login'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2563eb', fontWeight: 700 }}>
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
