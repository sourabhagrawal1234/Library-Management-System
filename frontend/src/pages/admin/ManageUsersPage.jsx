import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  History,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Electronics & Communication',
  'Management Studies',
  'Applied Sciences'
];

const SEM_OPTIONS = [
  '1st Sem / 1st Year',
  '2nd Sem / 1st Year',
  '3rd Sem / 2nd Year',
  '4th Sem / 2nd Year',
  '5th Sem / 3rd Year',
  '6th Sem / 3rd Year',
  '7th Sem / 4th Year',
  '8th Sem / 4th Year'
];

const ManageUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    studentId: '',
    branch: 'Computer Science & Engineering',
    semYear: '1st Sem / 1st Year',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // History Modal
  const [historyModalUser, setHistoryModalUser] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: {
          role: 'student', // Strictly only students
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          branch: branchFilter !== 'all' ? branchFilter : undefined
        }
      });
      if (res.data.success) {
        setStudents(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      showToast('Error loading student directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, branchFilter]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      branch: 'Computer Science & Engineering',
      semYear: '1st Sem / 1st Year',
      address: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      password: '',
      studentId: student.studentId || '',
      branch: student.branch || 'Computer Science & Engineering',
      semYear: student.semYear || '1st Sem / 1st Year',
      address: student.address || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (student) => {
    const isActivating = !student.isActive;
    const confirmMessage = isActivating
      ? `Are you sure you want to ACTIVATE student "${student.name}"?\n\nTheir library privileges, book borrowing, and student portal access will be immediately restored.`
      : `Are you sure you want to DEACTIVATE student "${student.name}"?\n\nDeactivated students will NOT be able to log in, borrow books, or create reservations until reactivated.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await api.put(`/users/${student._id}`, {
        isActive: isActivating
      });
      if (res.data.success) {
        showToast(
          `Student "${student.name}" has been ${isActivating ? 'ACTIVATED' : 'DEACTIVATED'} successfully!`,
          isActivating ? 'success' : 'warning'
        );
        fetchStudents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Status toggle failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student record for "${name}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        showToast('Student record deleted successfully', 'success');
        fetchStudents();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      showToast('Please provide full student name', 'warning');
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z\s.'\-]{1,49}$/.test(trimmedName)) {
      showToast('Name must contain only letters and spaces (2 to 50 characters). Numbers and special symbols are not allowed.', 'error');
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      showToast('Please provide a valid email address (e.g. student@college.edu)', 'error');
      return;
    }

    const cleanPhone = (formData.phone || '').trim().replace(/\D/g, '');
    if (formData.phone && formData.phone.trim()) {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        showToast('Phone number must be exactly 10 numeric digits starting with 6, 7, 8, or 9 (na kam, na jaada).', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        studentId: (formData.studentId || '').trim(),
        branch: formData.branch,
        semYear: formData.semYear,
        role: 'user',
        address: (formData.address || '').trim()
      };

      if (editingStudent) {
        if (formData.password) payload.password = formData.password;
        const res = await api.put(`/users/${editingStudent._id}`, payload);
        if (res.data.success) {
          showToast('Student details updated successfully!', 'success');
        }
      } else {
        if (!formData.password) {
          showToast('Password is required for new student', 'warning');
          setSubmitting(false);
          return;
        }
        payload.password = formData.password;
        const res = await api.post('/users', payload);
        if (res.data.success) {
          showToast('New student registered successfully!', 'success');
        }
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (student) => {
    setHistoryModalUser(student);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/users/${student._id}`);
      if (res.data.success) {
        setUserHistory(res.data);
      }
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Student Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Maintain student academic profiles, student IDs, branch records, and library access status.
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by student name, email, roll number, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Students</option>
            <option value="inactive">Deactivated Students</option>
          </select>
        </div>

        <div style={{ flex: '1 1 220px' }}>
          <select
            className="form-control"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All Academic Branches</option>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading student records...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <GraduationCap className="empty-icon" size={48} />
          <h3 className="empty-title">No Students Found</h3>
          <p className="empty-description">Try expanding your search query or reset the branch/status filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Academic Details</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={12} /> {s.email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
                      {s.studentId || 'No ID Assigned'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                      {s.branch || 'General'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {s.semYear || '1st Sem'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {s.phone || '—'}
                    </div>
                  </td>
                  <td>
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
                          title="Student account is currently active"
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
                          title="Student account is currently deactivated"
                        >
                          <XCircle size={12} /> Deactivated
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
                          title={`Click to DEACTIVATE ${s.name}`}
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
                          title={`Click to ACTIVATE ${s.name}`}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        >
                          <UserCheck size={12} /> Activate
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => viewHistory(s)}
                        className="btn btn-secondary btn-sm"
                        title="View Borrowing History"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Student"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="btn btn-danger btn-sm"
                        title="Delete Student Record"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Register New Student'}
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="student@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingStudent}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (10 Digits)</label>
              <input
                type="tel"
                maxLength={10}
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Student / Enrollment ID *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. STU-2026-001"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Semester / Year *</label>
              <select
                className="form-control"
                value={formData.semYear}
                onChange={(e) => setFormData({ ...formData, semYear: e.target.value })}
              >
                {SEM_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Branch / Department *</label>
            <select
              className="form-control"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingStudent ? 'New Password (Leave blank to keep current)' : 'Account Password *'}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingStudent}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hostel / Residential Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="Room / Hostel / City"
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
              {submitting ? 'Saving...' : editingStudent ? 'Update Student Record' : 'Register Student'}
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
            No issue or return records found for this student account.
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
