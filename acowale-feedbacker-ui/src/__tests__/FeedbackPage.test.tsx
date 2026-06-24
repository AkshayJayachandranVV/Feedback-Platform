import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeedbackPage from '../pages/FeedbackPage';
import * as categoriesApi from '../api/categories.api';

// Mock the API modules
vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
  },
}));

vi.mock('../api/feedback.api', () => ({
  feedbackApi: {
    submit: vi.fn(),
  },
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

const mockCategories = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bug Report', slug: 'bug-report', color: '#ef4444', icon: '🐛' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Feature Request', slug: 'feature-request', color: '#f59e0b', icon: '💡' },
];

const renderWithRouter = (component: React.ReactElement) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('FeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.categoriesApi.getAll).mockResolvedValue(mockCategories);
  });

  it('renders the feedback form with all fields', async () => {
    renderWithRouter(<FeedbackPage />);
    await waitFor(() => {
      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderWithRouter(<FeedbackPage />);
    await waitFor(() => screen.getByText('Share Your Feedback'));

    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('loads and displays categories in the select dropdown', async () => {
    renderWithRouter(<FeedbackPage />);
    await waitFor(() => {
      expect(screen.getByText('🐛 Bug Report')).toBeInTheDocument();
      expect(screen.getByText('💡 Feature Request')).toBeInTheDocument();
    });
  });
});
