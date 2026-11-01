import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Bookmark,
  MapPin,
  Calendar,
  XCircle,
  Sparkles
} from 'lucide-react';

const MyBooksPage = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('reservations') || location.search.includes('tab=reservations')
    ? 'reservations'
    : 'issued';
  const [activeTab, setActiveTab] = useState(initialTab); // 'issued' | 'reservations'

  useEffect(() => {
    if (location.pathname.includes('reservations')) {
      setActiveTab('reservations');
    }
  }, [location.pathname]);
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const { showToast } = useToast();

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [issuesRes, resRes] = await Promise.all([
        api.get('/issues/my', { params: { status: statusFilter } }),
        api.get('/reservations/my')
      ]);

      if (issuesRes.data.success) {
        setIssues(issuesRes.data.issues);
      }
      if (resRes.data.success) {
        setReservations(resRes.data.reservations);
      }
    } catch (err) {
      console.error('Failed to load my books/reservations:', err);
      showToast('Error loading book records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, [statusFilter]);

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setCancellingId(reservationId);
    try {
      const res = await api.put(`/reservations/${reservationId}/cancel`);
      if (res.data.success) {
        showToast('Reservation cancelled successfully', 'info');
        fetchMyData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel reservation', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleClaimReservation = async (reservationId) => {
    setClaimingId(reservationId);
    try {
      const res = await api.post(`/reservations/${reservationId}/claim`);
      if (res.data.success) {
        showToast(res.data.message || 'Book claim requested! Please collect from library desk.', 'success');
        fetchMyData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit claim request', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const renderStatusBadge = (issue) => {
    if (issue.status === 'returned') {
      return <span className="badge badge-returned">Returned</span>;
    }
    if (issue.status === 'pending') {
      return <span className="badge badge-pending">Pending Approval</span>;
    }
    if (issue.status === 'rejected') {
      return <span className="badge badge-rejected">Rejected</span>;
    }

    if (issue.computedStatus === 'overdue') {
      return (
        <span className="badge badge-overdue">
          <AlertTriangle size={12} /> Overdue ({issue.overdueDays}d)
        </span>
      );
    }
    if (issue.computedStatus === 'due-soon') {
      return (
        <span className="badge badge-due-soon">
          <Clock size={12} /> Due Soon ({issue.daysLeft}d)
        </span>
      );
    }
    return <span className="badge badge-active">Active</span>;
  };

  const readyReservations = reservations.filter((r) => r.status === 'available_for_pickup');
  const activeReservationsCount = reservations.filter((r) => ['pending', 'available_for_pickup'].includes(r.status)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            My Library Books & Circulation
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Track your currently issued books, return due dates, and book reservations.
          </p>
        </div>

        {activeTab === 'issued' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-control"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Records</option>
              <option value="issued">Currently Issued</option>
              <option value="pending">Pending Requests</option>
              <option value="returned">Returned History</option>
            </select>
          </div>
        )}
      </div>

      {/* Ready for Pickup Alert Banner (Chapter 2.1 e Solution) */}
      {readyReservations.length > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
                🎉 You have {readyReservations.length} reserved book ready for pickup!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#047857' }}>
                A returned copy of <strong>"{readyReservations[0].book?.title}"</strong> is held for you at Shelf <strong>{readyReservations[0].book?.shelfLocation}</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('reservations')}
            className="btn btn-sm btn-primary"
            style={{ borderRadius: '8px' }}
          >
            View Reservation
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('issued')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'issued' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'issued' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <BookOpen size={18} />
          <span>My Issued Books ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'reservations' ? '3px solid #d97706' : '3px solid transparent',
            color: activeTab === 'reservations' ? '#d97706' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Bookmark size={18} />
          <span>My Reservations ({activeReservationsCount})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading records...</p>
        </div>
      ) : activeTab === 'issued' ? (
        /* Tab 1: Issued Books */
        issues.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-icon" />
            <h3 className="empty-title">No books found</h3>
            <p className="empty-description">
              You do not have any {statusFilter !== 'all' ? statusFilter : ''} books registered on your library account.
            </p>
            <Link to="/user/search-books" className="btn btn-primary btn-sm">
              Browse Catalog to Request
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine Incurred</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                          src={issue.book?.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                          alt={issue.book?.title}
                          style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                          <Link
                            to={`/user/books/${issue.book?._id}`}
                            style={{ fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '2px' }}
                          >
                            {issue.book?.title}
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            By {issue.book?.author} • <strong>ID:</strong> {issue.book?.bookId}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> Shelf: {issue.book?.shelfLocation || 'General Stack A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '—'}
                    </td>

                    <td>
                      {issue.dueDate ? (
                        <span style={{ fontWeight: issue.computedStatus === 'overdue' ? 700 : 500, color: issue.computedStatus === 'overdue' ? '#dc2626' : 'inherit' }}>
                          {new Date(issue.dueDate).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>

                    <td>
                      {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '—'}
                    </td>

                    <td>
                      {renderStatusBadge(issue)}
                    </td>

                    <td>
                      {issue.fine ? (
                        <div>
                          <div style={{ fontWeight: 700, color: issue.fine.paymentStatus === 'paid' ? '#059669' : '#dc2626' }}>
                            ₹{issue.fine.totalFine}
                          </div>
                          <span className={`badge ${issue.fine.paymentStatus === 'paid' ? 'badge-paid' : 'badge-overdue'}`} style={{ fontSize: '0.65rem' }}>
                            {issue.fine.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      ) : issue.computedStatus === 'overdue' ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#dc2626' }}>
                            ₹{issue.currentFine} (Est.)
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Upon return</span>
                        </div>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600 }}>₹0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Tab 2: Book Reservations (Chapter 2.1 e Solution) */
        reservations.length === 0 ? (
          <div className="empty-state">
            <Bookmark className="empty-icon" />
            <h3 className="empty-title">No Active Book Reservations</h3>
            <p className="empty-description">
              When a desired book is currently unavailable or checked out, you can reserve it. When returned, it will be automatically held for you!
            </p>
            <Link to="/user/search-books" className="btn btn-primary btn-sm">
              Search Catalog & Reserve
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reserved Book</th>
                  <th>Shelf Location</th>
                  <th>Reservation Date</th>
                  <th>Waitlist / Queue</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                          src={res.book?.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                          alt={res.book?.title}
                          style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                          <Link
                            to={`/user/books/${res.book?._id}`}
                            style={{ fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '2px' }}
                          >
                            {res.book?.title}
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            By {res.book?.author} • <strong>ID:</strong> {res.book?.bookId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontWeight: 600, fontSize: '0.85rem' }}>
                        <MapPin size={14} />
                        <span>{res.book?.shelfLocation || 'General Stack A'}</span>
                      </div>
                    </td>

                    <td>
                      {new Date(res.reservationDate || res.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      {res.status === 'available_for_pickup' ? (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Ready for Pickup
                        </span>
                      ) : res.status === 'pending' ? (
                        <span style={{ color: '#d97706', fontWeight: 700 }}>
                          Queue Position #{res.queuePosition || res.priority}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>

                    <td>
                      {res.status === 'available_for_pickup' ? (
                        <div>
                          <span className="badge badge-available">Ready at Counter</span>
                          {res.pickupDeadline && (
                            <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                              Collect before {new Date(res.pickupDeadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : res.status === 'pending' ? (
                        <span className="badge badge-due-soon">Pending Waitlist</span>
                      ) : res.status === 'fulfilled' ? (
                        <span className="badge badge-active">Fulfilled & Issued</span>
                      ) : (
                        <span className="badge badge-rejected">Cancelled</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {res.status === 'available_for_pickup' && (
                          <button
                            onClick={() => handleClaimReservation(res._id)}
                            disabled={claimingId === res._id}
                            className="btn btn-success btn-sm"
                            style={{ borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 600 }}
                          >
                            {claimingId === res._id ? 'Claiming...' : 'Claim Book'}
                          </button>
                        )}
                        {['pending', 'available_for_pickup'].includes(res.status) && (
                          <button
                            onClick={() => handleCancelReservation(res._id)}
                            disabled={cancellingId === res._id}
                            className="btn btn-outline-danger btn-sm"
                            style={{ borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            {cancellingId === res._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default MyBooksPage;
