import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import FeedbackPage from './pages/FeedbackPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FeedbackListPage from './pages/FeedbackListPage';
import CategoriesPage from './pages/CategoriesPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#f1f1f7',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<FeedbackPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="feedback" element={<FeedbackListPage />} />
          <Route path="categories" element={<CategoriesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
