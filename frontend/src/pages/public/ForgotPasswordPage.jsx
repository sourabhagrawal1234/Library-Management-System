import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { BookOpen, Mail, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentInfo, setSentInfo] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      showToast('Please enter your registered email address', 'warning');
      return;
    }

    setSubmitting(true);
    setSentInfo(null);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setSentInfo({
          email: res.data.email,
          otp: res.data.otp,
          message: res.data.message
        });
        showToast(res.data.message || 'OTP sent successfully!', 'success');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || 'Unable to find an account with this email',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="auth-split-wrapper">
        <div className="auth-split-card" style={{ maxWidth: '960px', minHeight: '520px' }}>
          {/* Left Hero Banner */}
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
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                Need a hand getting back in?
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Use your registered email address to start the password recovery process and access your library account again.
              </p>
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  lineHeight: 1.5
                }}
              >
                Your library account and reading activity stay connected to your student profile.
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="auth-form-side" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Forgot Password?
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Enter the email address linked to your library account to receive a reset code.
              </p>
            </div>

            {sentInfo ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <span>Reset OTP Generated!</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#15803d', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                  A 6-digit password reset verification code has been generated for <strong>{sentInfo.email}</strong>.
                </p>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px dashed #22c55e',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>YOUR RESET OTP:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', letterSpacing: '4px', fontFamily: 'monospace' }}>
                    {sentInfo.otp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reset-password', { state: { email: sentInfo.email, otp: sentInfo.otp } })}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>Proceed to Reset Password</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Registered Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. student@library.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Mail
                      size={18}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                    Demo accounts: <code>student@library.com</code> or <code>saritanarwariya474@gmail.com</code>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    marginTop: '1rem',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    justifyContent: 'center'
                  }}
                >
                  <KeyRound size={18} />
                  <span>{submitting ? 'Generating Reset Code...' : 'Send Reset Code / OTP →'}</span>
                </button>
              </form>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </Link>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748b',
                fontSize: '0.78rem'
              }}
            >
              <ShieldCheck size={16} color="#059669" />
              <span>Password recovery requests are cryptographically timestamped and expire in 15 minutes.</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
