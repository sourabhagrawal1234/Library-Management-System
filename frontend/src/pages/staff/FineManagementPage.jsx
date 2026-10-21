import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { BadgeAlert, Search, CheckCircle2, AlertTriangle, IndianRupee, Banknote } from 'lucide-react';

const FineManagementPage = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ totalFineAmount: 0, paidAmount: 0, pendingAmount: 0 });
  const { showToast } = useToast();
  const [collectingId, setCollectingId] = useState(null);

  // Record a cash payment made by the student at the library counter
  const collectCash = async (fine) => {
    if (!window.confirm(`Confirm cash of ₹${fine.totalFine} received from ${fine.user?.name}?`)) return;
    setCollectingId(fine._id);
    try {
      const res = await api.post('/payments/cash/collect', { fineId: fine._id });
      if (res.data.success) {
        showToast('Cash payment recorded. Receipt generated.', 'success');
        fetchFines();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not record the cash payment', 'error');
    } finally {
      setCollectingId(null);
    }
  };

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fines', {
        params: {
          status: statusFilter,
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        setFines(res.data.fines);
        setSummary({
          totalFineAmount: res.data.totalFineAmount || 0,
          paidAmount: res.data.paidAmount || 0,
          pendingAmount: res.data.pendingAmount || 0
        });
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
      showToast('Error loading fine logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFines();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Fine Auditing & Fee Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            System-wide register of overdue fees, paid receipts, and unsettled student liabilities.
          </p>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>
              Uncollected Pending
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
              ₹{summary.pendingAmount}
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Realized
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              ₹{summary.paidAmount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search fine by student name, email, or book title..."
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
            <option value="all">All Fine Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="paid">Paid & Cleared</option>
          </select>
        </div>
      </div>

      {/* Fines Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading fine records...</p>
        </div>
      ) : fines.length === 0 ? (
        <div className="empty-state">
          <BadgeAlert className="empty-icon" />
          <h3 className="empty-title">No fine records found</h3>
          <p className="empty-description">Zero fines matched the current filter conditions.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Overdue Book</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Late Days</th>
                <th>Total Fine</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.book?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {f.book?.bookId}</div>
                  </td>
                  <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td>{new Date(f.returnDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#dc2626' }}>{f.lateDays}d</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: f.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                      ₹{f.totalFine}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.paymentStatus === 'paid' ? 'badge-paid' : 'badge-overdue'}`}>
                      {f.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {f.paymentStatus === 'paid' ? (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Settled</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={collectingId === f._id}
                        onClick={() => collectCash(f)}
                      >
                        <Banknote size={14} />
                        <span>{collectingId === f._id ? 'Saving...' : 'Collect Cash'}</span>
                      </button>
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

export default FineManagementPage;
