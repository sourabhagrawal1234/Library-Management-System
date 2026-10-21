import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  BookMarked,
  CheckCircle2,
  Hourglass,
  AlertTriangle,
  Receipt,
  RotateCcw,
  PlusCircle,
  Users,
  Check,
  X,
  ArrowRight
} from 'lucide-react';

const StaffDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/staff-dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await api.put(`/issues/${id}/approve`);
      if (res.data.success) {
        showToast('Request approved and book issued successfully!', 'success');
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason/remarks:');
    if (reason === null) return; // user cancelled

    try {
      const res = await api.put(`/issues/${id}/reject`, { remarks: reason || 'Declined by staff' });
      if (res.data.success) {
        showToast('Request marked as rejected', 'info');
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b' }}>Loading circulation dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalBooks: 0,
    issuedBooks: 0,
    availableBooks: 0,
    pendingRequests: 0,
    overdueBooks: 0,
    pendingFines: 0,
    returnedBooks: 0
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Staff Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Manage library operations, book circulation, and student issue requests.
        </p>
      </div>

      {/* 4 Primary Operational Metric Cards matching Screen 14 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
        <StatCard title="Total Books" value={stats.totalBooks} icon={BookOpen} color="green" subtext="Catalog inventory" />
        <StatCard title="Issued Books" value={stats.issuedBooks} icon={BookMarked} color="blue" subtext="Currently checked out" />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Hourglass} color="amber" subtext="Awaiting review" />
        <StatCard title="Overdue Books" value={stats.overdueBooks} icon={AlertTriangle} color="red" subtext="Past due date" />
      </div>

      {/* 5 Quick Action Pill Buttons from Screen 14 */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginRight: '0.5rem' }}>
          Quick Actions:
        </span>
        <Link to="/staff/books?action=add" className="btn btn-primary btn-sm">
          <PlusCircle size={15} />
          <span>+ Add Book</span>
        </Link>
        <Link to="/staff/issue-requests" className="btn btn-secondary btn-sm">
          <BookMarked size={15} />
          <span>Issue Book</span>
        </Link>
        <Link to="/staff/returns" className="btn btn-secondary btn-sm">
          <RotateCcw size={15} />
          <span>Return Book</span>
        </Link>
        <Link to="/staff/members" className="btn btn-secondary btn-sm">
          <Users size={15} />
          <span>Manage Members</span>
        </Link>
        <Link to="/admin/reports" className="btn btn-secondary btn-sm">
          <Receipt size={15} />
          <span>Reports</span>
        </Link>
      </div>

      {/* Pending Requests Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Pending Student Issue Requests ({data?.recentRequests?.length || 0})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Verify student eligibility and approve for checkout
            </span>
          </div>
          <Link to="/staff/issue-requests" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
            View All Requests
          </Link>
        </div>

        {(!data?.recentRequests || data.recentRequests.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
            No pending issue requests requiring review.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Requested Book</th>
                  <th>Stack Location</th>
                  <th>Stock Copies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.book?.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ISBN: {req.book?.isbn}</div>
                    </td>
                    <td>
                      <span className="badge badge-active">{req.book?.shelfLocation || 'Stack CS'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: req.book?.availableCopies > 0 ? '#059669' : '#dc2626' }}>
                        {req.book?.availableCopies} left
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={approvingId === req._id || req.book?.availableCopies <= 0}
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          <Check size={14} />
                          <span>{approvingId === req._id ? 'Approving...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Returns Log */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Recently Checked-In Returns
          </h3>
          <Link to="/staff/returns" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
            Process Returns
          </Link>
        </div>

        {(!data?.recentReturns || data.recentReturns.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
            No books returned recently.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Check-In Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentReturns.map((item) => (
                  <tr key={item._id}>
                    <td>{item.user?.name}</td>
                    <td>{item.book?.title}</td>
                    <td>{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'Today'}</td>
                    <td><span className="badge badge-returned">Returned</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
