import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  BookmarkPlus,
  BookOpen,
  HelpCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

const RulesPage = () => {
  const rules = [
    {
      num: '1',
      title: 'Library Membership',
      desc: 'Students should register with valid university details (Student ID, semester, branch) and use their personal credentials for all library transactions.',
      icon: ShieldCheck,
      color: '#2563eb'
    },
    {
      num: '2',
      title: 'Book Issue Policy',
      desc: 'Book issuing is subject to available copy count in circulation. Physical pickup must be completed within 48 hours of staff confirmation.',
      icon: BookOpen,
      color: '#0891b2'
    },
    {
      num: '3',
      title: 'Return Due Date',
      desc: 'Standard loan period is 14 calendar days. Members can inspect active issue records and due dates under the Student Dashboard at any time.',
      icon: Clock,
      color: '#059669'
    },
    {
      num: '4',
      title: 'Late Return Fine Structure',
      desc: 'Overdue loans attract a standard penalty of ₹10 per day. Outstanding fines can be cleared digitally via UPI or at the library circulation counter.',
      icon: AlertTriangle,
      color: '#dc2626'
    },
    {
      num: '5',
      title: 'Book Reservation System',
      desc: 'Members may submit digital reservation requests for volumes currently on loan. Reserved titles are prioritized when returned to inventory.',
      icon: BookmarkPlus,
      color: '#7c3aed'
    },
    {
      num: '6',
      title: 'Book Care & Preservation',
      desc: 'Borrowed materials must be maintained in pristine condition. Any torn, written-upon, or misplaced volumes require prompt reporting and replacement.',
      icon: FileCheck,
      color: '#d97706'
    }
  ];

  return (
    <div className="app-container">
      <Navbar />

      {/* Hero Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#2563eb', marginBottom: '0.5rem' }}>
            RULES & REGULATIONS
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
            Library Rules & Guidelines
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
            Review institutional circulation regulations, borrowing terms, and member conduct policies.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '2.5rem auto', padding: '0 1.5rem', width: '100%', flex: 1 }}>
        {/* Rules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.num}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: `${rule.color}15`,
                    color: rule.color,
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {rule.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {rule.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                    {rule.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Need Help Banner */}
        <div
          className="card"
          style={{
            padding: '1.5rem 1.75rem',
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>
                Need Assistance or Special Borrowing Approvals?
              </div>
              <div style={{ fontSize: '0.825rem', color: '#3b82f6', marginTop: '2px' }}>
                For inquiries regarding thesis access, inter-library loans or fine disputes, consult the circulation desk.
              </div>
            </div>
          </div>
          <Link to="/about" className="btn btn-primary btn-sm">
            <span>Read About LMS Central</span>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RulesPage;
