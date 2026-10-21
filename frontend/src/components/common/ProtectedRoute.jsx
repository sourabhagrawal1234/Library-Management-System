import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying library authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#ef4444', marginBottom: '1.5rem' }}>
          <ShieldAlert size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your current account role (<strong>{user.role}</strong>) does not have sufficient permissions to view this administrative page.
        </p>
        <Navigate to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'staff' ? '/staff/dashboard' : '/user/dashboard'} replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
