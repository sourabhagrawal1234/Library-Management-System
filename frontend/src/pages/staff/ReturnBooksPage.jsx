import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const ReturnBooksPage = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Return confirmation state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnResult, setReturnResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();
  const location = useLocation();

  const fetchIssuedBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          status: 'issued',
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        setIssuedBooks(res.data.issues);

        // Pre-select if issueId query parameter was passed
        const query = new URLSearchParams(location.search);
        const issueId = query.get('issueId');
        if (issueId) {
          const found = res.data.issues.find((i) => i._id === issueId);
          if (found) setSelectedIssue(found);
        }
      }
    } catch (err) {
      console.error('Failed to load issues for return:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssuedBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleProcessReturn = async () => {
    if (!selectedIssue) return;
    setProcessing(true);

    try {
      const res = await api.put(`/issues/${selectedIssue._id}/return`);
      if (res.data.success) {
        setReturnResult({
          message: res.data.message,
          fine: res.data.fine,
          issue: res.data.issue
        });
        showToast(res.data.message, res.data.fine ? 'warning' : 'success');
        fetchIssuedBooks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process return', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          Process Book Check-In & Returns
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Verify book returns, automatically increment stack inventory, and calculate overdue fines.
        </p>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="input-icon-wrapper">
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search active issue by student name, email, book title, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Searching active loans...</p>
        </div>
      ) : issuedBooks.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 className="empty-icon" style={{ color: '#059669' }} />
          <h3 className="empty-title">All books checked in!</h3>
          <p className="empty-description">There are no outstanding issued books waiting to be returned.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Book Title</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {issuedBooks.map((issue) => (
                <tr key={issue._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{issue.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{issue.user?.email}</div>
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
                    ) : (
                      <span className="badge badge-active">Active Loan</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setReturnResult(null);
                        setSelectedIssue(issue);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={14} />
                      <span>Process Return</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Modal Dialog */}
      <Modal
        isOpen={!!selectedIssue}
        onClose={() => {
          setSelectedIssue(null);
          setReturnResult(null);
        }}
        title="Confirm Book Return"
        maxWidth="500px"
      >
        {selectedIssue && !returnResult && (
          <div>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Are you sure you want to process the return for this volume? The system will automatically compute any late days and adjust book inventory.
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}
            >
              <div><strong>Student:</strong> {selectedIssue.user?.name} ({selectedIssue.user?.email})</div>
              <div style={{ marginTop: '4px' }}><strong>Book:</strong> {selectedIssue.book?.title}</div>
              <div style={{ marginTop: '4px' }}><strong>Due Date:</strong> {new Date(selectedIssue.dueDate).toLocaleDateString()}</div>
              <div style={{ marginTop: '4px' }}><strong>Return Date:</strong> Today ({new Date().toLocaleDateString()})</div>
              {selectedIssue.computedStatus === 'overdue' && (
                <div style={{ marginTop: '8px', color: '#dc2626', fontWeight: 700 }}>
                  ⚠️ Overdue by approximately {selectedIssue.overdueDays} days. Fine will be generated at ₹10/day.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedIssue(null)}
                className="btn btn-secondary"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={processing}
                className="btn btn-primary"
              >
                {processing ? 'Processing Return...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        )}

        {returnResult && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Book Return Processed Successfully!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Available book copies have been automatically increased.
              </p>
            </div>

            {returnResult.fine ? (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ color: '#991b1b', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Fine Record Generated:
                </div>
                <div>Late Days: <strong>{returnResult.fine.lateDays} Days</strong></div>
                <div>Rate: <strong>₹{returnResult.fine.fineRate} / day</strong></div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  Total Fine Assessed: ₹{returnResult.fine.totalFine}
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: '#065f46',
                  fontSize: '0.9rem'
                }}
              >
                Returned on time! Zero late return fines generated.
              </div>
            )}

            <button
              onClick={() => {
                setSelectedIssue(null);
                setReturnResult(null);
              }}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReturnBooksPage;
