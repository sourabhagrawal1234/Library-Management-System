import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building,
  BadgePercent,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX
} from 'lucide-react';

const ManageStaffPage = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employeeId: '',
    department: 'Circulation & Reference',
    designation: 'Assistant Librarian'
  });
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
      showToast('Error loading staff roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'Circulation & Reference',
      designation: 'Assistant Librarian'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.user?.name || '',
      email: staff.user?.email || '',
      phone: staff.user?.phone || '',
      password: '',
      employeeId: staff.employeeId,
      department: staff.department,
      designation: staff.designation
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (staff) => {
    if (staff.user?.role === 'admin') {
      showToast('Administrator accounts are permanently active and cannot be deactivated.', 'warning');
      return;
    }
    if (currentUser && (staff.user?._id === currentUser._id || staff.user?._id === currentUser.id)) {
      showToast('You cannot deactivate your own logged-in account.', 'warning');
      return;
    }

    const isActivating = !staff.isActive;
    const staffName = staff.user?.name || 'Staff Member';
    const confirmMessage = isActivating
      ? `Are you sure you want to ACTIVATE staff member "${staffName}"?\n\nTheir circulation desk and library management access will be restored.`
      : `Are you sure you want to DEACTIVATE staff member "${staffName}"?\n\nDeactivated staff will NOT be able to log in or manage book circulations.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await api.put(`/staff/${staff._id}`, {
        isActive: isActivating
      });
      if (res.data.success) {
        showToast(
          `Staff member "${staffName}" has been ${isActivating ? 'ACTIVATED' : 'DEACTIVATED'} successfully!`,
          isActivating ? 'success' : 'warning'
        );
        fetchStaff();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed', 'error');
    }
  };

  const handleDelete = async (id, name, staffUser) => {
    if (staffUser?.role === 'admin') {
      showToast('Administrator accounts cannot be deleted.', 'warning');
      return;
    }
    if (currentUser && (staffUser?._id === currentUser._id || staffUser?._id === currentUser.id)) {
      showToast('You cannot delete your own logged-in account.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/staff/${id}`);
      if (res.data.success) {
        showToast('Staff member removed successfully', 'success');
        fetchStaff();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete staff member', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      showToast('Please provide staff full name', 'warning');
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z\s.'\-]{1,49}$/.test(trimmedName)) {
      showToast('Staff name must contain only letters and spaces (2 to 50 characters). Numbers and special characters are not allowed.', 'error');
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      showToast('Please provide a valid email address', 'error');
      return;
    }

    const cleanPhone = (formData.phone || '').trim().replace(/\D/g, '');
    if (formData.phone && formData.phone.trim()) {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        showToast('Phone number must be exactly 10 digits starting with 6, 7, 8, or 9 (na kam, na jaada).', 'error');
        return;
      }
    }

    if (!editingStaff && (!formData.employeeId || !/^[a-zA-Z0-9\-_]{2,25}$/.test(formData.employeeId.trim()))) {
      showToast('Invalid Employee ID. Alphanumeric and hyphens only (e.g. EMP-101).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaff) {
        const payload = { ...formData, name: trimmedName, phone: cleanPhone };
        const res = await api.put(`/staff/${editingStaff._id}`, payload);
        if (res.data.success) {
          showToast('Staff details updated successfully!', 'success');
        }
      } else {
        const payload = { ...formData, name: trimmedName, phone: cleanPhone };
        const res = await api.post('/staff', payload);
        if (res.data.success) {
          showToast('New staff member added successfully!', 'success');
        }
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Library Staff & Officer Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Onboard new library desk personnel, assign departments, and maintain operational authorization.
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading staff records...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck className="empty-icon" />
          <h3 className="empty-title">No staff members enrolled</h3>
          <p className="empty-description">Get started by creating staff logins for library circulation desks.</p>
          <button onClick={openAddModal} className="btn btn-primary btn-sm">
            Add First Staff
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Officer Details</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {s.user?.email} • {s.user?.phone || 'No phone'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {s.employeeId}
                    </span>
                  </td>
                  <td>{s.department}</td>
                  <td>{s.designation}</td>
                  <td>
                    {s.user?.role === 'admin' ? (
                      <span
                        style={{
                          color: '#059669',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.55rem',
                          background: '#ecfdf5',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0'
                        }}
                        title="Administrator accounts cannot be deactivated"
                      >
                        <ShieldCheck size={16} /> Always Active
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                        {/* Current Status Badge */}
                        {s.isActive ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac'
                            }}
                            title="Staff member is currently active"
                          >
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5'
                            }}
                            title="Staff member is currently inactive/deactivated"
                          >
                            <XCircle size={12} /> Inactive
                          </span>
                        )}

                        {/* Explicit Action Button */}
                        {s.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#b91c1c',
                              backgroundColor: '#fff',
                              border: '1px solid #fca5a5',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Click to DEACTIVATE ${s.user?.name || 'Staff'}`}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                          >
                            <UserX size={12} /> Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#15803d',
                              backgroundColor: '#fff',
                              border: '1px solid #86efac',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Click to ACTIVATE ${s.user?.name || 'Staff'}`}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                          >
                            <UserCheck size={12} /> Activate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => openEditModal(s)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {s.user?.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(s._id, s.user?.name, s.user)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem 0.55rem' }}
                        >
                          <Trash2 size={14} />
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Details' : 'Onboard New Staff Member'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingStaff}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input
                type="text"
                className="form-control"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                disabled={!!editingStaff}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone (10 Digits)</label>
              <input
                type="tel"
                maxLength={10}
                className="form-control"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input
                type="text"
                className="form-control"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
          </div>

          {!editingStaff && (
            <div className="form-group">
              <label className="form-label">Login Password * (Min 6 characters)</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : editingStaff ? 'Update Staff' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageStaffPage;
