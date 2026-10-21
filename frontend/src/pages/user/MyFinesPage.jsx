import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Receipt, CheckCircle2, AlertCircle, ArrowRight, CreditCard } from 'lucide-react';

const MyFinesPage = () => {
  const [fines, setFines] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFines = async () => {
      try {
        const res = await api.get('/fines/my');
        if (res.data.success) {
          setFines(res.data.fines);
          setTotalPending(res.data.totalPending || 0);
          setTotalPaid(res.data.totalPaid || 0);
        }
      } catch (err) {
        console.error('Failed to load fines:', err);
        showToast('Error loading fine records', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFines();
  }, [showToast]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Library Fines & Invoices
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Audited overdue penalty fees at standard college rate of ₹10 per day.
          </p>
        </div>

        {/* Summary Pills */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Dues
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
              ₹{totalPending}
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Paid
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              ₹{totalPaid}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading fine records...</p>
        </div>
      ) : fines.length === 0 ? (
        <div className="empty-state">
          <Receipt className="empty-icon" />
          <h3 className="empty-title">No fines on record</h3>
          <p className="empty-description">
            Your library account has zero recorded late return penalties. Keep returning books on time!
          </p>
          <Link to="/books" className="btn btn-primary btn-sm">
            Browse Books
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Late Days</th>
                  <th>Rate / Day</th>
                  <th>Total Fine</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((fine) => (
                  <tr key={fine._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {fine.book?.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ISBN: {fine.book?.isbn} • ID: {fine.book?.bookId}
                      </div>
                    </td>
                    <td>{new Date(fine.dueDate).toLocaleDateString()}</td>
                    <td>{new Date(fine.returnDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>
                        {fine.lateDays} days
                      </span>
                    </td>
                    <td>₹{fine.fineRate}</td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: fine.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                        ₹{fine.totalFine}
                      </span>
                    </td>
                    <td>
                      {fine.paymentStatus === 'paid' ? (
                        <span className="badge badge-paid">PAID</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/user/payment/${fine._id}`)}
                          className="badge badge-overdue"
                          style={{ border: 'none', cursor: 'pointer' }}
                          title="Click to pay this fine"
                        >
                          {fine.paymentStatus.toUpperCase()}
                        </button>
                      )}
                    </td>
                    <td>
                      {fine.paymentStatus !== 'paid' ? (
                        <button
                          onClick={() => navigate(`/user/payment/${fine._id}`)}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CreditCard size={14} />
                          <span>Pay ₹{fine.totalFine}</span>
                        </button>
                      ) : (
                        <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Screen 8 Bottom Right Summary Card */}
          {totalPending > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <div
                className="card"
                style={{
                  minWidth: '320px',
                  padding: '1.5rem',
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#f8fafc',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                    Total Outstanding:
                  </span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>
                    ₹{totalPending}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Instant clearance upon payment via UPI, Debit Card, or Net Banking.
                </p>
                <button
                  onClick={() => {
                    const firstPending = fines.find((f) => f.paymentStatus !== 'paid');
                    if (firstPending) {
                      navigate(`/user/payment/${firstPending._id}`);
                    }
                  }}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <CreditCard size={18} />
                  <span>Pay Now (₹{totalPending})</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyFinesPage;
