import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { History, Search, IndianRupee, ShieldCheck, AlertTriangle, CheckCircle2, Eye, Copy, Check } from 'lucide-react';

const PaymentRecordsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [totalCollected, setTotalCollected] = useState(0);

  // Screenshot preview modal & copy feedback
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [copiedUtr, setCopiedUtr] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: {
          method: methodFilter !== 'all' ? methodFilter : undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        let list = res.data.payments;
        if (statusFilter !== 'all') {
          list = list.filter((p) => (p.verificationStatus || 'verified') === statusFilter);
        }
        setPayments(list);
        setTotalCollected(res.data.totalCollected || 0);
      }
    } catch (err) {
      console.error('Failed to load payment logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [methodFilter, statusFilter, search]);

  const handleToggleVerification = async (paymentId, currentStatus) => {
    const nextStatus = currentStatus === 'flagged' ? 'verified' : 'flagged';
    try {
      const res = await api.put(`/payments/${paymentId}/verify`, {
        verificationStatus: nextStatus
      });
      if (res.data.success) {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, verificationStatus: nextStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to update verification status:', err);
    }
  };

  const handleCopyUtr = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Financial Audit & Payment Records
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            System-wide register of settled fine receipts, channel distribution, and transaction references.
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #a7f3d0', padding: '0.5rem 1.25rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Fine Receipts Realized
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
            ₹{totalCollected}
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
            placeholder="Search by 12-digit UTR, Transaction ID, student name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="form-control"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Payment Channels</option>
            <option value="UPI">PhonePe UPI / QR</option>
            <option value="Card">Debit / Credit Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="flagged">Flagged / Suspect Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading payment logs...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <History className="empty-icon" />
          <h3 className="empty-title">No financial transactions found</h3>
          <p className="empty-description">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction / UTR ID</th>
                <th>Student</th>
                <th>Book Incurred</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date & Time</th>
                <th>Verification</th>
                <th>Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const isVerified = (p.verificationStatus || 'verified') === 'verified';
                return (
                  <tr key={p._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {p.transactionId}
                      </span>
                      {p.utrNumber && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.74rem', color: '#15803d', fontFamily: 'monospace', fontWeight: 600 }}>
                            UTR: {p.utrNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUtr(p.utrNumber)}
                            title="Copy 12-digit UTR"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '1px 3px',
                              color: copiedUtr === p.utrNumber ? '#16a34a' : '#64748b'
                            }}
                          >
                            {copiedUtr === p.utrNumber ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.user?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {p.fine?.book?.title || 'Catalog Fine'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                        ₹{p.amount}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-active">{p.paymentMethod}</span>
                    </td>
                    <td>{new Date(p.paymentDate).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${isVerified ? 'badge-paid' : 'badge-overdue'}`}>
                        {isVerified ? 'VERIFIED' : 'FLAGGED'}
                      </span>
                    </td>
                    <td>
                      {p.receiptScreenshot ? (
                        <button
                          type="button"
                          onClick={() => setSelectedScreenshot(p.receiptScreenshot)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(p._id, p.verificationStatus || 'verified')}
                        className={`btn btn-sm ${isVerified ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          color: isVerified ? '#b91c1c' : '#ffffff',
                          backgroundColor: isVerified ? '#fef2f2' : '#059669',
                          borderColor: isVerified ? '#fecaca' : '#059669'
                        }}
                      >
                        {isVerified ? 'Flag / Reject' : 'Mark Verified'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedScreenshot(null)}
          title="Attached PhonePe Payment Proof / Screenshot"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <img
              src={selectedScreenshot}
              alt="Payment Proof Receipt"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentRecordsPage;
