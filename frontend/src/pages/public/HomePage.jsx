import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import BookCard from '../../components/common/BookCard';
import api from '../../services/api';
import {
  Search,
  BookOpen,
  Clock,
  CreditCard,
  Headphones,
  ArrowRight,
  BookCheck,
  Users,
  Calendar,
  ThumbsUp
} from 'lucide-react';

const HomePage = () => {
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books?limit=5');
        if (res.data.success) {
          setPopularBooks(res.data.books);
        }
      } catch (err) {
        console.error('Failed to load popular books:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/books');
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      {/* Hero Section (Screen 1 Reference) */}
      <section className="hero-banner">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center', textAlign: 'left' }}>
          <div>
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#ffffff',
                marginBottom: '1rem',
                letterSpacing: '-0.02em'
              }}
            >
              Your Digital Library,<br />Simplified.
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#cbd5e1',
                marginBottom: '2rem',
                maxWidth: '520px',
                lineHeight: 1.6
              }}
            >
              Search, issue and manage library books easily from one place.
            </p>

            {/* In-Hero Search Bar */}
            <form onSubmit={handleHeroSearch} className="hero-search-bar" style={{ margin: 0, maxWidth: '580px' }}>
              <Search size={20} color="#64748b" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search books by title, author, category or book ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '30px', padding: '0.65rem 1.6rem' }}>
                Search
              </button>
            </form>
          </div>

          {/* Right Hero Decorative Stacks */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <img
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700"
              alt="Books Stack"
              style={{
                maxWidth: '380px',
                width: '100%',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                border: '4px solid rgba(255, 255, 255, 0.15)',
                objectFit: 'cover',
                maxHeight: '340px'
              }}
            />
          </div>
        </div>
      </section>

      {/* 5-Feature Icon Bar (Screen 1 Reference) */}
      <div style={{ padding: '0 1.5rem' }}>
        <div className="feature-pills-bar">
          <div className="feature-pill-item">
            <div className="feature-pill-icon">
              <Search size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Easy Search</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Find books quickly</div>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Book Issue</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Request & Borrow</div>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Track Due Dates</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Never miss a date</div>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Pay Fine</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Secure & simple</div>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
              <Headphones size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>24/7 Access</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Anytime, anywhere</div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Books Section */}
      <section style={{ padding: '2rem 2rem 4rem', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              Popular Books
            </h2>
            <Link to="/books" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.5rem' }}>
              {popularBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4-Statistics Counter Bar (Screen 1 Reference) */}
      <div style={{ padding: '0 1.5rem' }}>
        <div className="stats-counter-bar">
          <div>
            <div className="stats-counter-num">5000+</div>
            <div className="stats-counter-sub">Total Books</div>
          </div>
          <div>
            <div className="stats-counter-num">1200+</div>
            <div className="stats-counter-sub">Active Users</div>
          </div>
          <div>
            <div className="stats-counter-num">300+</div>
            <div className="stats-counter-sub">Daily Issues</div>
          </div>
          <div>
            <div className="stats-counter-num">98%</div>
            <div className="stats-counter-sub">Satisfaction Rate</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
