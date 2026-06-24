import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { categoriesApi } from '../api/categories.api';
import type { Category } from '../types/feedback.types';

const EMOJI_PRESETS = ['🐛', '💡', '💳', '🔒', '🎨', '🚀', '💬', '📦', '📈', '⚙️', '🔌', '👥', '❓', '🔧', '📢', '🛡️'];
const COLOR_PRESETS = ['#5c3ec2', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#ec4899', '#14b8a6', '#06b6d4', '#84cc16'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('🐛');
  const [color, setColor] = useState('#5c3ec2');
  const [customSlugMode, setCustomSlugMode] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Failed to fetch categories list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!customSlugMode && !editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setCustomSlugMode(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('🐛');
    setColor('#5c3ec2');
    setCustomSlugMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setColor(cat.color);
    setCustomSlugMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      Swal.fire('Error', 'Name and Slug fields are required.', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name, slug, icon, color });
        Swal.fire({
          title: 'Success',
          text: 'Category updated successfully!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await categoriesApi.create({ name, slug, icon, color });
        Swal.fire({
          title: 'Success',
          text: 'Category created successfully!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Action failed.';
      Swal.fire('Failed', msg, 'error');
    }
  };

  const handleDelete = async (cat: Category) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete category "${cat.icon} ${cat.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
    });

    if (result.isConfirmed) {
      try {
        await categoriesApi.delete(cat.id);
        Swal.fire({
          title: 'Deleted!',
          text: 'Category has been deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        loadCategories();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to delete category.';
        Swal.fire('Constraint Error', msg, 'error');
      }
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="page-container">
        <div className="spinner-wrapper">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800 }}>Manage Categories</h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Add, update, and manage categories shown in the public feedback submission forms.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ gap: '6px' }}>
          <span>➕</span> Add Category
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Icon</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Color Badge</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No categories found. Click 'Add Category' to get started.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span style={{ fontSize: '24px', display: 'inline-block', padding: '4px' }}>
                        {cat.icon}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{cat.name}</div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', color: 'var(--primary)' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: cat.color,
                            display: 'inline-block',
                            border: '1px solid rgba(0,0,0,0.08)'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {cat.color}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn btn-secondary btn-sm"
                          style={{ minWidth: '70px', padding: '6px 10px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', minWidth: '70px', padding: '6px 10px' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">
                {editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}
              </span>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cat-name" className="form-label">Category Name</label>
                  <input
                    id="cat-name"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Technical Bug, Billing Inquiry"
                    className="form-control"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cat-slug" className="form-label">Slug</label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g. technical-bug"
                    className="form-control"
                    required
                  />
                </div>

                {/* Icon Emojis selection */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Icon Symbol / Emoji</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    {EMOJI_PRESETS.map((emojiPreset) => (
                      <button
                        key={emojiPreset}
                        type="button"
                        onClick={() => setIcon(emojiPreset)}
                        style={{
                          fontSize: '20px',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: icon === emojiPreset ? '2px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: '8px',
                          background: icon === emojiPreset ? 'var(--bg-card)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        {emojiPreset}
                      </button>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Emoji:</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="form-control"
                        style={{ width: '60px', padding: '6px', fontSize: '14px', textAlign: 'center', height: 'auto' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Color Theme</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {COLOR_PRESETS.map((colorPreset) => (
                        <button
                          key={colorPreset}
                          type="button"
                          onClick={() => setColor(colorPreset)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: colorPreset,
                            border: color === colorPreset ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          title={colorPreset}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Color:</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{
                          border: 'none',
                          width: '40px',
                          height: '28px',
                          padding: 0,
                          background: 'none',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="form-control"
                        style={{ width: '100px', padding: '6px', fontSize: '13px', fontFamily: 'monospace', height: 'auto' }}
                      />
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
