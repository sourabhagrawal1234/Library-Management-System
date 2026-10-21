import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  BookMarked,
  Receipt,
  ClipboardList,
  ShieldCheck,
  FileBarChart2
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    return '/user/dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">
          <BookOpen size={24} />
        </div>
        <div>
          <span style={{ display: 'block', lineHeight: 1.1, fontSize: '1.15rem' }}>Library Management System</span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>Read • Learn • Grow</span>
        </div>
      </Link>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 100
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Navigation Links */}
      <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link
          to="/"
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Home
        </Link>
        <Link
          to="/books"
          className={`nav-link ${isActive('/books') ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Books Catalog
        </Link>
        <Link
          to="/about"
          className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          About & Rules
        </Link>

        {isAuthenticated ? (
          <>
            {/* Desktop User Dropdown */}
            <div
              className="dropdown-menu-container"
              ref={dropdownRef}
              style={{ display: mobileMenuOpen ? 'none' : 'block', marginLeft: '0.75rem' }}
            >
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '30px',
                  padding: '5px 12px 5px 6px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-600)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                    {user?.name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-600)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {user?.role}
                  </div>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{user?.name}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>

                  <Link
                    to={getDashboardPath()}
                    className="dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    <span>{user?.role?.toUpperCase()} Dashboard</span>
                  </Link>

                  {user?.role === 'user' && (
                    <>
                      <Link
                        to="/user/my-books"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <BookMarked size={16} />
                        <span>My Borrowed Books</span>
                      </Link>
                      <Link
                        to="/user/my-fines"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
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
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ClipboardList size={16} />
                        <span>Issue Requests</span>
                      </Link>
                      <Link
                        to="/staff/books"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
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
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ShieldCheck size={16} />
                        <span>Manage Users</span>
                      </Link>
                      <Link
                        to="/admin/reports"
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FileBarChart2 size={16} />
                        <span>Institutional Reports</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to={`/${user?.role === 'user' ? 'user' : user?.role}/profile`}
                    className="dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>

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

            {/* Mobile Drawer Role Shortcuts */}
            {mobileMenuOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Signed in as <strong>{user.name}</strong> ({user.role})
                </div>
                <Link
                  to={getDashboardPath()}
                  className="btn btn-outline btn-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  <span>Go to {user.role.toUpperCase()} Dashboard</span>
                </Link>
                {user.role === 'user' && (
                  <>
                    <Link
                      to="/user/my-books"
                      className="nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Borrowed Books
                    </Link>
                    <Link
                      to="/user/my-fines"
                      className="nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Fines & Fees
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger)', marginTop: '0.5rem' }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: mobileMenuOpen ? 0 : '1rem', width: mobileMenuOpen ? '100%' : 'auto', flexDirection: mobileMenuOpen ? 'column' : 'row' }}>
            <Link
              to="/login"
              className="btn btn-outline btn-sm"
              style={{ width: mobileMenuOpen ? '100%' : 'auto' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm"
              style={{ width: mobileMenuOpen ? '100%' : 'auto' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <UserPlus size={16} />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>

      <button
        className="mobile-menu-toggle"
        id="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        title="Toggle Menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </nav>
  );
};

export default Navbar;
