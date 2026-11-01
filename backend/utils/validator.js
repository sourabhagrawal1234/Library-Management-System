/**
 * Centralized Data Validation & Sanitization Utility for Library Management System
 * Enforces strict string, number, phone (10 digits), and special character rules.
 */

// 1. Phone Number: Must be exactly 10 digits (Standard Indian mobile starting with 6, 7, 8, or 9)
const sanitizePhone = (phone) => {
  if (!phone) return '';
  // Strip all non-numeric characters (spaces, +, -, etc.)
  const digitsOnly = phone.toString().replace(/\D/g, '');
  // If formatted with country code (91) or leading zero, extract the 10-digit mobile number
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1);
  }
  return digitsOnly;
};

const isValidPhone = (phone) => {
  if (!phone) return false;
  const clean = sanitizePhone(phone);
  // Must be strictly 10 digits and start with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(clean);
};

// 2. Category Name: 2-50 chars, must start with letter, only letters, spaces, &, -, /
// Disallows pure numbers, garbage symbols, or random characters
const isValidCategoryName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  // Must contain letters, disallow pure numbers or random symbols (@, #, $, %, etc.)
  const allowedPattern = /^[a-zA-Z][a-zA-Z0-9\s&,\-/]*$/;
  const hasLetters = /[a-zA-Z]{2,}/;
  return allowedPattern.test(trimmed) && hasLetters.test(trimmed);
};

// 3. Person Name (Student/Staff/User): 2-50 chars, alphabetic with dots/spaces/hyphens
// Disallows numbers (e.g. 12345), symbols, or empty spaces
const isValidPersonName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  // Allows letters, dots (Dr. / initials), spaces, hyphens
  return /^[a-zA-Z][a-zA-Z\s.'\-]{1,49}$/.test(trimmed);
};

// 4. Book Title: 2-150 chars, must contain alphabets, no script tags or dangerous symbols
const isValidBookTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length < 2 || trimmed.length > 150) return false;
  return /[a-zA-Z]{2,}/.test(trimmed) && /^[^<>%$`~{}]+$/.test(trimmed);
};

// 5. Author Name: 2-80 chars, must contain alphabets
const isValidAuthor = (author) => {
  if (!author || typeof author !== 'string') return false;
  const trimmed = author.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  return /^[a-zA-Z][a-zA-Z\s.,&'\-]{1,79}$/.test(trimmed);
};

// 6. ISBN: 10 or 13 digits (digits and hyphens only)
const isValidISBN = (isbn) => {
  if (!isbn || typeof isbn !== 'string') return false;
  const clean = isbn.trim().replace(/[-\s]/g, '');
  return /^(\d{10}|\d{13}|\d{9}[\dX])$/i.test(clean);
};

// 7. Student ID / Employee ID: 2-25 characters alphanumeric and hyphens/underscores only
const isValidIdentifier = (id) => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return /^[a-zA-Z0-9\-_]{2,25}$/.test(trimmed);
};

// 8. Positive Integer (Copies, Year): Must be an integer within bounds
const isPositiveInteger = (val, min = 0, max = 10000) => {
  if (val === undefined || val === null || val === '') return false;
  const num = Number(val);
  return Number.isInteger(num) && num >= min && num <= max;
};

// 9. Valid Email
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

module.exports = {
  sanitizePhone,
  isValidPhone,
  isValidCategoryName,
  isValidPersonName,
  isValidBookTitle,
  isValidAuthor,
  isValidISBN,
  isValidIdentifier,
  isPositiveInteger,
  isValidEmail
};
