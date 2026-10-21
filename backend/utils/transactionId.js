/**
 * Generate dummy transaction ID in the format: LMS-TXN-YYYYMMDD-XXXXX
 */
const generateTransactionId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `LMS-TXN-${year}${month}${day}-${random}`;
};

module.exports = {
  generateTransactionId
};
