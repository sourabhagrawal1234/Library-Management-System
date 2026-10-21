const express = require('express');
const router = express.Router();
const {
  processPayment,
  getMyPayments,
  getPaymentReceipt,
  getAllPayments,
  updatePaymentVerification
} = require('../controllers/paymentController');
const {
  getGatewayConfig,
  createOrder,
  verifyPayment,
  requestCashPayment,
  collectCashPayment,
  handleWebhook
} = require('../controllers/paymentGatewayController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// --- Razorpay gateway (card / UPI / QR / net banking / wallets) ---
// Webhook is public: Razorpay signs the request, signature is verified inside.
router.post('/webhook', handleWebhook);
router.get('/config', protect, getGatewayConfig);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// --- Cash at the library counter ---
router.post('/cash/request', protect, requestCashPayment);
router.post('/cash/collect', protect, authorize('staff', 'admin'), collectCashPayment);

// --- Existing manual / records endpoints ---
router.post('/process', protect, processPayment);
router.get('/my', protect, getMyPayments);
router.get('/:id/receipt', protect, getPaymentReceipt);
router.get('/', protect, authorize('staff', 'admin'), getAllPayments);
router.put('/:id/verify', protect, authorize('staff', 'admin'), updatePaymentVerification);

module.exports = router;
