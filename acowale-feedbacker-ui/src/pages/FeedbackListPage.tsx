import { useEffect, useState, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { feedbackApi } from '../api/feedback.api';
import { categoriesApi } from '../api/categories.api';
import type { Feedback, FeedbackStatus, Category } from '../types/feedback.types';

const STATUS_OPTIONS: FeedbackStatus[] = ['pending', 'reviewed', 'archived'];
const LIMIT = 10;

interface FilterState {
  search?: string;
  categoryId?: string;
  status?: FeedbackStatus | '';
  rating?: number | '';
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export default function FeedbackListPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Cursor history stack for "Previous" navigation
  const cursorStack = useRef<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const fetchFeedback = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const params = {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.status ? { status: filters.status as FeedbackStatus } : {}),
        ...(filters.rating ? { rating: Number(filters.rating) } : {}),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: LIMIT,
        ...(cursor ? { cursor } : {}),
      };
      const result = await feedbackApi.getAll(params);
      setFeedbacks(result.data);
      setHasNextPage(result.meta.hasNextPage);
      setNextCursor(result.meta.nextCursor);
      if (result.meta.total !== undefined) setTotal(result.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // When filters change, reset cursor stack and go back to page 1
  useEffect(() => {
    cursorStack.current = [];
    setCurrentCursor(undefined);
    fetchFeedback(undefined);
  }, [fetchFeedback]);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(console.error);
  }, []);

  const goToNextPage = () => {
    if (!nextCursor) return;
    cursorStack.current.push(currentCursor ?? ''); // push current (or '' for page 1)
    setCurrentCursor(nextCursor);
    fetchFeedback(nextCursor);
  };

  const goToPrevPage = () => {
    if (cursorStack.current.length === 0) return;
    const prev = cursorStack.current.pop()!;
    const cursor = prev === '' ? undefined : prev;
    setCurrentCursor(cursor);
    fetchFeedback(cursor);
  };

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      await feedbackApi.updateStatus(id, status);
      await Swal.fire({
        title: 'Status Updated',
        text: `Feedback marked as "${status}"`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchFeedback(currentCursor);
    } catch {
      Swal.fire({
        title: 'Update Failed',
        text: 'Could not update status. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const timer = setTimeout(() => handleFilterChange('search', value), 400);
    return () => clearTimeout(timer);
  };

  const isFirstPage = cursorStack.current.length === 0;
  const pageNumber = cursorStack.current.length + 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback Management</h1>
          <p className="page-subtitle">{total} total submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            type="text"
            className="form-control search-input"
            placeholder="Search name, email, or comment..."
            onChange={handleSearchChange}
          />
        </div>

        <select
          id="category-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          onChange={(e) => handleFilterChange('categoryId', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <select
          id="status-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: '130px' }}
          onChange={(e) => handleFilterChange('status', e.target.value as FeedbackStatus)}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          id="rating-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: '120px' }}
          onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">All Ratings</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {'★'.repeat(r)} {r} Star{r > 1 ? 's' : ''}
            </option>
          ))}
        </select>

        <select
          id="sort-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: '150px' }}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(':');
            setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' }));
          }}
        >
          <option value="createdAt:DESC">Newest First</option>
          <option value="createdAt:ASC">Oldest First</option>
          <option value="rating:DESC">Highest Rating</option>
          <option value="rating:ASC">Lowest Rating</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-wrapper">
              <div className="spinner" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No feedback found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Submitter</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr key={fb.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{fb.submitterName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {fb.submitterEmail}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {fb.category?.icon} {fb.category?.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#f59e0b', fontWeight: 700, letterSpacing: '-1px' }}>
                        {'★'.repeat(fb.rating)}
                        <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - fb.rating)}</span>
                      </span>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <span
                        title={fb.comment}
                        style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                      >
                        {fb.comment.length > 70 ? `${fb.comment.slice(0, 70)}…` : fb.comment}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${fb.status}`}>{fb.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <select
                        id={`status-select-${fb.id}`}
                        className="form-control"
                        style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                        value={fb.status}
                        onChange={(e) =>
                          handleStatusUpdate(fb.id, e.target.value as FeedbackStatus)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cursor-based Pagination Controls */}
        {(hasNextPage || !isFirstPage) && (
          <div className="pagination">
            <button
              id="prev-page-btn"
              className="page-btn"
              onClick={goToPrevPage}
              disabled={isFirstPage || loading}
            >
              ‹ Previous
            </button>

            <span style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              Page <strong>{pageNumber}</strong>
            </span>

            <button
              id="next-page-btn"
              className="page-btn"
              onClick={goToNextPage}
              disabled={!hasNextPage || loading}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
