const Book = require('../models/Book');
const Category = require('../models/Category');

// @desc    Get all books with advanced search, category filter, availability filter
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res, next) => {
  try {
    const { search, category, availability, author, sort, page = 1, limit = 100 } = req.query;

    const query = {};

    // Search by title, author, isbn, bookId
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { bookId: regex }
      ];
    }

    // Filter by category (by ID or Category name)
    if (category && category !== 'all') {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
        if (cat) query.category = cat._id;
      }
    }

    // Filter by availability
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'unavailable') {
      query.availableCopies = { $lte: 0 };
    }

    // Filter by specific author
    if (author && author.trim()) {
      query.author = new RegExp(author.trim(), 'i');
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'title-asc') sortOption = { title: 1 };
    else if (sort === 'title-desc') sortOption = { title: -1 };
    else if (sort === 'author-asc') sortOption = { author: 1 };
    else if (sort === 'copies-desc') sortOption = { availableCopies: -1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      books
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book details by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name description');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Staff, Admin)
const createBook = async (req, res, next) => {
  try {
    const {
      bookId,
      title,
      author,
      isbn,
      category,
      publisher,
      publicationYear,
      description,
      shelfLocation,
      totalCopies,
      availableCopies,
      image
    } = req.body;

    // Validate required fields
    if (!bookId || !title || !author || !isbn || !category || !shelfLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Book ID, Title, Author, ISBN, Category, Shelf Location)'
      });
    }

    // Check duplicate bookId or ISBN
    const existingBook = await Book.findOne({
      $or: [{ bookId: bookId.trim() }, { isbn: isbn.trim() }]
    });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: 'A book with this Book ID or ISBN already exists'
      });
    }

    const total = Number(totalCopies) || 1;
    const available = availableCopies !== undefined ? Number(availableCopies) : total;

    const book = await Book.create({
      bookId: bookId.trim(),
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category,
      publisher: publisher || '',
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      description: description || '',
      shelfLocation: shelfLocation.trim(),
      totalCopies: total,
      availableCopies: available,
      image: image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
      status: available > 0 ? 'Available' : 'Currently Unavailable'
    });

    const populatedBook = await Book.findById(book._id).populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book: populatedBook
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Staff, Admin)
const updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const {
      bookId,
      title,
      author,
      isbn,
      category,
      publisher,
      publicationYear,
      description,
      shelfLocation,
      totalCopies,
      availableCopies,
      image,
      status
    } = req.body;

    if (bookId) book.bookId = bookId.trim();
    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (isbn) book.isbn = isbn.trim();
    if (category) book.category = category;
    if (publisher !== undefined) book.publisher = publisher;
    if (publicationYear !== undefined) book.publicationYear = publicationYear;
    if (description !== undefined) book.description = description;
    if (shelfLocation) book.shelfLocation = shelfLocation.trim();
    if (totalCopies !== undefined) book.totalCopies = Number(totalCopies);
    if (availableCopies !== undefined) book.availableCopies = Number(availableCopies);
    if (image) book.image = image;

    if (book.availableCopies <= 0) {
      book.status = 'Currently Unavailable';
    } else if (status) {
      book.status = status;
    } else {
      book.status = 'Available';
    }

    await book.save();

    const updatedBook = await Book.findById(book._id).populate('category', 'name');

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin, Staff)
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await book.deleteOne();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
