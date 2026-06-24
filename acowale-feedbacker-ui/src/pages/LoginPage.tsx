import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { loginSchema } from '../schemas/auth.schema';
import type { LoginFormData } from '../schemas/auth.schema';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { user } = await authApi.login(data);
      setAuth(user);
      await Swal.fire({
        title: '👋 Welcome back!',
        html: `<p style="color: #9ca3af">Logged in as <strong style="color: #818cf8">${user.email}</strong></p>`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#16161f',
        color: '#f1f1f7',
      });
      navigate('/admin/dashboard');
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const message = axiosErr?.response?.data?.message || 'Invalid email or password';
      await Swal.fire({
        title: 'Login Failed',
        text: message,
        icon: 'error',
        background: '#16161f',
        color: '#f1f1f7',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-logo">🎯</div>
          <h1>Admin Login</h1>
          <p>Sign in to access the admin console</p>
        </div>

        <form id="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="admin@acowale.com"
              {...register('email')}
              autoComplete="email"
            />
            {errors.email && <p className="form-error">⚠ {errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register('password')}
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error">⚠ {errors.password.message}</p>}
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Signing in...
              </>
            ) : (
              '🔐 Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo: <code>admin@acowale.com</code> / <code>Admin@123</code></p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            ← Back to Feedback Form
          </Link>
        </div>
      </div>
    </div>
  );
}
