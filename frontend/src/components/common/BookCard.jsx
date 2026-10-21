import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const BookCard = ({ book, onRequest, requestingId }) => {
  const isAvailable = book.availableCopies > 0;
  const isCurrentlyRequesting = requestingId === book._id;

  return (
    <div className="book-card">
      <div className="book-cover-container">
        <img
          src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
          alt={book.title}
          className="book-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';
          }}
        />
        <div className="book-cover-badge">
          {isAvailable ? (
            <span className="badge badge-available">
              <CheckCircle2 size={12} /> Available
            </span>
          ) : (
            <span className="badge badge-unavailable">
              <XCircle size={12} /> Unavailable
            </span>
          )}
        </div>
      </div>

      <div className="book-details" style={{ padding: '1.25rem' }}>
        <h3 className="book-title" title={book.title} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>
          {book.title}
        </h3>
        <p className="book-author" style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '0.75rem' }}>
          {book.author}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe'
            }}
          >
            {book.category?.name || 'Academic'}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isAvailable ? '#059669' : '#dc2626' }}>
            Available: {book.availableCopies}/{book.totalCopies}
          </span>
        </div>

        <div className="book-actions" style={{ marginTop: 'auto' }}>
          <Link
            to={window.location.pathname.startsWith('/user/') ? `/user/books/${book._id}` : `/books/${book._id}`}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', borderRadius: '8px', padding: '0.55rem' }}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
