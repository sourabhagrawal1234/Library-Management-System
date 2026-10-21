import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RotateCcw, Search } from 'lucide-react';

const ReturnRecordsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues', {
        params: {
          status: 'returned',
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        setReturns(res.data.issues);
      }
    } catch (err) {
      console.error('Failed to load return records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReturns();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          Historical Return Audits
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Archive of checked-in volumes with due-date comparison and associated late return records.
        </p>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="input-icon-wrapper">
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search student, email, or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading return logs...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <RotateCcw className="empty-icon" />
          <h3 className="empty-title">No return records found</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Member</th>
                <th>Returned Book</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fine Incurred</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.book?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {r.book?.bookId}</div>
                  </td>
                  <td>{new Date(r.issueDate).toLocaleDateString()}</td>
                  <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td>{new Date(r.returnDate).toLocaleDateString()}</td>
                  <td>
                    {r.fine ? (
                      <span style={{ fontWeight: 700, color: r.fine.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                        ₹{r.fine.totalFine} ({r.fine.lateDays}d late)
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>₹0 (On time)</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-returned">Returned</span>
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

export default ReturnRecordsPage;
