import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { feedbackSchema } from '../schemas/feedback.schema';
import type { FeedbackFormData } from '../schemas/feedback.schema';
import { feedbackApi } from '../api/feedback.api';
import { categoriesApi } from '../api/categories.api';
import type { Category } from '../types/feedback.types';
import { Link } from 'react-router-dom';
import './FeedbackPage.css';

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary)', flexShrink: 0 }}>
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(92, 62, 194, 0.1)" />
    <path d="M12 6L7 9V15L12 18L17 15V9L12 6Z" fill="currentColor" opacity="0.8" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="form-control-icon">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="form-control-icon">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const FloatingIllustration = () => (
  <div className="feedback-illustration">
    <svg
      width="240"
      height="180"
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="floating-illustration"
    >
      <defs>
        <filter id="card-shadow" x="10" y="20" width="200" height="130" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#5c3ec2" floodOpacity="0.12" />
        </filter>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#836be0" />
          <stop offset="100%" stopColor="#5c3ec2" />
        </linearGradient>
      </defs>
      
      {/* Card Background */}
      <rect x="30" y="35" width="160" height="90" rx="16" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" filter="url(#card-shadow)" />
      
      {/* Small UI Details inside card */}
      <rect x="46" y="52" width="48" height="8" rx="4" fill="var(--primary)" opacity="0.15" />
      <rect x="46" y="68" width="80" height="6" rx="3" fill="var(--text-muted)" opacity="0.3" />
      
      {/* Stars in Card */}
      <g transform="translate(46, 88)">
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d="M9.5 14.25l-5.584 2.936 1.066-6.218L.465 6.564l6.243-.907L9.5 0l2.792 5.657 6.243.907-4.517 4.404 1.066 6.218z"
            fill={i < 4 ? "#f59e0b" : "#cbd5e1"}
            transform={`translate(${i * 22}, 0) scale(0.8)`}
          />
        ))}
      </g>
      
      {/* Floating Paper Airplane */}
      <g transform="translate(170, 20)">
        <path
          d="M0,40 L30,10 L18,50 L10,43 L6,50 L5,42 Z"
          fill="url(#purpleGrad)"
        />
        <path
          d="M30,10 L10,43 L18,50 Z"
          fill="#4a2fa2"
          opacity="0.2"
        />
        {/* Flight dash lines */}
        <path
          d="M -60,65 C -30,60 -10,50 0,40"
          stroke="var(--primary-light)"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  </div>
);

function StarRatingInput({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  error?: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            id={`star-${star}`}
            className={`star ${(hovered || value) >= star ? 'active' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </span>
        ))}
        {value > 0 && (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '8px' }}>
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
          </span>
        )}
      </div>
      {error && <p className="form-error" style={{ marginTop: '6px' }}>⚠ {error}</p>}
    </div>
  );
}

export default function FeedbackPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 0 as never, comment: '' },
  });

  const commentValue = watch('comment', '');

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(console.error);
  }, []);

  const handleAboutClick = () => {
    Swal.fire({
      title: 'About Acowale',
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #475569; font-family: 'Inter', sans-serif;">
          <p style="margin-bottom: 12px;"><strong>Acowale</strong> is committed to building outstanding, high-fidelity customer experiences.</p>
          <p style="margin-bottom: 12px;">This <strong>Feedbacker App</strong> allows you to directly reach our development team. We review every single comment to improve our platform features and design quality.</p>
          <p>Thank you for helping us build better products! 💜</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#5c3ec2',
      confirmButtonText: 'Understood',
    });
  };

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    try {
      await feedbackApi.submit(data);
      
      // Clear form immediately so user does not see old data while popup is active
      reset({
        submitterName: '',
        submitterEmail: '',
        categoryId: '',
        rating: 0 as never,
        comment: '',
      });

      await Swal.fire({
        title: '🎉 Thank You!',
        html: `
          <p style="color: #475569; margin-top: 8px; font-family: 'Inter', sans-serif;">
            Your feedback has been submitted successfully.<br/>
            We appreciate you taking the time to share your thoughts!
          </p>
        `,
        icon: 'success',
        confirmButtonColor: '#5c3ec2',
        confirmButtonText: 'Submit Another',
        timer: 4000,
        timerProgressBar: true,
      });
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = axiosErr?.response?.data?.errors?.join('<br>') ||
        axiosErr?.response?.data?.message ||
        'Something went wrong. Please try again.';
      await Swal.fire({
        title: 'Submission Failed',
        html: `<p style="color: #ef4444; font-family: 'Inter', sans-serif;">${msg}</p>`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-layout">
      {/* Nav */}
      <nav className="public-nav">
        <div className="public-brand">
          <Logo />
          <span>Acowale Feedback</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleAboutClick} className="btn btn-secondary btn-sm">
            About Acowale
          </button>
          <Link to="/login" id="admin-login-link" className="btn btn-primary btn-sm">
            Admin Login →
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div className="feedback-page">
        <div className="feedback-form-wrapper slide-up">
          <FloatingIllustration />

          <div className="feedback-hero">
            <h1>Share Your Feedback</h1>
            <p>Your opinion matters to us. Help us improve by sharing your thoughts.</p>
          </div>

          <div className="feedback-form-card">
            <form id="feedback-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Name */}
              <div className="form-group">
                <label htmlFor="submitterName" className="form-label">Your Name</label>
                <div className="form-control-wrapper">
                  <UserIcon />
                  <input
                    id="submitterName"
                    type="text"
                    className={`form-control ${errors.submitterName ? 'is-invalid' : ''}`}
                    placeholder="John Doe"
                    {...register('submitterName')}
                  />
                </div>
                {errors.submitterName && (
                  <p className="form-error">⚠ {errors.submitterName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="submitterEmail" className="form-label">Email Address</label>
                <div className="form-control-wrapper">
                  <MailIcon />
                  <input
                    id="submitterEmail"
                    type="email"
                    className={`form-control ${errors.submitterEmail ? 'is-invalid' : ''}`}
                    placeholder="john@example.com"
                    {...register('submitterEmail')}
                  />
                </div>
                {errors.submitterEmail && (
                  <p className="form-error">⚠ {errors.submitterEmail.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="categoryId" className="form-label">Category</label>
                <select
                  id="categoryId"
                  className={`form-control ${errors.categoryId ? 'is-invalid' : ''}`}
                  {...register('categoryId')}
                  defaultValue=""
                >
                  <option value="" disabled>Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="form-error">⚠ {errors.categoryId.message}</p>
                )}
              </div>

              {/* Rating */}
              <div className="form-group">
                <label className="form-label">Rating</label>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <StarRatingInput
                      value={field.value as unknown as number}
                      onChange={field.onChange}
                      error={errors.rating?.message}
                    />
                  )}
                />
              </div>

              {/* Comment */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                  <label htmlFor="comment" className="form-label" style={{ flexGrow: 1 }}>
                    Your Comment
                  </label>
                  <span className="char-counter">
                    {commentValue.length} / 1000
                  </span>
                </div>
                <textarea
                  id="comment"
                  className={`form-control ${errors.comment ? 'is-invalid' : ''}`}
                  placeholder="Tell us about your experience..."
                  rows={5}
                  {...register('comment')}
                />
                {errors.comment && (
                  <p className="form-error">⚠ {errors.comment.message}</p>
                )}
              </div>

              <button
                id="submit-feedback-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
                    Submitting...
                  </>
                ) : (
                  '🚀 Submit Feedback'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="feedback-footer">
        Thank you for helping us improve! 💜
      </div>
    </div>
  );
}
