import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CreditCard,
  Smartphone,
  QrCode,
  Building2,
  Wallet,
  Banknote,
  ShieldCheck,
  ArrowLeft,
  Loader2
} from 'lucide-react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Loads the Razorpay Checkout script once and resolves when it is ready.
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return undefined;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    return undefined;
  });

/** Payment methods shown to the student. */
const METHODS = [
  {
    key: 'card',
    label: 'Debit / Credit Card',
    desc: 'Visa, Mastercard, RuPay, Amex',
    icon: CreditCard,
    rzp: 'card'
  },
  {
    key: 'upi',
    label: 'UPI ID',
    desc: 'Pay with any UPI app using your UPI ID',
    icon: Smartphone,
    rzp: 'upi'
  },
  {
    key: 'qr',
    label: 'Scan QR Code',
    desc: 'Scan and pay from GPay, PhonePe, Paytm',
    icon: QrCode,
    rzp: 'upi'
  },
  {
    key: 'netbanking',
    label: 'Net Banking',
    desc: 'All major Indian banks supported',
    icon: Building2,
    rzp: 'netbanking'
  },
  {
    key: 'wallet',
    label: 'Wallet',
    desc: 'Paytm, PhonePe, Amazon Pay and more',
    icon: Wallet,
    rzp: 'wallet'
  },
  {
    key: 'cash',
    label: 'Cash at Library Counter',
    desc: 'Pay physically; staff confirms and issues the receipt',
    icon: Banknote,
    rzp: null
  }
];

const PaymentPage = () => {
  const { fineId } = useParams();
  const navigate = useNavigate();

  const [fine, setFine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [gatewayEnabled, setGatewayEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [fineRes, configRes] = await Promise.all([
          api.get(`/fines/${fineId}`),
          api.get('/payments/config').catch(() => ({ data: { enabled: false } }))
        ]);

        setFine(fineRes.data.fine || null);
        setGatewayEnabled(Boolean(configRes.data && configRes.data.enabled));
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load this fine.');
      } finally {
        setLoading(false);
      }
    };
    load();
    loadRazorpayScript();
  }, [fineId]);

  const payOnline = async (selected) => {
    setError('');
    setInfo('');
    setProcessing(true);

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Could not load the secure payment window. Check your internet connection.');
      }

      const orderRes = await api.post('/payments/create-order', { fineId });
      const { order, keyId, customer, description } = orderRes.data;

      const options = {
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'Central Library',
        description: description || 'Library overdue fine',
        prefill: {
          name: customer?.name || '',
          email: customer?.email || '',
          contact: customer?.contact || ''
        },
        notes: { fineId },
        theme: { color: '#2563eb' },
        // Open the chosen method first; the user can still switch inside checkout.
        config:
          selected.rzp === 'upi'
            ? {
                display: {
                  blocks: {
                    upi: {
                      name: selected.key === 'qr' ? 'Scan QR / UPI' : 'Pay using UPI',
                      instruments: [
                        selected.key === 'qr'
                          ? { method: 'upi', flows: ['qr'] }
                          : { method: 'upi', flows: ['collect', 'intent', 'qr'] }
                      ]
                    }
                  },
                  sequence: ['block.upi'],
                  preferences: { show_default_blocks: true }
                }
              }
            : undefined,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              fineId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              navigate(`/user/payment-success/${verifyRes.data.paymentId}`, { replace: true });
            } else {
              setError(verifyRes.data.message || 'Payment could not be verified.');
            }
          } catch (err) {
            setError(
              err.response?.data?.message ||
                'Payment was taken but verification failed. Please contact the library with your transaction ID.'
            );
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setInfo('Payment window closed. No money was deducted.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setProcessing(false);
        setError(resp?.error?.description || 'Payment failed. Please try another method.');
      });
      rzp.open();
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.message || err.message || 'Unable to start the payment.');
    }
  };

  const payCash = async () => {
    setError('');
    setInfo('');
    setProcessing(true);
    try {
      const res = await api.post('/payments/cash/request', { fineId });
      setInfo(
        res.data.message ||
          'Cash payment requested. Pay at the library counter — staff will confirm and your receipt will be generated.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register your cash payment request.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = () => {
    const selected = METHODS.find((m) => m.key === method);
    if (!selected) return;
    if (selected.key === 'cash') return payCash();
    return payOnline(selected);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b' }}>Loading payment details...</p>
      </div>
    );
  }

  if (!fine) {
    return (
      <div className="empty-state" style={{ maxWidth: '500px', margin: '3rem auto' }}>
        <h3 className="empty-title">Fine not found</h3>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          This fine may already be paid or does not belong to your account.
        </p>
        <Link to="/user/my-fines" className="btn btn-primary btn-sm">
          Back to My Fines
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '1rem auto' }}>
      <Link
        to="/user/my-fines"
        className="btn btn-outline btn-sm"
        style={{ marginBottom: '1rem', display: 'inline-flex' }}
      >
        <ArrowLeft size={16} />
        <span>Back to My Fines</span>
      </Link>

      {/* Amount summary */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Paying for
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {fine.book?.title || 'Library overdue fine'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {fine.lateDays} late day(s) × ₹{fine.fineRate}/day
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AMOUNT DUE</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹{fine.totalFine}</div>
          </div>
        </div>
      </div>

      {!gatewayEnabled && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            color: '#92400e',
            borderRadius: '10px',
            padding: '0.9rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}
        >
          Online payments are not activated yet. Add your Razorpay keys in <code>backend/.env</code> to enable
          card, UPI, QR, net banking and wallet payments. Cash at counter still works.
        </div>
      )}

      {/* Method selection */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Choose a payment method
        </h2>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = method === m.key;
            const disabled = m.key !== 'cash' && !gatewayEnabled;
            return (
              <button
                key={m.key}
                type="button"
                disabled={disabled}
                onClick={() => setMethod(m.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  textAlign: 'left',
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                  background: active ? '#eff6ff' : '#ffffff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  width: '100%'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: active ? '#dbeafe' : '#f1f5f9',
                    color: active ? '#1d4ed8' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 700, color: '#0f172a' }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>{m.desc}</span>
                </span>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                    background: active ? '#2563eb' : 'transparent',
                    flexShrink: 0
                  }}
                />
              </button>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              marginTop: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            {error}
          </div>
        )}

        {info && (
          <div
            style={{
              marginTop: '1rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            {info}
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={processing}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
        >
          {processing ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              <span>Processing...</span>
            </>
          ) : (
            <span>
              {method === 'cash' ? 'Request cash payment at counter' : `Pay ₹${fine.totalFine} securely`}
            </span>
          )}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            marginTop: '0.9rem',
            color: '#64748b',
            fontSize: '0.78rem'
          }}
        >
          <ShieldCheck size={14} />
          <span>Payments are processed securely by Razorpay. Card details never touch our servers.</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
