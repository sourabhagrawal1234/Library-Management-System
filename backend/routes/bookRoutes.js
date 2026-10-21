const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('staff', 'admin'), createBook);
router.put('/:id', protect, authorize('staff', 'admin'), updateBook);
router.delete('/:id', protect, authorize('staff', 'admin'), deleteBook);

module.exports = router;
