import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClipboardList, Check, X, Search, CheckCircle2, User, BookOpen } from 'lucide-react';

const IssueRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [approvingId, setApprovingId] = useState(null);
  const { showToast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: { status: statusFilter }
      });
      if (res.data.success) {
        setRequests(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to load issue requests:', err);
      showToast('Error loading requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await api.put(`/issues/${id}/approve`);
      if (res.data.success) {
        showToast('Request approved! Book issued and loan period set to 14 days.', 'success');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve request', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection remarks for the student:');
    if (reason === null) return;

    try {
      const res = await api.put(`/issues/${id}/reject`, { remarks: reason || 'Request declined by circulation desk.' });
      if (res.data.success) {
        showToast('Request rejected', 'info');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Book Issue Requests
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Review student digital loan applications, verify copy availability, and process checkouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending Only</option>
            <option value="issued">Issued / Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Records</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-icon" />
          <h3 className="empty-title">No requests found</h3>
          <p className="empty-description">
            There are currently no {statusFilter !== 'all' ? statusFilter : ''} book requests in the queue.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Requested Book</th>
                <th>Request Date</th>
                <th>Copies Available</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {req.user?.email} • {req.user?.phone || 'No phone'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.book?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Stack: {req.book?.shelfLocation} • ID: {req.book?.bookId}
                    </div>
                  </td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: req.book?.availableCopies > 0 ? '#059669' : '#dc2626' }}>
                      {req.book?.availableCopies} copies
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      req.status === 'pending'
                        ? 'badge-pending'
                        : req.status === 'issued'
                        ? 'badge-approved'
                        : req.status === 'rejected'
                        ? 'badge-rejected'
                        : 'badge-returned'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={approvingId === req._id || req.book?.availableCopies <= 0}
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.35rem 0.7rem' }}
                        >
                          <Check size={14} />
                          <span>{approvingId === req._id ? 'Issuing...' : 'Approve & Issue'}</span>
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem 0.7rem' }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Processed
                      </span>
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

export default IssueRequestsPage;
