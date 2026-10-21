import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BookKey, Search, RotateCcw, AlertTriangle, Clock } from 'lucide-react';

const IssuedBooksPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchIssuedBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          status: 'issued',
          search: search.trim() || undefined,
          overdue: overdueOnly ? 'true' : undefined
        }
      });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to load issued books:', err);
      showToast('Error loading active loan records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssuedBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, overdueOnly]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Active Loan Records & Issued Books
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Track all active physical circulations, impending deadlines, and overdue loans.
          </p>
        </div>

        <button
          onClick={() => navigate('/staff/returns')}
          className="btn btn-primary btn-sm"
        >
          <RotateCcw size={15} />
          <span>Process Returns</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search student name, email, or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, color: overdueOnly ? '#dc2626' : 'inherit' }}>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <span>Show Overdue Only</span>
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading active loans...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <BookKey className="empty-icon" />
          <h3 className="empty-title">No active loans found</h3>
          <p className="empty-description">There are no books currently checked out under these search parameters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Member</th>
                <th>Issued Book</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Loan Status</th>
                <th>Estimated Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{issue.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {issue.user?.email} • {issue.user?.phone || 'No phone'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{issue.book?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Stack: {issue.book?.shelfLocation} • ID: {issue.book?.bookId}
                    </div>
                  </td>
                  <td>{issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span style={{ fontWeight: issue.computedStatus === 'overdue' ? 700 : 500, color: issue.computedStatus === 'overdue' ? '#dc2626' : 'inherit' }}>
                      {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    {issue.computedStatus === 'overdue' ? (
                      <span className="badge badge-overdue">
                        <AlertTriangle size={12} /> Overdue ({issue.overdueDays}d)
                      </span>
                    ) : issue.computedStatus === 'due-soon' ? (
                      <span className="badge badge-due-soon">
                        <Clock size={12} /> Due Soon ({issue.daysLeft}d)
                      </span>
                    ) : (
                      <span className="badge badge-active">Active</span>
                    )}
                  </td>
                  <td>
                    {issue.computedStatus === 'overdue' ? (
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>
                        ₹{issue.estimatedFine}
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>₹0</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/staff/returns?issueId=${issue._id}`)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={13} />
                      <span>Check In</span>
                    </button>
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

export default IssuedBooksPage;
