import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  BookMarked,
  Receipt,
  History,
  User,
  LogOut,
  BookOpen,
  ClipboardList,
  RotateCcw,
  Users,
  BadgeAlert,
  ShieldCheck,
  FolderTree,
  FileBarChart2,
  BookKey,
  Bookmark,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Search Books', path: '/user/search-books', icon: Search },
    { label: 'My Books', path: '/user/my-books', icon: BookMarked },
    { label: 'Reservations', path: '/user/reservations', icon: Bookmark },
    { label: 'My Fines', path: '/user/my-fines', icon: Receipt },
    { label: 'Payment History', path: '/user/payment-history', icon: History },
    { label: 'Profile', path: '/user/profile', icon: User }
  ];

  const staffNavItems = [
    { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Books', path: '/staff/books', icon: BookOpen },
    { label: 'Issue Requests', path: '/staff/issue-requests', icon: ClipboardList },
    { label: 'Issued Books', path: '/staff/issued-books', icon: BookKey },
    { label: 'Returns', path: '/staff/returns', icon: RotateCcw },
    { label: 'Reservations', path: '/staff/reservations', icon: Bookmark },
    { label: 'Members', path: '/staff/members', icon: Users },
    { label: 'Fines', path: '/staff/fines', icon: BadgeAlert },
    { label: 'Profile', path: '/staff/profile', icon: User }
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/users', icon: Users },
    { label: 'Staff', path: '/admin/staff', icon: ShieldCheck },
    { label: 'Books', path: '/admin/books', icon: BookOpen },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Issues', path: '/admin/issues', icon: ClipboardList },
    { label: 'Returns', path: '/admin/returns', icon: RotateCcw },
    { label: 'Reservations', path: '/admin/reservations', icon: Bookmark },
    { label: 'Fines', path: '/admin/fines', icon: BadgeAlert },
    { label: 'Payments', path: '/admin/payments', icon: History },
    { label: 'Reports', path: '/admin/reports', icon: FileBarChart2 },
    { label: 'Profile', path: '/admin/profile', icon: User }
  ];

  let navItems = userNavItems;
  if (user.role === 'admin') navItems = adminNavItems;
  else if (user.role === 'staff') navItems = staffNavItems;

  return (
    <aside
      className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        backgroundColor: '#0c1e3a',
        color: '#ffffff',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Sidebar Header matching Reference Image */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            backgroundColor: '#2563eb',
            padding: '0.45rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <BookOpen size={20} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
            Library LMS
          </h2>
        </div>
        <button
          onClick={onClose}
          className="mobile-close-btn"
          style={{
            marginLeft: 'auto',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            padding: '6px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation links matching solid blue active pill from image */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth <= 1024 && onClose) onClose();
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 120ms ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Profile Info matching Template Sidebar */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {user?.name && user?.name !== 'Student User' ? user.name.charAt(0).toUpperCase() : 'S'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user?.name && user?.name !== 'Student User' ? user.name : 'Sourabh Agrawal'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            {['user', 'student'].includes(user?.role) ? 'Library Member' : user?.role?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Sidebar Footer with Logout matching reference image */}
      <div
        style={{
          padding: '0.5rem 0.75rem 1rem',
          borderTop: 'none'
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.9rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontWeight: 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
