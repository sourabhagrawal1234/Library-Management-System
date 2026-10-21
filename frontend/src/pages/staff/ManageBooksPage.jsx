import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  XCircle,
  Filter,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  X
} from 'lucide-react';

const ManageBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [imageMode, setImageMode] = useState('upload');
  const [imageFileName, setImageFileName] = useState('');
  const [imageFileSize, setImageFileSize] = useState('');
  const [formData, setFormData] = useState({
    bookId: '',
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    publicationYear: '',
    description: '',
    shelfLocation: '',
    totalCopies: 1,
    availableCopies: 1,
    image: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const location = useLocation();

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
        if (!formData.category && res.data.categories.length > 0) {
          setFormData((prev) => ({ ...prev, category: res.data.categories[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const res = await api.get('/books', { params });
      if (res.data.success) {
        setBooks(res.data.books);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      showToast('Error loading books', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'add') {
      openAddModal();
    }
  }, [location.search, categories]);

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    setImageFileName(file.name);
    const sizeKB = Math.round(file.size / 1024);
    setImageFileSize(`${sizeKB} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to standard book cover dimensions if excessively large
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData((prev) => ({ ...prev, image: optimizedDataUrl }));
        showToast(`Image "${file.name}" loaded successfully!`, 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setImageMode('upload');
    setImageFileName('');
    setImageFileSize('');
    setFormData({
      bookId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: '',
      author: '',
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: categories.length > 0 ? categories[0]._id : '',
      publisher: '',
      publicationYear: new Date().getFullYear(),
      description: '',
      shelfLocation: 'Stack CS-101',
      totalCopies: 3,
      availableCopies: 3,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setImageFileName('');
    setImageFileSize('');
    if (book.image && book.image.startsWith('data:')) {
      setImageMode('upload');
    } else if (book.image && book.image.startsWith('http')) {
      setImageMode('url');
    } else {
      setImageMode('upload');
    }
    setFormData({
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category?._id || book.category || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      description: book.description || '',
      shelfLocation: book.shelfLocation || '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      image: book.image || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the catalog?`)) {
      return;
    }

    try {
      const res = await api.delete(`/books/${id}`);
      if (res.data.success) {
        showToast('Book removed successfully', 'success');
        fetchBooks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete book', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingBook) {
        const res = await api.put(`/books/${editingBook._id}`, formData);
        if (res.data.success) {
          showToast('Book details updated successfully!', 'success');
        }
      } else {
        const res = await api.post('/books', formData);
        if (res.data.success) {
          showToast('New book successfully cataloged!', 'success');
        }
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Manage Books
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Add, update, or remove books from the library catalog and shelf locations.
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Title, Author, ISBN, or Book ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>Loading book records...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-icon" />
          <h3 className="empty-title">No books registered</h3>
          <p className="empty-description">Get started by cataloging a new book into the database.</p>
          <button onClick={openAddModal} className="btn btn-primary btn-sm">
            Add First Book
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Category</th>
                <th>Shelf Stack</th>
                <th>Copies Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={b.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                        alt={b.title}
                        style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          By {b.author} • <strong>ID:</strong> {b.bookId} • <strong>ISBN:</strong> {b.isbn}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{b.category?.name || 'General'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <MapPin size={13} color="#2563eb" /> {b.shelfLocation}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: b.availableCopies > 0 ? '#059669' : '#dc2626' }}>
                      {b.availableCopies} / {b.totalCopies}
                    </span>
                  </td>
                  <td>
                    {b.availableCopies > 0 ? (
                      <span className="badge badge-available">Available</span>
                    ) : (
                      <span className="badge badge-unavailable">Unavailable</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(b)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Book"
                        style={{ padding: '0.35rem 0.6rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(b._id, b.title)}
                        className="btn btn-danger btn-sm"
                        title="Delete Book"
                        style={{ padding: '0.35rem 0.6rem' }}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? 'Edit Book Details' : 'Catalog New Book'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Book ID *</label>
              <input
                type="text"
                className="form-control"
                value={formData.bookId}
                onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ISBN *</label>
              <input
                type="text"
                className="form-control"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Book Title *</label>
            <input
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Author Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Shelf Location *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Stack CS-101"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Copies *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.totalCopies}
                onChange={(e) => {
                  const total = parseInt(e.target.value, 10) || 1;
                  setFormData({
                    ...formData,
                    totalCopies: total,
                    availableCopies: Math.min(formData.availableCopies, total)
                  });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Copies *</label>
              <input
                type="number"
                min="0"
                max={formData.totalCopies}
                className="form-control"
                value={formData.availableCopies}
                onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Publisher</label>
              <input
                type="text"
                className="form-control"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Publication Year</label>
              <input
                type="number"
                className="form-control"
                value={formData.publicationYear}
                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
              />
            </div>
          </div>

          {/* Dual-Mode Cover Image Selector (Laptop Upload OR Web URL) */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Book Cover Image
              </label>
              {/* Mode Toggle Pills */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: imageMode === 'upload' ? '#2563eb' : 'transparent',
                    color: imageMode === 'upload' ? '#ffffff' : '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 150ms ease'
                  }}
                >
                  <UploadCloud size={14} />
                  <span>From Laptop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: imageMode === 'url' ? '#2563eb' : 'transparent',
                    color: imageMode === 'url' ? '#ffffff' : '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 150ms ease'
                  }}
                >
                  <LinkIcon size={14} />
                  <span>Web URL</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Upload from Laptop / Device */}
            {imageMode === 'upload' && (
              <div
                style={{
                  border: '2px dashed #93c5fd',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 150ms ease'
                }}
                onClick={() => document.getElementById('laptop-cover-input').click()}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              >
                <input
                  id="laptop-cover-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageFileUpload}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      Click to choose image from your laptop
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Supports PNG, JPG, JPEG, WebP (auto-optimized & compressed)
                    </p>
                  </div>
                  {imageFileName && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                      <span>✓ Selected: {imageFileName} ({imageFileSize})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Enter Web URL */}
            {imageMode === 'url' && (
              <div>
                <input
                  type="url"
                  className="form-control"
                  placeholder="Paste image link, e.g. https://images.unsplash.com/... or any web link"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Direct image link from Google, Unsplash, or CDN.
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600' })}
                    style={{ fontSize: '0.72rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Use Sample Cover
                  </button>
                </div>
              </div>
            )}

            {/* Live Cover Preview Box */}
            {formData.image && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem', padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <img
                  src={formData.image}
                  alt="Cover preview"
                  style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Live Cover Preview</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.image.startsWith('data:') ? `Laptop Upload (${imageFileName || 'Image File'})` : formData.image}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, image: '' });
                    setImageFileName('');
                    setImageFileSize('');
                  }}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Remove Image"
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description / Abstract</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {submitting ? 'Saving...' : editingBook ? 'Update Book' : 'Catalog Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageBooksPage;
