import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  KeyRound,
  History
} from 'lucide-react';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // History Modal
  const [historyModalUser, setHistoryModalUser] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: {
          search: search.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined
        }
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Error loading user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
      address: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      address: user.address || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.put(`/users/${user._id}`, {
        isActive: !user.isActive
      });
      if (res.data.success) {
        showToast(`User ${user.name} ${!user.isActive ? 'activated' : 'deactivated'}`, 'info');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Status toggle failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        showToast('User account deleted successfully', 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        const res = await api.put(`/users/${editingUser._id}`, payload);
        if (res.data.success) {
          showToast('User details updated successfully!', 'success');
        }
      } else {
        if (!formData.password) {
          showToast('Password is required for new user', 'warning');
          setSubmitting(false);
          return;
        }
        const res = await api.post('/users', formData);
        if (res.data.success) {
          showToast('New user registered successfully!', 'success');
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (user) => {
    setHistoryModalUser(user);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/users/${user._id}`);
      if (res.data.success) {
        setUserHistory(res.data);
      }
    } catch (err) {
      console.error('Error fetching user history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            System User Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Maintain student and administrative identities, modify permission assignments, and toggle account states.
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Students (User)</option>
            <option value="staff">Staff Members</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading user directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-icon" />
          <h3 className="empty-title">No users matched</h3>
          <p className="empty-description">Try expanding your search query or reset role filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-overdue' : u.role === 'staff' ? 'badge-active' : 'badge-available'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      title="Click to toggle status"
                    >
                      {u.isActive ? (
                        <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleRight size={22} /> Active
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ToggleLeft size={22} /> Deactivated
                        </span>
                      )}
                    </button>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => viewHistory(u)}
                        className="btn btn-secondary btn-sm"
                        title="View Loan History"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        className="btn btn-secondary btn-sm"
                        title="Edit User"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="btn btn-danger btn-sm"
                        title="Delete User"
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

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Register New User'}
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
              disabled={!!editingUser}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Student (User)</option>
                <option value="staff">Library Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingUser ? 'New Password (Leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <input
              type="text"
              className="form-control"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

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
              {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!historyModalUser}
        onClose={() => {
          setHistoryModalUser(null);
          setUserHistory(null);
        }}
        title={`Borrowing History: ${historyModalUser?.name}`}
        maxWidth="600px"
      >
        {historyLoading ? (
          <div className="spinner"></div>
        ) : !userHistory?.issues || userHistory.issues.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>
            No issue or return records found for this account.
          </p>
        ) : (
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {userHistory.issues.map((i) => (
              <div key={i._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.book?.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Due: {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <span className="badge badge-active">{i.status}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageUsersPage;
