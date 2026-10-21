import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClipboardList, Search, Filter } from 'lucide-react';

const IssueRecordsPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to load issue records:', err);
      showToast('Error loading issue audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          Master Circulation & Issue Records
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Comprehensive institutional loan audit logs across all members, books, and statuses.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search student, email, or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="issued">Issued / Active</option>
            <option value="returned">Returned</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading records...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-icon" />
          <h3 className="empty-title">No circulation records found</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Member</th>
                <th>Book Title</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{i.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{i.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{i.book?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {i.book?.bookId}</div>
                  </td>
                  <td>{i.issueDate ? new Date(i.issueDate).toLocaleDateString() : '—'}</td>
                  <td>{i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '—'}</td>
                  <td>{i.returnDate ? new Date(i.returnDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`badge ${
                      i.status === 'issued'
                        ? 'badge-active'
                        : i.status === 'returned'
                        ? 'badge-returned'
                        : i.status === 'pending'
                        ? 'badge-pending'
                        : 'badge-rejected'
                    }`}>
                      {i.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {i.approvedBy?.name || 'System / Auto'}
                    </span>
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

export default IssueRecordsPage;
