import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { BookOpen, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(location.state?.otp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });

      if (res.data.success) {
        setSuccess(true);
        showToast(res.data.message || 'Password reset successfully!', 'success');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || 'Unable to reset password. Please check your OTP.',
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
        <div className="auth-split-card" style={{ maxWidth: '960px', minHeight: '560px' }}>
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
                Create a new password
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Choose a strong password that you can remember. After saving it, you can log in using your registered email address.
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
                Keep your account secure. Never share your password or OTP with anyone.
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="auth-form-side" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Reset Password
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                Enter the verification code and set a new password for your account.
              </p>
            </div>

            {success ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '1.75rem',
                  textAlign: 'center',
                  margin: '1rem 0'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#dcfce7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: '#16a34a'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
                  Password Changed Successfully!
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '1.5rem' }}>
                  Your account password has been updated. You can now log in using your new credentials.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', padding: '0.75rem 2rem', fontSize: '0.95rem' }}
                >
                  Login to Your Account →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Registered Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <Mail
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>6-Digit Reset OTP</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      maxLength={6}
                      className="form-control"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ paddingLeft: '2.4rem', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 700 }}
                    />
                    <KeyRound
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <Lock
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <Lock
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                  {newPassword && confirmPassword && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: newPassword === confirmPassword ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{submitting ? 'Updating Password...' : 'Update Password →'}</span>
                </button>
              </form>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.25rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
