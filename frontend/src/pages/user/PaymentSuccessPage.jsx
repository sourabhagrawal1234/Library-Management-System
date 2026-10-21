import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle2, Printer, LayoutDashboard, History, Download, ArrowLeft } from 'lucide-react';

const PaymentSuccessPage = () => {
  const { paymentId } = useParams();
  const location = useLocation();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await api.get(`/payments/${paymentId}/receipt`);
        if (res.data.success) {
          setReceipt(res.data.receipt);
        }
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [paymentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b' }}>Generating payment receipt...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="empty-state" style={{ maxWidth: '500px', margin: '3rem auto' }}>
        <h3 className="empty-title">Payment Record Not Found</h3>
        <Link to="/user/dashboard" className="btn btn-primary btn-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '1rem auto' }}>
      {/* Receipt Card */}
      <div
        className="card"
        id="printable-receipt"
        style={{
          padding: '2.5rem',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Decorative Banner */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #10b981, #059669)'
          }}
        />

        {/* Success Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            Payment Successful
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Your library overdue fine has been cleared and recorded in the database.
          </p>
        </div>

        {/* Receipt Details Box */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Transaction ID
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                {receipt.receiptNo}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-paid" style={{ fontSize: '0.75rem' }}>
                {receipt.paymentStatus}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Student Name:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.studentName}</div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Payment Date:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {new Date(receipt.paymentDate).toLocaleString()}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Beneficiary / Payee:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.payeeName || 'SOURABH AGRAWAL'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{receipt.payeeUpi || '9302732410@axl'}</div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Payment Channel:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.paymentMethod}</div>
              {receipt.utrNumber && (
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontFamily: 'monospace', fontWeight: 600 }}>
                  UTR: {receipt.utrNumber}
                </div>
              )}
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Book Title:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.bookTitle}</div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Book ID:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.bookId}</div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Late Days Calculation:</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {receipt.lateDays} Days × ₹{receipt.fineRate}/day
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Clearance Status:</span>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>Zero Balance / Unlocked</div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Amount Settled:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
              ₹{receipt.amountPaid}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={handlePrint} className="btn btn-outline btn-sm">
            <Printer size={16} />
            <span>Download / Print Receipt</span>
          </button>
          <Link to="/user/payment-history" className="btn btn-secondary btn-sm">
            <History size={16} />
            <span>Payment History</span>
          </Link>
          <Link to="/user/dashboard" className="btn btn-primary btn-sm">
            <LayoutDashboard size={16} />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
