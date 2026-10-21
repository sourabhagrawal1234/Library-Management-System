import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import BookCard from '../../components/common/BookCard';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, RotateCcw, BookX } from 'lucide-react';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [author, setAuthor] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [authorsList, setAuthorsList] = useState([]);

  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Load categories and all authors
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, booksRes] = await Promise.all([
          api.get('/categories'),
          api.get('/books', { params: { limit: 200 } })
        ]);
        if (catRes.data.success) {
          setCategories(catRes.data.categories);
        }
        if (booksRes.data.success && booksRes.data.books) {
          const uniqueAuthors = Array.from(
            new Set(booksRes.data.books.map((b) => b.author).filter(Boolean))
          ).sort();
          setAuthorsList(uniqueAuthors);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch books with filters
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      if (author !== 'all') params.author = author;
      if (availability !== 'all') params.availability = availability;

      const res = await api.get('/books', { params });
      if (res.data.success) {
        setBooks(res.data.books);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
      showToast('Error loading books', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, author, availability, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setAuthor('all');
    setAvailability('all');
  };

  const handleRequestBook = async (bookId) => {
    if (!isAuthenticated) {
      showToast('Please login to request this book', 'warning');
      navigate('/login');
      return;
    }

    setRequestingId(bookId);
    try {
      const res = await api.post('/issues/request', { bookId });
      if (res.data.success) {
        showToast(res.data.message || 'Book request submitted successfully!', 'success');
        fetchBooks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit book request', 'error');
    } finally {
      setRequestingId(null);
    }
  };

  const location = useLocation();
  const isEmbedded = location.pathname.startsWith('/user/');

  const filterAndContent = (
    <>
      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        {/* Text Search */}
        <div className="input-icon-wrapper" style={{ flex: '1 1 280px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search books by title, author, category or book ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Dropdown */}
        <div style={{ flex: '1 1 170px' }}>
          <select
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name} ({cat.bookCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Author Dropdown */}
        <div style={{ flex: '1 1 170px' }}>
          <select
            className="form-control"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          >
            <option value="all">All Authors</option>
            {authorsList.map((auth) => (
              <option key={auth} value={auth}>
                {auth}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select
            className="form-control"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">Availability: All</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          className="btn btn-secondary"
          title="Reset Filters"
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </button>
      </div>

      {/* Category Fast-Filter Chips */}
      <div className="category-chips">
        <button
          onClick={() => setCategory('all')}
          className={`category-chip ${category === 'all' ? 'active' : ''}`}
        >
          All Disciplines ({categories.reduce((sum, c) => sum + (c.bookCount || 0), 0)})
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setCategory(cat._id)}
            className={`category-chip ${category === cat._id ? 'active' : ''}`}
          >
            {cat.name} ({cat.bookCount || 0})
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing <strong>{books.length}</strong> title{books.length === 1 ? '' : 's'} matching criteria
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading catalog books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookX className="empty-icon" />
          <h3 className="empty-title">No books found</h3>
          <p className="empty-description">
            No titles match your current search query or filter criteria. Try searching with different keywords or clear filters.
          </p>
          <button onClick={handleClearFilters} className="btn btn-primary btn-sm">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onRequest={handleRequestBook}
              requestingId={requestingId}
            />
          ))}
        </div>
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Search Books
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Search books by title, author, category or book ID...
          </p>
        </div>
        {filterAndContent}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />

      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Books Catalog & Repository
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '700px' }}>
            Search by Title, Author, ISBN, or Book ID. Check real-time stack location and copy availability.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', width: '100%', flex: 1 }}>
        {filterAndContent}
      </div>

      <Footer />
    </div>
  );
};

export default BooksPage;
