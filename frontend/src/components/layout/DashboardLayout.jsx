import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  BookOpen,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  LogOut,
  BookMarked,
  Receipt,
  FileBarChart2,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'staff' ? 'Staff Dashboard' : 'Dashboard';
    if (p.includes('/search-books')) return 'Search Books';
    if (p.includes('/my-books')) return 'My Issued Books';
    if (p.includes('/my-fines')) return 'My Fines & Fees';
    if (p.includes('/payment-history')) return 'Payment History';
    if (p.includes('/payment-success')) return 'Payment Receipt';
    if (p.includes('/payment/')) return 'Pay Library Fine';
    if (p.includes('/profile')) return 'Account Profile';
    if (p.includes('/users')) return 'Manage Users';
    if (p.includes('/staff')) return 'Manage Staff';
    if (p.includes('/categories')) return 'Manage Categories';
    if (p.includes('/issue-requests')) return 'Issue Requests';
    if (p.includes('/issued-books')) return 'Active Issued Books';
    if (p.includes('/returns')) return 'Book Returns';
    if (p.includes('/members')) return 'Library Members';
    if (p.includes('/fines')) return 'Fine Management';
    if (p.includes('/reports')) return 'Reports & Analytics';
    if (p.includes('/books')) return 'Manage Books';
    return 'Library Dashboard';
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 999
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Role-based Sidebar */}
      <Sidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          {/* Left: Mobile Toggle & Page Title matching Reference Image */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              className="dashboard-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Right: Quick Links & Profile Dropdown matching Reference Image */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/books"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <BookOpen size={14} />
              <span>Catalog</span>
            </Link>

            <span
              className={`badge ${
                user?.role === 'admin'
                  ? 'badge-overdue'
                  : user?.role === 'staff'
                  ? 'badge-active'
                  : 'badge-available'
              }`}
              style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}
            >
              {user?.role}
            </span>

            {/* Profile Dropdown */}
            <div className="dropdown-menu-container" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '30px',
                  padding: '4px 12px 4px 4px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-600)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                    {user?.role || 'Member'}
                  </div>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{user?.name}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>

                  <Link
                    to={`/${user?.role === 'user' ? 'user' : user?.role}/profile`}
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>

                  {user?.role === 'user' && (
                    <>
                      <Link
                        to="/user/my-books"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <BookMarked size={16} />
                        <span>My Borrowed Books</span>
                      </Link>
                      <Link
                        to="/user/my-fines"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Receipt size={16} />
                        <span>My Fines & Dues</span>
                      </Link>
                    </>
                  )}

                  {user?.role === 'staff' && (
                    <>
                      <Link
                        to="/staff/issue-requests"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <ClipboardList size={16} />
                        <span>Issue Requests</span>
                      </Link>
                      <Link
                        to="/staff/books"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <BookOpen size={16} />
                        <span>Manage Books</span>
                      </Link>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin/users"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <ShieldCheck size={16} />
                        <span>Manage Users</span>
                      </Link>
                      <Link
                        to="/admin/reports"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FileBarChart2 size={16} />
                        <span>Reports & Intelligence</span>
                      </Link>
                    </>
                  )}

                  <div className="dropdown-divider" />

                  <button
                    onClick={handleLogout}
                    className="dropdown-item danger"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
