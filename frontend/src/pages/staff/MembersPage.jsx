import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { Users, Search, BookOpen, AlertTriangle, ShieldCheck, Mail, Phone } from 'lucide-react';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/members', {
        params: { search: search.trim() || undefined }
      });
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const viewMemberHistory = async (member) => {
    setSelectedMember(member);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/users/${member._id}`);
      if (res.data.success) {
        setMemberHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load member history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          Student & Member Registry
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Registered student roster with live active loan volumes, overdue counts, and outstanding dues.
        </p>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="input-icon-wrapper">
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search member by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading member directory...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-icon" />
          <h3 className="empty-title">No members found</h3>
          <p className="empty-description">No student records matched your search query.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Contact Coordinates</th>
                <th>Books Issued</th>
                <th>Overdue Books</th>
                <th>Outstanding Fine</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Joined {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{m.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.phone || 'No phone'}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>
                      {m.totalIssued} books
                    </span>
                  </td>
                  <td>
                    {m.overdueBooks > 0 ? (
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>
                        {m.overdueBooks} Overdue
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>0</span>
                    )}
                  </td>
                  <td>
                    {m.pendingFine > 0 ? (
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>
                        ₹{m.pendingFine}
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>₹0</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${m.paymentStatus === 'Clear' ? 'badge-available' : 'badge-overdue'}`}>
                      {m.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => viewMemberHistory(m)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem' }}
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member History Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => {
          setSelectedMember(null);
          setMemberHistory(null);
        }}
        title={`Member Details: ${selectedMember?.name}`}
        maxWidth="650px"
      >
        {selectedMember && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
              <div><strong>Email:</strong> {selectedMember.email}</div>
              <div><strong>Phone:</strong> {selectedMember.phone || 'N/A'}</div>
              <div><strong>Address:</strong> {selectedMember.address || 'N/A'}</div>
              <div><strong>Active Loans:</strong> {selectedMember.totalIssued}</div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Issue History ({memberHistory?.issues?.length || 0})
            </h4>

            {historyLoading ? (
              <div className="spinner"></div>
            ) : memberHistory?.issues?.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No loans found for this student.</p>
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {memberHistory?.issues?.map((i) => (
                  <div key={i._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{i.book?.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Due: {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <span className="badge badge-active">{i.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembersPage;
