import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Banknote,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Dynamically loads the official Razorpay Checkout SDK
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentPage = () => {
  const { fineId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fine & checkout state
  const [fine, setFine] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash'
  const [method, setMethod] = useState('upi');

  // Flow states: 'checkout' | 'processing' | 'failed'
  const [stage, setStage] = useState('checkout');
  const [orderRef, setOrderRef] = useState('');
  const [progress, setProgress] = useState(25);
  const [progressText, setProgressText] = useState('Connecting to payment gateway...');
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/fines/${fineId}`);
        if (res.data.success) {
          setFine(res.data.fine);
          setOrderRef(`ORD-LMS-${Math.floor(100000 + Math.random() * 900000)}`);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Unable to load fine details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    loadRazorpayScript();
  }, [fineId]);

  /**
   * Opens the Official Razorpay Checkout Dashboard popup
   * pre-configured for the selected payment instrument
   */
  const handleOpenRazorpay = async (selectedInstrument = method) => {
    if (selectedInstrument === 'cash') {
      handleCashRequest();
      return;
    }

    setErrorMsg('');
    setProcessing(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Unable to connect to the secure payment gateway. Please check your internet connection.');
      }

      // Step 1: Create verified order on backend
      const orderRes = await api.post('/payments/create-order', { fineId });
      const { order, keyId, customer, description } = orderRes.data;

      // Determine prefill instrument
      const prefillMethod =
        selectedInstrument === 'upi'
          ? 'upi'
          : selectedInstrument === 'card'
          ? 'card'
          : selectedInstrument === 'netbanking'
          ? 'netbanking'
          : selectedInstrument === 'wallet'
          ? 'wallet'
          : undefined;

      // Step 2: Configure Razorpay Checkout options
      const options = {
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Central University Library',
        description: description || `Overdue fine settlement for ${fine?.book?.title || 'Library Book'}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
        prefill: {
          name: customer?.name || user?.name || 'Sourabh Agrawal',
          email: customer?.email || user?.email || 'student@library.com',
          contact: customer?.contact || user?.phone || '9302732410',
          method: prefillMethod
        },
        notes: {
          fineId,
          studentId: user?.studentId || 'STU-2026-001',
          paymentChannel: selectedInstrument
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
          escape: true,
          backdropclose: false
        },
        handler: async (response) => {
          try {
            setStage('processing');
            setProgress(35);
            setProgressText('Payment authorized! Verifying cryptographic signature...');

            await new Promise((r) => setTimeout(r, 450));
            setProgress(75);
            setProgressText('Settling fine record in library system...');

            const verifyRes = await api.post('/payments/verify', {
              fineId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setProgress(100);
            if (verifyRes.data.success) {
              navigate(`/user/payment-success/${verifyRes.data.paymentId}`, { replace: true });
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification could not be confirmed.');
            }
          } catch (vErr) {
            setStage('failed');
            setErrorMsg(
              vErr.response?.data?.message ||
                vErr.message ||
                'Payment was authorized, but backend verification failed.'
            );
          } finally {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setProcessing(false);
        setStage('failed');
        setErrorMsg(resp?.error?.description || 'Payment was declined by the bank or gateway.');
      });

      rzp.open();
    } catch (err) {
      setProcessing(false);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Unable to open payment gateway. Please try again.'
      );
    }
  };

  /**
   * Cash at Counter request
   */
  const handleCashRequest = async () => {
    setProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.post('/payments/cash/request', { fineId });
      alert(res.data.message || 'Cash payment requested. Please pay at the counter.');
      navigate('/user/my-fines');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not request counter payment.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading secure checkout...</p>
      </div>
    );
  }

  if (!fine) {
    return (
      <div className="empty-state" style={{ maxWidth: '520px', margin: '4rem auto' }}>
        <AlertCircle size={44} color="#dc2626" />
        <h3 className="empty-title">Fine Record Not Found</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          This fine has either been cleared or is not associated with your account.
        </p>
        <Link to="/user/my-fines" className="btn btn-primary btn-sm">
          Return to My Fines
        </Link>
      </div>
    );
  }

  // Dynamic UPI Intent URI for on-screen QR Code
  const upiPayload = `upi://pay?pa=9302732410@axl&pn=SOURABH%20AGRAWAL&am=${fine.totalFine}&cu=INR&tn=LMS_Fine_${fine._id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayload)}`;

  // --- STAGE 2: PROCESSING SCREEN ---
  if (stage === 'processing') {
    return (
      <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div
          className="card"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <RotateCcw size={36} style={{ animation: 'spin 1.6s linear infinite' }} />
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '0.4rem' }}>
            SECURE VERIFICATION
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Confirming Payment
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 1.75rem' }}>
            Please wait while the gateway confirms your payment. Do not refresh or close this tab.
          </p>

          <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AMOUNT DUE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>₹{fine.totalFine}.00</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ORDER REFERENCE</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{orderRef}</div>
            </div>
          </div>

          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', marginTop: '1.5rem' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#2563eb',
                borderRadius: '8px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.75rem' }}>
            {progressText}
          </div>
        </div>
      </div>
    );
  }

  // --- STAGE 3: FAILED SCREEN ---
  if (stage === 'failed') {
    return (
      <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div
          className="card"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <XCircle size={40} />
          </div>

          <span className="badge badge-unpaid" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            PAYMENT NOT COMPLETED
          </span>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.9rem 0 0.4rem' }}>
            Payment Incomplete
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {errorMsg || 'Your transaction was cancelled or declined. No amount has been deducted.'}
          </p>

          <div
            style={{
              backgroundColor: '#fffafb',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b' }}>Attempted Amount:</span>
              <strong>₹{fine.totalFine}.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b' }}>Reference ID:</span>
              <strong style={{ fontFamily: 'monospace' }}>{orderRef}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b' }}>Status:</span>
              <strong style={{ color: '#dc2626' }}>Pending Settlement</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/user/my-fines" className="btn btn-outline btn-sm">
              Back to My Fines
            </Link>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStage('checkout');
              }}
              className="btn btn-primary btn-sm"
            >
              <RotateCcw size={16} />
              <span>Try Payment Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STAGE 1: CHECKOUT SCREEN ---
  return (
    <div style={{ maxWidth: '980px', margin: '1rem auto', padding: '0 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link
            to="/user/my-fines"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to My Fines</span>
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem' }}>
            Secure Checkout
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Choose any payment method below to clear your overdue fine instantly.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', color: '#059669', padding: '0.5rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
          <Lock size={14} />
          <span>256-Bit SSL Encrypted Gateway</span>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Payment Methods */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Select Payment Method
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '3px 0 0' }}>
                Click any option to proceed directly
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              Instant Clearance
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            
            {/* Method 1: UPI & QR Code */}
            <div
              onClick={() => setMethod('upi')}
              style={{
                border: `2px solid ${method === 'upi' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: method === 'upi' ? '#f8faff' : '#ffffff',
                borderRadius: '12px',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: method === 'upi' ? '0 4px 14px rgba(37, 99, 235, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: method === 'upi' ? '#eff6ff' : '#f1f5f9',
                    color: method === 'upi' ? '#2563eb' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <QrCode size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                      UPI & Instant QR Code
                    </strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                      RECOMMENDED
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Google Pay, PhonePe, Paytm, BHIM, Scan & Pay
                  </span>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${method === 'upi' ? '#2563eb' : '#cbd5e1'}`,
                    backgroundColor: method === 'upi' ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {method === 'upi' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>

              {/* Expanded Action for UPI */}
              {method === 'upi' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '1rem',
                        background: '#ffffff',
                        border: '1.5px solid #dbeafe',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)'
                      }}
                    >
                      <img
                        src={qrCodeUrl}
                        alt="Scan QR Code to Pay"
                        style={{ width: '160px', height: '160px', display: 'block', margin: '0 auto' }}
                      />
                      <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>
                        Scan & Pay ₹{fine.totalFine}.00
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        UPI ID: 9302732410@axl
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleOpenRazorpay('upi')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                        <span>Connecting to Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Pay ₹{fine.totalFine}.00 via UPI / QR Code →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Method 2: Credit / Debit Cards */}
            <div
              onClick={() => setMethod('card')}
              style={{
                border: `2px solid ${method === 'card' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: method === 'card' ? '#f8faff' : '#ffffff',
                borderRadius: '12px',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: method === 'card' ? '0 4px 14px rgba(37, 99, 235, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: method === 'card' ? '#eff6ff' : '#f1f5f9',
                    color: method === 'card' ? '#2563eb' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    Credit & Debit Cards
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Visa, MasterCard, RuPay, Maestro
                  </span>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${method === 'card' ? '#2563eb' : '#cbd5e1'}`,
                    backgroundColor: method === 'card' ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {method === 'card' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>

              {/* Expanded Action for Cards */}
              {method === 'card' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    Pay securely using any Indian or International Debit/Credit Card. All major banks supported with OTP verification.
                  </p>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleOpenRazorpay('card')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                        <span>Connecting to Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        <span>Pay ₹{fine.totalFine}.00 via Card →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Method 3: Net Banking */}
            <div
              onClick={() => setMethod('netbanking')}
              style={{
                border: `2px solid ${method === 'netbanking' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: method === 'netbanking' ? '#f8faff' : '#ffffff',
                borderRadius: '12px',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: method === 'netbanking' ? '0 4px 14px rgba(37, 99, 235, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: method === 'netbanking' ? '#eff6ff' : '#f1f5f9',
                    color: method === 'netbanking' ? '#2563eb' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    Net Banking
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    SBI, HDFC, ICICI, Axis, PNB and 50+ Banks
                  </span>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${method === 'netbanking' ? '#2563eb' : '#cbd5e1'}`,
                    backgroundColor: method === 'netbanking' ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {method === 'netbanking' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>

              {/* Expanded Action for Net Banking */}
              {method === 'netbanking' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    Select your bank in the secure gateway portal. Direct netbanking authentication with instant fee receipt.
                  </p>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleOpenRazorpay('netbanking')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                        <span>Connecting to Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Building2 size={18} />
                        <span>Pay ₹{fine.totalFine}.00 via Net Banking →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Method 4: Wallets & Others */}
            <div
              onClick={() => setMethod('wallet')}
              style={{
                border: `2px solid ${method === 'wallet' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: method === 'wallet' ? '#f8faff' : '#ffffff',
                borderRadius: '12px',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: method === 'wallet' ? '0 4px 14px rgba(37, 99, 235, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: method === 'wallet' ? '#eff6ff' : '#f1f5f9',
                    color: method === 'wallet' ? '#2563eb' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Wallet size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    Wallets & Others
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Paytm Wallet, PhonePe, Mobikwik, Amazon Pay
                  </span>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${method === 'wallet' ? '#2563eb' : '#cbd5e1'}`,
                    backgroundColor: method === 'wallet' ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {method === 'wallet' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>

              {/* Expanded Action for Wallets */}
              {method === 'wallet' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    Pay through supported digital wallets with 1-click checkout.
                  </p>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleOpenRazorpay('wallet')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                        <span>Connecting to Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Wallet size={18} />
                        <span>Pay ₹{fine.totalFine}.00 via Wallet →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Method 5: Cash at Library Counter */}
            <div
              onClick={() => setMethod('cash')}
              style={{
                border: `2px solid ${method === 'cash' ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: method === 'cash' ? '#f8faff' : '#ffffff',
                borderRadius: '12px',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: method === 'cash' ? '0 4px 14px rgba(37, 99, 235, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: method === 'cash' ? '#eff6ff' : '#f1f5f9',
                    color: method === 'cash' ? '#2563eb' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Banknote size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    Cash at Library Counter
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Pay cash in person at circulation desk; staff confirms and clears due
                  </span>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${method === 'cash' ? '#2563eb' : '#cbd5e1'}`,
                    backgroundColor: method === 'cash' ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {method === 'cash' && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>

              {/* Expanded Action for Cash */}
              {method === 'cash' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    Request cash clearance at circulation desk. Staff will collect ₹{fine.totalFine}.00 and print your receipt.
                  </p>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleCashRequest}
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      justifyContent: 'center'
                    }}
                  >
                    <span>Request Cash Counter Clearance</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Fine & Order Summary */}
        <div>
          <div className="card" style={{ padding: '1.75rem', position: 'sticky', top: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>
              Payment Summary
            </h2>

            {/* Overdue Book Card */}
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                OVERDUE BOOK DETAILS
              </div>
              <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a', marginTop: '4px', lineHeight: 1.35 }}>
                {fine.book?.title || 'Overdue Book Return'}
              </strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Book ID: <strong>{fine.book?.bookId || 'BK-1000'}</strong> · By {fine.book?.author || 'Library Stack'}
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Overdue Days</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>{fine.lateDays} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Daily Fine Rate</span>
                <span style={{ fontWeight: 600 }}>₹{fine.fineRate}.00 / day</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Convenience / Processing Fee</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>FREE (₹0.00)</span>
              </div>
            </div>

            {/* Total Highlight */}
            <div
              style={{
                borderTop: '2px dashed #e2e8f0',
                paddingTop: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Total Amount to Pay</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>All taxes & charges included</div>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626' }}>
                ₹{fine.totalFine}.00
              </span>
            </div>

            {/* Big Primary Proceed to Pay Button */}
            <button
              type="button"
              disabled={processing}
              onClick={() => handleOpenRazorpay(method)}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: '12px',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                marginBottom: '1.25rem'
              }}
            >
              {processing ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Proceed to Pay ₹{fine.totalFine}.00 Securely</span>
                </>
              )}
            </button>

            {/* Trust and Compliance Badges (No API keys shown) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#475569'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#16a34a" />
                <span><strong>PCI-DSS Certified:</strong> Bank-grade 256-bit SSL encryption</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#2563eb" />
                <span><strong>Instant Fine Clearance:</strong> Status updates automatically</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#d97706" />
                <span><strong>Official University Receipt:</strong> Printable tax invoice generated</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
