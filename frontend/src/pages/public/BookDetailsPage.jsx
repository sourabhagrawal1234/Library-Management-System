import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  Hash,
  Bookmark
} from 'lucide-react';

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [userReservation, setUserReservation] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isEmbedded = location.pathname.startsWith('/user/');

  const fetchBookAndReservation = async () => {
    try {
      const res = await api.get(`/books/${id}`);
      if (res.data.success) {
        setBook(res.data.book);
      }

      if (isAuthenticated) {
        try {
          const rRes = await api.get('/reservations/my');
          if (rRes.data.success && rRes.data.reservations) {
            const match = rRes.data.reservations.find(
              (r) =>
                (r.book?._id === id || r.book === id) &&
                ['pending', 'available_for_pickup'].includes(r.status)
            );
            setUserReservation(match || null);
          }
        } catch (rErr) {
          console.error('Failed to load user reservations:', rErr);
        }
      }
    } catch (err) {
      console.error('Failed to load book:', err);
      showToast('Failed to load book details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookAndReservation();
  }, [id, isAuthenticated, showToast]);

  const handleRequest = async () => {
    if (!isAuthenticated) {
      showToast('Please login to request this book', 'warning');
      navigate('/login');
      return;
    }

    setRequesting(true);
    try {
      const res = await api.post('/issues/request', { bookId: book._id });
      if (res.data.success) {
        showToast(res.data.message || 'Book request submitted successfully!', 'success');
        fetchBookAndReservation();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit book request', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      showToast('Please login to reserve this book', 'warning');
      navigate('/login');
      return;
    }

    setReserving(true);
    try {
      const res = await api.post('/reservations', { bookId: book._id });
      if (res.data.success) {
        showToast(res.data.message || 'Book reserved successfully!', 'success');
        fetchBookAndReservation();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reserve book', 'error');
    } finally {
      setReserving(false);
    }
  };

  const handleClaimReservation = async () => {
    if (!userReservation) return;
    setClaiming(true);
    try {
      const res = await api.post(`/reservations/${userReservation._id}/claim`);
      if (res.data.success) {
        showToast(res.data.message || 'Book claim submitted! Please collect from library desk.', 'success');
        fetchBookAndReservation();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to claim reservation', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!userReservation) return;
    if (!window.confirm('Are you sure you want to cancel your reservation for this book?')) return;

    try {
      const res = await api.put(`/reservations/${userReservation._id}/cancel`);
      if (res.data.success) {
        showToast('Reservation cancelled successfully', 'info');
        setUserReservation(null);
        fetchBookAndReservation();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel reservation', 'error');
    }
  };

  if (loading) {
    if (isEmbedded) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading book information...</p>
        </div>
      );
    }
    return (
      <div className="app-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '6rem 0', flex: 1 }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading book information...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    if (isEmbedded) {
      return (
        <div className="empty-state" style={{ maxWidth: '600px', margin: '3rem auto' }}>
          <h2 className="empty-title">Book Not Found</h2>
          <p className="empty-description">The requested book could not be located in our library catalog.</p>
          <Link to="/user/search-books" className="btn btn-primary btn-sm">
            Back to Search
          </Link>
        </div>
      );
    }
    return (
      <div className="app-container">
        <Navbar />
        <div className="empty-state" style={{ maxWidth: '600px', margin: '4rem auto', flex: 1 }}>
          <h2 className="empty-title">Book Not Found</h2>
          <p className="empty-description">The requested book could not be located in our library catalog.</p>
          <Link to="/books" className="btn btn-primary btn-sm">
            Back to Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  const detailsContent = (
    <div>
      <Link
        to={isEmbedded ? '/user/search-books' : '/books'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#64748b',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Books</span>
      </Link>

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          padding: '2.5rem'
        }}
      >
        {/* Book Image */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f1f5f9'
            }}
          >
            <img
              src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
              alt={book.title}
              style={{ width: '100%', height: '420px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';
              }}
            />
          </div>
          <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '360px' }}>
            {userReservation ? (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: userReservation.status === 'available_for_pickup' ? '#ecfdf5' : '#fffbeb',
                  border: userReservation.status === 'available_for_pickup' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: userReservation.status === 'available_for_pickup' ? '#065f46' : '#92400e', marginBottom: '0.5rem' }}>
                  <Bookmark size={18} />
                  <span>
                    {userReservation.status === 'available_for_pickup'
                      ? '🎉 Ready for Collection at Counter!'
                      : `Reserved (Queue Position #${userReservation.queuePosition || userReservation.priority})`}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: userReservation.status === 'available_for_pickup' ? '#047857' : '#78350f', margin: 0, lineHeight: 1.4 }}>
                  {userReservation.status === 'available_for_pickup'
                    ? `Great news! A physical copy is held for you at shelf "${book.shelfLocation || 'General Stack A'}". Please pick it up from the library desk.`
                    : 'You are on the reservation waitlist. The system will alert you as soon as this book is returned.'}
                </p>
                {userReservation.pickupDeadline && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginTop: '0.5rem' }}>
                    Pickup Deadline: {new Date(userReservation.pickupDeadline).toLocaleDateString()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {userReservation.status === 'available_for_pickup' && (
                    <button
                      onClick={handleClaimReservation}
                      disabled={claiming}
                      className="btn btn-success btn-sm"
                      style={{ flex: 1, borderRadius: '8px', fontWeight: 600 }}
                    >
                      {claiming ? 'Submitting Claim...' : 'Claim & Request Issue'}
                    </button>
                  )}
                  <button
                    onClick={handleCancelReservation}
                    className="btn btn-outline-danger btn-sm"
                    style={{ flex: userReservation.status === 'available_for_pickup' ? '0 0 auto' : 1, width: userReservation.status === 'available_for_pickup' ? 'auto' : '100%', borderRadius: '8px' }}
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            ) : isAvailable ? (
              <button
                onClick={handleRequest}
                disabled={requesting}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <Bookmark size={18} />
                <span>{requesting ? 'Processing Request...' : 'Request This Book'}</span>
              </button>
            ) : (
              <div>
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="btn btn-lg"
                  style={{
                    width: '100%',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <Bookmark size={18} />
                  <span>{reserving ? 'Reserving Book...' : 'Reserve This Book (आरक्षित करें)'}</span>
                </button>
                <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem', lineHeight: 1.35 }}>
                  Chapter 2.1 e Solution: Reserve now to join the queue. You will be automatically notified when this book is returned.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
              {book.category?.name || 'General Category'}
            </span>
            {isAvailable ? (
              <span className="badge badge-available">
                <CheckCircle2 size={12} /> Available ({book.availableCopies}/{book.totalCopies})
              </span>
            ) : (
              <span className="badge badge-unavailable">
                <XCircle size={12} /> Currently Unavailable
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            {book.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Written by <strong>{book.author}</strong>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              backgroundColor: '#f8fafc',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Book ID
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={14} color="#64748b" /> {book.bookId}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                ISBN
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{book.isbn}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Shelf Location
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="#2563eb" /> {book.shelfLocation}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Publisher & Year
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {book.publisher || 'N/A'} {book.publicationYear ? `(${book.publicationYear})` : ''}
              </div>
            </div>
          </div>

          {/* Live Copy Availability Meter */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Stack Copy Availability:</span>
              <span style={{ fontWeight: 800, color: isAvailable ? '#059669' : '#dc2626' }}>
                {book.availableCopies} of {book.totalCopies} Available ({Math.round((book.availableCopies / (book.totalCopies || 1)) * 100)}%)
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.round((book.availableCopies / (book.totalCopies || 1)) * 100)}%`,
                  backgroundColor: isAvailable ? '#10b981' : '#ef4444',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Description / Abstract
            </h3>
            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {book.description || 'No detailed synopsis provided for this catalog volume.'}
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '0.85rem',
              color: '#1e40af'
            }}
          >
            <strong>Borrowing Policy:</strong> Standard loan duration is 14 days. Late returns incur a fee of ₹10 per day automatically calculated upon physical check-in.
          </div>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return detailsContent;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem', width: '100%', flex: 1 }}>
        {detailsContent}
      </div>
      <Footer />
    </div>
  );
};

export default BookDetailsPage;
