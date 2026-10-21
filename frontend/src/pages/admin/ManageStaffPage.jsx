import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, UserPlus, Edit2, Trash2, ToggleLeft, ToggleRight, Building, BadgePercent } from 'lucide-react';

const ManageStaffPage = () => {
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
    try {
      const res = await api.put(`/staff/${staff._id}`, {
        isActive: !staff.isActive
      });
      if (res.data.success) {
        showToast('Staff status updated', 'info');
        fetchStaff();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
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
    setSubmitting(true);
    try {
      if (editingStaff) {
        const res = await api.put(`/staff/${editingStaff._id}`, formData);
        if (res.data.success) {
          showToast('Staff details updated successfully!', 'success');
        }
      } else {
        const res = await api.post('/staff', formData);
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
                    <button
                      onClick={() => handleToggleStatus(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                    >
                      {s.isActive ? (
                        <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleRight size={22} /> Active
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleLeft size={22} /> Inactive
                        </span>
                      )}
                    </button>
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
                      <button
                        onClick={() => handleDelete(s._id, s.user?.name)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
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
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
