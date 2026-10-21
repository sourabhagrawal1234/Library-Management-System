import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Route Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import BooksPage from './pages/public/BooksPage';
import BookDetailsPage from './pages/public/BookDetailsPage';
import AboutPage from './pages/public/AboutPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Student / User Pages
import UserDashboard from './pages/user/UserDashboard';
import MyBooksPage from './pages/user/MyBooksPage';
import MyFinesPage from './pages/user/MyFinesPage';
import PaymentPage from './pages/user/PaymentPage';
import PaymentSuccessPage from './pages/user/PaymentSuccessPage';
import PaymentHistoryPage from './pages/user/PaymentHistoryPage';
import ProfilePage from './pages/user/ProfilePage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import ManageBooksPage from './pages/staff/ManageBooksPage';
import IssueRequestsPage from './pages/staff/IssueRequestsPage';
import IssuedBooksPage from './pages/staff/IssuedBooksPage';
import ReturnBooksPage from './pages/staff/ReturnBooksPage';
import MembersPage from './pages/staff/MembersPage';
import FineManagementPage from './pages/staff/FineManagementPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageStaffPage from './pages/admin/ManageStaffPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import IssueRecordsPage from './pages/admin/IssueRecordsPage';
import ReturnRecordsPage from './pages/admin/ReturnRecordsPage';
import PaymentRecordsPage from './pages/admin/PaymentRecordsPage';
import ReportsPage from './pages/admin/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student / User Protected Routes */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['user', 'staff', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="search-books" element={<BooksPage />} />
            <Route path="books/:id" element={<BookDetailsPage />} />
            <Route path="my-books" element={<MyBooksPage />} />
            <Route path="my-fines" element={<MyFinesPage />} />
            <Route path="payment/:fineId" element={<PaymentPage />} />
            <Route path="payment-success/:paymentId" element={<PaymentSuccessPage />} />
            <Route path="payment-history" element={<PaymentHistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Staff Protected Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="books" element={<ManageBooksPage />} />
            <Route path="issue-requests" element={<IssueRequestsPage />} />
            <Route path="issued-books" element={<IssuedBooksPage />} />
            <Route path="returns" element={<ReturnBooksPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="fines" element={<FineManagementPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="staff" element={<ManageStaffPage />} />
            <Route path="books" element={<ManageBooksPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="issues" element={<IssueRecordsPage />} />
            <Route path="returns" element={<ReturnRecordsPage />} />
            <Route path="fines" element={<FineManagementPage />} />
            <Route path="payments" element={<PaymentRecordsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
