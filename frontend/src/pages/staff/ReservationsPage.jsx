import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Bookmark,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Filter,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { showToast } = useToast();

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations', {
        params: { status: statusFilter, search: searchQuery }
      });
      if (res.data.success) {
        setReservations(res.data.reservations);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      showToast('Error loading reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleFulfill = async (id) => {
    if (!window.confirm('Fulfill this reservation and issue the physical book to the student?')) return;

    setActionLoadingId(id);
    try {
      const res = await api.post(`/reservations/${id}/fulfill`);
      if (res.data.success) {
        showToast(res.data.message || 'Book issued to student successfully!', 'success');
        fetchReservations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fulfill reservation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setActionLoadingId(id);
    try {
      const res = await api.put(`/reservations/${id}/cancel`);
      if (res.data.success) {
        showToast('Reservation cancelled', 'info');
        fetchReservations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel reservation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromote = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.put(`/reservations/${id}/promote`);
      if (res.data.success) {
        showToast(res.data.message || 'Reservation marked Ready for Pickup!', 'success');
        fetchReservations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to promote reservation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalReady = reservations.filter((r) => r.status === 'available_for_pickup').length;
  const totalPending = reservations.filter((r) => r.status === 'pending').length;
  const totalFulfilled = reservations.filter((r) => r.status === 'fulfilled').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Book Reservations & Waitlists
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Chapter 2.1 e: Manage student reservations for checked-out books and notify upon return.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ready for Pickup</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46' }}>{totalReady}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Waiting in Queue</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92400e' }}>{totalPending}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Fulfilled Loans</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af' }}>{totalFulfilled}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by student name, ID, book title or Book ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available_for_pickup">Ready for Pickup (At Desk)</option>
              <option value="pending">Pending Waitlist</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading reservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <Bookmark className="empty-icon" />
          <h3 className="empty-title">No Reservations Found</h3>
          <p className="empty-description">
            There are currently no reservations matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Member</th>
                <th>Reserved Book</th>
                <th>Shelf Location</th>
                <th>Date & Queue</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.user?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{res.user?.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                        ID: {res.user?.studentId || 'N/A'} • {res.user?.branch || 'General'}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={res.book?.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                        alt={res.book?.title}
                        style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{res.book?.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {res.book?.bookId} • Available: {res.book?.availableCopies}/{res.book?.totalCopies}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                      <MapPin size={14} color="#2563eb" />
                      <span>{res.book?.shelfLocation || 'General Stack A'}</span>
                    </div>
                  </td>

                  <td>
                    <div>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(res.reservationDate || res.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: res.status === 'available_for_pickup' ? '#059669' : '#d97706', fontWeight: 700 }}>
                        {res.status === 'available_for_pickup' ? 'Ready for Pickup' : `Queue Position #${res.priority}`}
                      </div>
                    </div>
                  </td>

                  <td>
                    {res.status === 'available_for_pickup' ? (
                      <div>
                        <span className="badge badge-available">Ready at Counter</span>
                        {res.pickupDeadline && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                            Hold till {new Date(res.pickupDeadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : res.status === 'pending' ? (
                      <span className="badge badge-due-soon">Pending Waitlist</span>
                    ) : res.status === 'fulfilled' ? (
                      <span className="badge badge-active">Fulfilled</span>
                    ) : (
                      <span className="badge badge-rejected">Cancelled</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      {res.status === 'available_for_pickup' && (
                        <button
                          onClick={() => handleFulfill(res._id)}
                          disabled={actionLoadingId === res._id}
                          className="btn btn-sm btn-primary"
                          style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.4rem 0.75rem', fontWeight: 600 }}
                        >
                          {actionLoadingId === res._id ? 'Processing...' : 'Fulfill & Issue'}
                        </button>
                      )}

                      {res.status === 'pending' && res.book?.availableCopies > 0 && (
                        <>
                          <button
                            onClick={() => handleFulfill(res._id)}
                            disabled={actionLoadingId === res._id}
                            className="btn btn-sm btn-primary"
                            style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                            title="Issue physical book directly to student"
                          >
                            {actionLoadingId === res._id ? 'Processing...' : 'Fulfill & Issue'}
                          </button>
                          <button
                            onClick={() => handlePromote(res._id)}
                            disabled={actionLoadingId === res._id}
                            className="btn btn-sm btn-success"
                            style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                            title="Hold physical copy and notify student"
                          >
                            {actionLoadingId === res._id ? 'Promoting...' : 'Mark Ready'}
                          </button>
                        </>
                      )}

                      {['pending', 'available_for_pickup'].includes(res.status) && (
                        <button
                          onClick={() => handleCancel(res._id)}
                          disabled={actionLoadingId === res._id}
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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

export default ReservationsPage;
