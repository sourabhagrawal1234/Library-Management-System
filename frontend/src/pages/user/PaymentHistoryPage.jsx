import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { History, Receipt, ArrowRight, ExternalLink } from 'lucide-react';

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/my');
        if (res.data.success) {
          setPayments(res.data.payments);
        }
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
          Payment History
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Permanent record of all settled library fines and transaction identifiers.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading payment records...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <History className="empty-icon" />
          <h3 className="empty-title">No payment records found</h3>
          <p className="empty-description">
            You have not made any fine payments. All transaction slips will be preserved here.
          </p>
          <Link to="/user/dashboard" className="btn btn-primary btn-sm">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Book Title</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {p.transactionId}
                    </span>
                    {p.utrNumber && (
                      <div style={{ fontSize: '0.72rem', color: '#15803d', fontFamily: 'monospace' }}>
                        UTR: {p.utrNumber}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{p.fine?.book?.title || 'Library Fine'}</strong>
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
                    <span className="badge badge-paid">{p.paymentStatus.toUpperCase()}</span>
                  </td>
                  <td>
                    <Link
                      to={`/user/payment-success/${p._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Receipt size={14} />
                      <span>View Slip</span>
                    </Link>
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

export default PaymentHistoryPage;
