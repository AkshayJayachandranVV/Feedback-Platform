import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      gap: '16px',
    }}>
      <div style={{ fontSize: '80px' }}>🔭</div>
      <h1 style={{ fontSize: '64px', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        404
      </h1>
      <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Page not found</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '8px' }}>
        Go Home
      </Link>
    </div>
  );
}
