import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BookOpen, UserPlus, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password) {
      showToast('Please fill in all mandatory fields', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: 'user',
        password,
        confirmPassword
      });
      showToast(`Account created successfully! Welcome, ${newUser.name}.`, 'success');
      navigate('/user/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="auth-split-wrapper">
        <div className="auth-split-card" style={{ maxWidth: '1000px' }}>
          {/* Left Hero Banner (Screen 3 Reference) */}
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
                Online college & university library network.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                Join Our Library
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Create your account and get access to thousands of books, journals, research papers and course materials.
              </p>
            </div>
          </div>

          {/* Right Form Card (Screen 3 Reference) */}
          <div className="auth-form-side" style={{ padding: '2.5rem 3rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                Create Your Account
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Fill in your details to register
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Membership Card Notice */}
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                    Membership Enrollment
                  </span>
                  <strong style={{ fontSize: '0.92rem', color: '#1e3a8a' }}>
                    Student / Library Member
                  </strong>
                </div>
                <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
                  Public Registration
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                ℹ️ Staff and Admin accounts are securely provisioned by Library Administration.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '10px' }}
              >
                <UserPlus size={18} />
                <span>{submitting ? 'Registering...' : 'Register'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2563eb', fontWeight: 700 }}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;
