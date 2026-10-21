import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BookOpen, AlertCircle, CheckCircle2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';

const MyBooksPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  const fetchMyIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues/my', {
        params: { status: statusFilter }
      });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to load my books:', err);
      showToast('Error loading issued books', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, [statusFilter]);

  const renderStatusBadge = (issue) => {
    if (issue.status === 'returned') {
      return <span className="badge badge-returned">Returned</span>;
    }
    if (issue.status === 'pending') {
      return <span className="badge badge-pending">Pending Approval</span>;
    }
    if (issue.status === 'rejected') {
      return <span className="badge badge-rejected">Rejected</span>;
    }

    // Active issue checks
    if (issue.computedStatus === 'overdue') {
      return (
        <span className="badge badge-overdue">
          <AlertTriangle size={12} /> Overdue ({issue.overdueDays}d)
        </span>
      );
    }
    if (issue.computedStatus === 'due-soon') {
      return (
        <span className="badge badge-due-soon">
          <Clock size={12} /> Due Soon ({issue.daysLeft}d)
        </span>
      );
    }
    return <span className="badge badge-active">Active</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            My Issued Books
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Track your currently issued books, return due dates, and borrowing history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Records</option>
            <option value="issued">Currently Issued</option>
            <option value="pending">Pending Requests</option>
            <option value="returned">Returned History</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading book records...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <h3 className="empty-title">No books found</h3>
          <p className="empty-description">
            You do not have any {statusFilter !== 'all' ? statusFilter : ''} books registered on your library account.
          </p>
          <Link to="/books" className="btn btn-primary btn-sm">
            Browse Catalog to Request
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book Details</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine Incurred</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={issue.book?.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                        alt={issue.book?.title}
                        style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <Link
                          to={`/books/${issue.book?._id}`}
                          style={{ fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '2px' }}
                        >
                          {issue.book?.title}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          By {issue.book?.author} • <strong>ID:</strong> {issue.book?.bookId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Stack: {issue.book?.shelfLocation}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '—'}
                  </td>

                  <td>
                    {issue.dueDate ? (
                      <span style={{ fontWeight: issue.computedStatus === 'overdue' ? 700 : 500, color: issue.computedStatus === 'overdue' ? '#dc2626' : 'inherit' }}>
                        {new Date(issue.dueDate).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>

                  <td>
                    {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '—'}
                  </td>

                  <td>
                    {renderStatusBadge(issue)}
                  </td>

                  <td>
                    {issue.fine ? (
                      <div>
                        <div style={{ fontWeight: 700, color: issue.fine.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                          ₹{issue.fine.totalFine}
                        </div>
                        <span className={`badge ${issue.fine.paymentStatus === 'paid' ? 'badge-paid' : 'badge-overdue'}`} style={{ fontSize: '0.65rem' }}>
                          {issue.fine.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    ) : issue.computedStatus === 'overdue' ? (
                      <div>
                        <div style={{ fontWeight: 700, color: '#dc2626' }}>
                          ₹{issue.currentFine} (Est.)
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Upon return</span>
                      </div>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>₹0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBooksPage;
