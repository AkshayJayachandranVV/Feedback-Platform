import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import './AdminLayout.css';

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary)', flexShrink: 0 }}>
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(92, 62, 194, 0.1)" />
    <path d="M12 6L7 9V15L12 18L17 15V9L12 6Z" fill="currentColor" opacity="0.8" />
  </svg>
);

const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    to: '/admin/feedback',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: 'Feedback List',
  },
  {
    to: '/admin/categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: 'Categories',
  },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Command + K listener to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('header-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Confirm Logout',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
    });

    if (result.isConfirmed) {
      try {
        await authApi.logout();
      } catch {
        // Even if the API call fails, clear local state
      }
      clearAuth();
      navigate('/login');
    }
  };

  const handlePromoClick = () => {
    window.open('/', '_blank');
  };

  const handleNotificationsClick = () => {
    Swal.fire({
      title: 'Notifications',
      html: `
        <div style="text-align: left; font-size: 13.5px; font-family: 'Inter', sans-serif;">
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
            <strong>⭐ High Rating Submission</strong>
            <p style="color: var(--text-secondary); margin-top: 2px;">John Doe submitted a 5-star review for Integration.</p>
          </div>
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
            <strong>⚠️ Low Rating Warning</strong>
            <p style="color: var(--text-secondary); margin-top: 2px;">Sarah Smith left a 2-star rating regarding UI performance.</p>
          </div>
          <div style="padding: 10px 0;">
            <strong>💬 Bug Report Category</strong>
            <p style="color: var(--text-secondary); margin-top: 2px;">Feedback #1024 submitted under Category 'Bug'.</p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#5c3ec2',
      confirmButtonText: 'Dismiss All',
    });
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    const namePart = email.split('@')[0];
    if (namePart.length <= 2) return namePart.toUpperCase();
    return namePart.substring(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <Logo />
            <span>Acodash</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '4px' }}>
            Console v1.0.0
          </p>
        </div>

        <nav className="sidebar-nav">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '16px', marginBottom: '8px', display: 'block' }}>
            Menu
          </span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Got Ideas Promo Box */}
          <div className="sidebar-promo" style={{ marginTop: 'auto' }}>
            <h4>Got ideas?</h4>
            <p>We would love to hear your feedback!</p>
            <button onClick={handlePromoClick} className="btn btn-primary btn-sm btn-full">
              Submit Form
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          {/* Theme Dropdown */}
          <div className="theme-selector-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="theme-select" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              THEME MODE
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="form-control"
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                height: 'auto',
                backgroundImage: 'none',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <option value="light">☀️ Light Theme</option>
              <option value="dark">🌙 Dark Theme</option>
            </select>
          </div>

          <button id="logout-btn" className="nav-item" onClick={handleLogout} style={{ borderTop: '1px solid var(--border)', borderRadius: 0, padding: '12px 16px 0 16px', marginTop: '4px' }}>
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          <div className="header-search">
            <span className="header-search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              id="header-search-input"
              type="text"
              className="form-control"
              placeholder="Search feedback..."
              style={{ paddingLeft: '36px', height: '36px', fontSize: '13.5px' }}
            />
            <span className="header-shortcut">⌘K</span>
          </div>

          <div className="header-actions">
            <button className="header-btn" onClick={handleNotificationsClick} aria-label="View notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="notification-badge" />
            </button>

            <div className="profile-dropdown">
              <div className="profile-avatar">
                {getInitials(user?.email)}
              </div>
              <div className="profile-info">
                <div className="profile-name">Admin User</div>
                <div className="profile-role">{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <Outlet />
      </main>
    </div>
  );
}
