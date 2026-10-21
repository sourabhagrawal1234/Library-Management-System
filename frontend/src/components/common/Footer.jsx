import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '3rem 2rem 1.5rem',
        marginTop: 'auto',
        borderTop: '1px solid #1e293b'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* Col 1 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.8rem' }}>
            <div style={{ background: '#2563eb', padding: '6px', borderRadius: '6px', display: 'inline-flex' }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <span>LMS Central</span>
          </div>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94a3b8' }}>
            Next-generation digital library management platform for university students, faculty, and administrators.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <li><Link to="/books" style={{ color: '#94a3b8', transition: 'color 150ms' }}>Explore Books</Link></li>
            <li><Link to="/about" style={{ color: '#94a3b8', transition: 'color 150ms' }}>Library Guidelines</Link></li>
            <li><Link to="/login" style={{ color: '#94a3b8', transition: 'color 150ms' }}>Member Login</Link></li>
            <li><Link to="/register" style={{ color: '#94a3b8', transition: 'color 150ms' }}>Student Registration</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>
            Library Timings
          </h4>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            <strong>Mon - Fri:</strong> 8:00 AM - 10:00 PM<br />
            <strong>Saturday:</strong> 9:00 AM - 6:00 PM<br />
            <strong>Sunday:</strong> 10:00 AM - 4:00 PM<br />
            <span style={{ color: '#38bdf8' }}>Digital Portal: 24/7 Available</span>
          </p>
        </div>

        {/* Col 4 */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>
            Contact & Support
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="#38bdf8" /> circulation@library.edu
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} color="#38bdf8" /> +91 (0) 80 2345 6789
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#38bdf8" /> Central Block, Academic Avenue
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid #1e293b',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748b'
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} LMS Central University Digital Library. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Strict Fine Policy: ₹10/day</span>
          <span>Automatic Due Date Tracking</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
