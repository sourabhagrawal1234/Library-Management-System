import React from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { BookOpen, Clock, AlertTriangle, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="app-container">
      <Navbar />

      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            About LMS Central & Library Guidelines
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Empowering students and faculty with seamless digital access to university literature, journals, and technical stacks.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', width: '100%', flex: 1 }}>
        {/* Rules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card">
            <div style={{ color: '#2563eb', marginBottom: '0.75rem' }}><Clock size={28} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Borrowing Period</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Standard loan duration is <strong>14 calendar days</strong>. System due dates are calculated automatically when circulation staff approves your request.
            </p>
          </div>

          <div className="card">
            <div style={{ color: '#dc2626', marginBottom: '0.75rem' }}><AlertTriangle size={28} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fine Policy</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Overdue returns incur a strictly enforced server-calculated penalty rate of <strong>₹10 per late day</strong>. Fines must be cleared to issue subsequent books.
            </p>
          </div>

          <div className="card">
            <div style={{ color: '#059669', marginBottom: '0.75rem' }}><ShieldCheck size={28} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Care & Integrity</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Books must be returned in good physical condition. Damaged, marked, or lost volumes will require replacement cost settlement.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="card" style={{ padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={22} color="#2563eb" /> Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                How do I request a book?
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Browse the catalog, ensure the book has available copies, and click "Request Book". Circulation staff will review and prepare the copy for physical pickup.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                How do fine payments work?
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Our digital portal accepts fine settlements via PhonePe UPI QR Code (9302732410@axl), Debit/Credit Cards, and Net Banking. Once your 12-digit UPI Transaction ID (UTR) is verified, your dues are settled immediately and an official printable receipt is issued.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Can I return a book outside library working hours?
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Physical check-in requires desk verification by staff. Automated drop-boxes are processed the following morning at 9:00 AM.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
