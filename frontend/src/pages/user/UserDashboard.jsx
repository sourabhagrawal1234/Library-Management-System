import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import api from '../../services/api';
import {
  BookMarked,
  Clock,
  AlertOctagon,
  IndianRupee,
  CheckCircle2,
  Hourglass,
  Search,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  CreditCard
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/user-dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load user dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/user/search-books?search=${encodeURIComponent(quickQuery.trim())}`);
    } else {
      navigate('/user/search-books');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b' }}>Loading dashboard data...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalIssued: 0,
    dueSoon: 0,
    overdue: 0,
    currentFine: 0,
    paidFine: 0,
    pendingRequests: 0
  };

  return (
    <div>
      {/* Header Greeting (Screen 4 Reference) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
          Welcome, {user?.name || 'Student'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Here's what's happening with your library account.
        </p>
      </div>

      {/* 4 Stat Cards (Screen 4 Reference) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Issued</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalIssued}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Due Soon</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.dueSoon}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Overdue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.overdue}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #2563eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Fine</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.currentFine > 0 ? '#dc2626' : '#059669' }}>
              ₹{stats.currentFine}
            </div>
          </div>
        </div>
      </div>

      {/* In-Page Book Search Bar (Screen 4 Reference) */}
      <form onSubmit={handleQuickSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.75rem', borderRadius: '10px', height: '48px' }}
            placeholder="Search books by title, author, category or book ID..."
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 1.75rem', borderRadius: '10px' }}>
          Search
        </button>
      </form>

      {/* Two Column Section: Recently Issued Books (Left) + Notifications (Right) */}
      <div className="user-dashboard-grid">
        {/* Left Column: Recently Issued Books */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Recently Issued Books
            </h3>
            <Link to="/user/my-books" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
              View All
            </Link>
          </div>

          {(!data?.recentIssues || data.recentIssues.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <BookOpen size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9rem' }}>No borrowed books at this moment.</p>
              <Link to="/books" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid #f1f5f9' }}>
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentIssues.map((issue) => (
                    <tr key={issue._id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {issue.book?.title}
                      </td>
                      <td>{issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'Pending'}</td>
                      <td>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            issue.status === 'issued'
                              ? 'badge-active'
                              : issue.status === 'returned'
                              ? 'badge-available'
                              : issue.status === 'overdue'
                              ? 'badge-overdue'
                              : 'badge-due-soon'
                          }`}
                        >
                          {issue.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: issue.status === 'overdue' ? '#dc2626' : '#64748b' }}>
                          {issue.status === 'overdue' ? '₹50' : '₹0'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Live Notifications Panel (Screen 4 Reference) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
            Notifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="notification-item">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Book request approved
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Clean Code request has been approved
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  Just now
                </div>
              </div>
            </div>

            {stats.currentFine > 0 && (
              <div className="notification-item">
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991b1b' }}>
                    Fine generated
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Late return fine of ₹{stats.currentFine} recorded
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    Overdue penalty
                  </div>
                </div>
              </div>
            )}

            <div className="notification-item">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Book issued
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Loan duration standard: 14 days
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  1 day ago
                </div>
              </div>
            </div>

            <div className="notification-item">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Payment portal ready
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Instant receipts via UPI / Card / Net Banking
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  System notification
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Quick Actions Bar (Screen 4 Reference) */}
      <div className="card" style={{ marginTop: '1.75rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Quick Actions
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Frequent student library actions
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link to="/user/search-books" className="quick-action-pill">
              <Search size={16} color="#2563eb" />
              <span>Search Books</span>
            </Link>
            <Link to="/user/my-books" className="quick-action-pill">
              <BookMarked size={16} color="#2563eb" />
              <span>My Books</span>
            </Link>
            <Link to="/user/my-fines" className="quick-action-pill">
              <IndianRupee size={16} color="#dc2626" />
              <span>Pay Fine</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
