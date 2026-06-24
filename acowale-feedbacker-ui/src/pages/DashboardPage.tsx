import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts';
import Swal from 'sweetalert2';
import { analyticsApi } from '../api/analytics.api';
import { feedbackApi } from '../api/feedback.api';
import type { AnalyticsSummary } from '../types/analytics.types';
import type { Feedback } from '../types/feedback.types';
import './DashboardPage.css';

const STATUS_COLORS: Record<string, string> = {
  pending: '#ef4444',
  reviewed: '#10b981',
  archived: '#64748b',
};

const WIDGETS_CONFIG: Record<string, { title: string; desc: string; icon: string }> = {
  'trend-chart': { title: '📈 Submissions (Last 30 Days)', desc: 'Area chart showing feedback volume trends.', icon: '📈' },
  'category-dist': { title: '🗂 Category Distribution', desc: 'Side-by-side donut chart with percentage breakdown.', icon: '🗂' },
  'rating-dist': { title: '⭐ Rating Distribution', desc: 'Bar chart of rating counts from 1 to 5.', icon: '⭐' },
  'status-dist': { title: '📋 Status Overview', desc: 'Pie chart showing review resolution states.', icon: '📋' },
  'recent-submissions': { title: '🕐 Recent Submissions', desc: 'Detailed table of latest feedback records.', icon: '🕐' },
};

function StatsCard({
  icon,
  label,
  value,
  color,
  trend,
  trendUp,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className={`stat-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{label}</p>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '4px 0 0 0' }}>{payload[0].value} submissions</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Widget customizer states
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) return JSON.parse(saved);
    return ['trend-chart', 'category-dist', 'rating-dist', 'recent-submissions'];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('');

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await feedbackApi.updateStatus(id, status as any);
      await Swal.fire({
        title: 'Status Updated',
        text: `Feedback marked as "${status}"`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      const updated = await analyticsApi.getSummary();
      setSummary(updated);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not update status. Please try again.';
      Swal.fire('Error', msg, 'error');
    }
  };

  useEffect(() => {
    analyticsApi
      .getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveWidget = (id: string) => {
    const updated = activeWidgets.filter((w) => w !== id);
    setActiveWidgets(updated);
    localStorage.setItem('dashboard_widgets', JSON.stringify(updated));
  };

  const handleAddWidget = () => {
    if (!selectedWidgetId) return;
    const updated = [...activeWidgets, selectedWidgetId];
    setActiveWidgets(updated);
    localStorage.setItem('dashboard_widgets', JSON.stringify(updated));
    setSelectedWidgetId('');
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-wrapper">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Failed to load analytics</h3>
          <p>Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  const pendingCount = summary.statusDistribution.find((s) => s.status === 'pending')?.count ?? 0;
  const reviewedCount = summary.statusDistribution.find((s) => s.status === 'reviewed')?.count ?? 0;
  const totalCategoryCount = summary.categoryDistribution.reduce((acc, c) => acc + c.count, 0);

  // Find remaining widgets that can be added
  const availableWidgets = Object.keys(WIDGETS_CONFIG).filter(
    (id) => !activeWidgets.includes(id)
  );



  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800 }}>Analytics Overview</h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Monitor recent reviews, feedback trends, and categories.
          </p>
        </div>
        <button
          onClick={() => {
            if (availableWidgets.length > 0) {
              setSelectedWidgetId(availableWidgets[0]);
            }
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ gap: '6px' }}
        >
          <span>➕</span> Add Widget
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard icon="💬" label="Total Feedback" value={summary.totalFeedback} color="var(--primary)" trend="12.4% vs last 30d" trendUp={true} />
        <StatsCard icon="⭐" label="Average Rating" value={`${summary.avgRating} / 5`} color="#f59e0b" trend="4.2% vs last 30d" trendUp={true} />
        <StatsCard icon="⏳" label="Pending Review" value={pendingCount} color="#ef4444" trend="15.3% vs yesterday" trendUp={false} />
        <StatsCard icon="✅" label="Resolved Cases" value={reviewedCount} color="#10b981" trend="8.6% vs last week" trendUp={true} />
      </div>

      {/* Customizable Dashboard Widgets Area */}
      {activeWidgets.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '50px 20px' }}>
          <div className="empty-state-icon">📊</div>
          <h3>Dashboard is Empty</h3>
          <p>Remove all active widgets? Click 'Add Widget' to customize your view.</p>
        </div>
      ) : (
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
          {activeWidgets.map((widgetId) => {
            const config = WIDGETS_CONFIG[widgetId];
            if (!config) return null;

            // Render matching widget
            return (
              <div key={widgetId} className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '330px', justifyContent: 'space-between', position: 'relative' }}>
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <h3 className="chart-title">{config.title}</h3>
                  <button
                    onClick={() => handleRemoveWidget(widgetId)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove widget"
                  >
                    ×
                  </button>
                </div>

                <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
                  {widgetId === 'trend-chart' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.trendData} margin={{ left: -20, right: 10, bottom: 0, top: 10 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          tickFormatter={(v: string) => v.slice(5)}
                          stroke="var(--border)"
                        />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {widgetId === 'category-dist' && (
                    <div className="donut-chart-container" style={{ height: '100%' }}>
                      <div className="donut-chart-wrapper" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.categoryDistribution}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              innerRadius={45}
                              paddingAngle={3}
                            >
                              {summary.categoryDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--text-primary)',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="donut-legend" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                        {summary.categoryDistribution.map((entry) => {
                          const pct = totalCategoryCount > 0 ? ((entry.count / totalCategoryCount) * 100).toFixed(0) : 0;
                          return (
                            <div className="legend-item" key={entry.name}>
                              <div className="legend-left">
                                <span className="legend-dot" style={{ backgroundColor: entry.color || 'var(--primary)' }} />
                                <span className="legend-name">{entry.name}</span>
                              </div>
                              <span className="legend-right">
                                {entry.count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {widgetId === 'rating-dist' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.ratingDistribution} margin={{ left: -20, right: 10, bottom: 0, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="rating" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} stroke="var(--border)" />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {widgetId === 'status-dist' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.statusDistribution}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {summary.statusDistribution.map((entry, index) => (
                            <Cell key={`status-${index}`} fill={STATUS_COLORS[entry.status] || 'var(--primary)'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'capitalize' }}>{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {widgetId === 'recent-submissions' && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ minWidth: '400px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '8px 12px', fontSize: '11px' }}>User</th>
                            <th style={{ padding: '8px 12px', fontSize: '11px' }}>Rating</th>
                            <th style={{ padding: '8px 12px', fontSize: '11px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentFeedback.slice(0, 4).map((fb: Feedback) => (
                            <tr key={fb.id}>
                              <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                                <div style={{ fontWeight: 600 }}>{fb.submitterName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{fb.submitterEmail}</div>
                              </td>
                              <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                  {'★'.repeat(fb.rating)}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', fontSize: '11px' }}>
                                <select
                                  value={fb.status}
                                  onChange={(e) => handleStatusUpdate(fb.id, e.target.value)}
                                  className="form-control"
                                  style={{
                                    width: 'auto',
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    height: 'auto',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-base)',
                                    border: '1px solid var(--border)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="reviewed">Reviewed</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Widget Option Manager Section (Always displays recent full table below the charts) */}
      <div className="chart-card" style={{ marginTop: '28px' }}>
        <h3 className="chart-title" style={{ marginBottom: '16px' }}>🕐 Complete Submissions History</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentFeedback.map((fb: Feedback) => (
                <tr key={fb.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fb.submitterName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fb.submitterEmail}</div>
                  </td>
                  <td>
                    <span>
                      {fb.category?.icon} {fb.category?.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {fb.comment.length > 70 ? `${fb.comment.slice(0, 70)}...` : fb.comment}
                    </span>
                  </td>
                  <td>
                    <select
                      value={fb.status}
                      onChange={(e) => handleStatusUpdate(fb.id, e.target.value)}
                      className="form-control"
                      style={{
                        width: 'auto',
                        padding: '6px 12px',
                        fontSize: '13px',
                        height: 'auto',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Widget Selection Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Customize Dashboard Layout</span>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {availableWidgets.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                  All available widgets are already displayed on your dashboard.
                </p>
              ) : (
                <div className="widget-options">
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Select a widget to append to your active console dashboard overview.
                  </p>
                  {availableWidgets.map((id) => {
                    const opt = WIDGETS_CONFIG[id];
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedWidgetId(id)}
                        className={`widget-option-card ${selectedWidgetId === id ? 'selected' : ''}`}
                      >
                        <span className="widget-option-icon">{opt.icon}</span>
                        <div className="widget-option-details">
                          <div className="widget-option-title">{opt.title}</div>
                          <div className="widget-option-desc">{opt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddWidget}
                disabled={availableWidgets.length === 0 || !selectedWidgetId}
              >
                Add Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
