/**
 * Admin Blog Manager
 * Admin-only CRUD for blog posts. List, create, edit, publish, delete.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Edit3, Trash2, ExternalLink, 
  Eye, EyeOff, Search, X, Check, Loader2 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getAllBlogsAdmin,
  createBlogAdmin,
  updateBlogAdmin,
  deleteBlogAdmin,
  uploadBlogImageAdmin,
} from '@/services/blogService';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';
import '../../styles/Profile.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CATEGORIES = ['Student', 'Parents', 'Tutor', 'General'];

function AdminBlogManager() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isAdmin = typeof role === 'string' && role === 'Admin';
  const user = getStoredUser();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'General',
    imageUrl: '',
    imageAlt: '',
    status: 'DRAFT',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const fetchBlogs = async (page = 1) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const data = await getAllBlogsAdmin(params);
      setBlogs(data.blogs || []);
      setPagination(data.pagination || { page: 1, totalPages: 0, totalCount: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    fetchBlogs();
  }, [isAdmin, statusFilter]);

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: user?.name || 'Best Choice Tutors',
      category: 'General',
      imageUrl: '',
      imageAlt: '',
      status: 'DRAFT',
    });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      author: blog.author || 'Best Choice Tutors',
      category: blog.category || 'General',
      imageUrl: blog.imageUrl || '',
      imageAlt: blog.imageAlt || '',
      status: blog.status || 'DRAFT',
    });
    setImageFile(null);
    setEditingId(blog._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploaded = await uploadBlogImageAdmin(imageFile);
        imageUrl = uploaded.imageUrl;
      }
      const payload = { ...formData, imageUrl };

      if (editingId) {
        const data = await updateBlogAdmin(editingId, payload);
        toast.success(data.message || 'Blog updated');
      } else {
        const data = await createBlogAdmin(payload);
        toast.success(data.message || 'Blog created');
      }
      resetForm();
      fetchBlogs();
    } catch (err) {
      toast.error(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    setDeletingId(blog._id);
    try {
      await deleteBlogAdmin(blog._id);
      toast.success('Blog deleted');
      fetchBlogs();
    } catch (err) {
      toast.error(err.message || 'Failed to delete blog');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishToggle = async (blog) => {
    const newStatus = blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setSaving(true);
    try {
      await updateBlogAdmin(blog._id, { status: newStatus });
      toast.success(newStatus === 'PUBLISHED' ? 'Blog published!' : 'Blog set to draft');
      fetchBlogs();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (!getStoredUser()) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-destructive font-medium">Access denied. Admin only.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate(-1)} className="rounded-lg">Go back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="profile-page-content">
      <div className="profile-intro">
        <h1 className="text-2xl font-bold text-[#1A365D] flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Blog Manager
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create, edit, and manage blog posts.</p>
      </div>

      {error && (
        <Card className="mt-6 rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'PUBLISHED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('DRAFT')}
          >
            Drafts
          </Button>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Blog Post
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mt-6 rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#1A365D]">
              {editingId ? 'Edit Blog Post' : 'Create New Blog Post'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                  placeholder="Enter blog title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt (short description)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                  rows={2}
                  placeholder="Brief summary of the blog post"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Write your blog content here..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Paste from Word, Google Docs or a web page and tables, headings and
                  lists are kept.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Featured Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {imageFile && (
                    <span className="text-xs font-medium text-slate-600">
                      Selected: {imageFile.name}
                    </span>
                  )}
                  {formData.imageUrl && !imageFile && (
                    <a
                      href={formData.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#1A365D] underline underline-offset-2"
                    >
                      View current image
                    </a>
                  )}
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, imageUrl: '', imageAlt: '' });
                        setImageFile(null);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  value={formData.imageAlt}
                  onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                  maxLength={250}
                  placeholder="Describe the image, e.g. Student revising GCSE maths with a tutor"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Read aloud by screen readers and used by search engines to understand the image.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Update Blog' : 'Create Blog'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blog List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#4FD1C5]" />
            <p className="mt-2 text-sm text-slate-500">Loading blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No blog posts yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first blog post to get started.</p>
            </CardContent>
          </Card>
        ) : (
          blogs.map((blog) => (
            <Card key={blog._id} className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        blog.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {blog.status}
                      </span>
                      <span className="text-xs text-slate-400">{blog.category}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{formatDate(blog.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#1A365D] truncate">{blog.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Slug: /blog/{blog.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePublishToggle(blog)}
                      disabled={saving}
                      title={blog.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    >
                      {blog.status === 'PUBLISHED' ? (
                        <EyeOff className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    {blog.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                        title="View on site"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(blog)}
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(blog)}
                      disabled={deletingId === blog._id}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      {deletingId === blog._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBlogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBlogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBlogManager;

