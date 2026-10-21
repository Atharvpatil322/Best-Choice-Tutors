/**
 * Admin Blog Manager
 * Admin-only CRUD for blog posts. List, create, edit, publish, delete.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Edit3, Trash2, ExternalLink,
  Eye, EyeOff, Search, X, Check, Loader2, ImagePlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentRole, getStoredUser } from '@/services/authService';
import {
  getAllBlogsAdmin,
  getBlogByIdAdmin,
  createBlogAdmin,
  updateBlogAdmin,
  deleteBlogAdmin,
  uploadBlogImageAdmin,
} from '@/services/blogService';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { isHtmlContent, markdownToHtml } from '@/utils/blogContent';
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
    seoTitle: '',
    metaDescription: '',
    slug: '',
  });
  const [saving, setSaving] = useState(false);
  // The post as loaded, to tell whether its URL handle changed.
  const [loadedPost, setLoadedPost] = useState(null);
  const [createRedirect, setCreateRedirect] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  // Local preview of a newly picked image, so the admin sees what will be
  // uploaded before saving. Revoked when replaced so the blob is not leaked.
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  // The post whose full record is being fetched for editing, if any.
  const [loadingEditId, setLoadingEditId] = useState(null);
  // Only the most recent Edit click may fill the form: a slower response for
  // an earlier click must not overwrite the post the admin actually opened.
  const editRequestRef = useRef(0);
  const imageInputRef = useRef(null);
  // The form as it was when opened, to tell whether the admin has changed it.
  const formSnapshotRef = useRef('');

  const isFormDirty = () =>
    showForm && (Boolean(imageFile) || JSON.stringify(formData) !== formSnapshotRef.current);

  /** Ask before throwing away edits the admin has not saved. */
  const confirmDiscard = () =>
    !isFormDirty() || window.confirm('You have unsaved changes. Discard them?');

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

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
    const emptyForm = {
      title: '',
      excerpt: '',
      content: '',
      author: user?.name || 'Best Choice Tutors',
      category: 'General',
      imageUrl: '',
      imageAlt: '',
      status: 'DRAFT',
      seoTitle: '',
      metaDescription: '',
      slug: '',
    };
    setLoadedPost(null);
    setCreateRedirect(true);
    setFormData(emptyForm);
    formSnapshotRef.current = JSON.stringify(emptyForm);
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
    // Abandon any edit still loading, so it cannot reopen the form.
    editRequestRef.current += 1;
    setLoadingEditId(null);
  };

  /**
   * Open a post for editing.
   *
   * The list endpoint leaves out the post body to keep the list light, so the
   * form is filled from the full record instead of the list row. Filling it
   * from the row opened every post with an empty editor, and saving then
   * failed with "content is required". The form only opens once the full
   * record has arrived, so nothing can be saved half-loaded.
   */
  const handleEdit = async (blog) => {
    if (!confirmDiscard()) return;
    const requestId = editRequestRef.current + 1;
    editRequestRef.current = requestId;
    // Close whatever form is open while the post loads, so nothing typed in
    // the meantime can be silently replaced when the response arrives.
    setShowForm(false);
    setLoadingEditId(blog._id);
    try {
      const { blog: full } = await getBlogByIdAdmin(blog._id);
      if (editRequestRef.current !== requestId) return;
      if (!full) throw new Error('Blog not found');

      const rawContent = full.content || '';
      const loaded = {
        title: full.title || '',
        excerpt: full.excerpt || '',
        // Older posts are markdown-ish text; the editor needs HTML or it
        // flattens them into a single paragraph.
        content: isHtmlContent(rawContent) ? rawContent : markdownToHtml(rawContent),
        author: full.author || 'Best Choice Tutors',
        category: full.category || 'General',
        imageUrl: full.imageUrl || '',
        imageAlt: full.imageAlt || '',
        status: full.status || 'DRAFT',
        seoTitle: full.seoTitle || '',
        metaDescription: full.metaDescription || '',
        slug: full.slug || '',
      };
      setFormData(loaded);
      setLoadedPost({ slug: full.slug, status: full.status });
      setCreateRedirect(true);
      formSnapshotRef.current = JSON.stringify(loaded);
      setImageFile(null);
      setEditingId(full._id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (editRequestRef.current !== requestId) return;
      toast.error(err.message || 'Failed to load blog');
    } finally {
      if (editRequestRef.current === requestId) setLoadingEditId(null);
    }
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
      // The URL handle is only sent when it was changed; a new post gets its
      // handle from the title on the server.
      const { slug, ...fields } = formData;
      const payload = { ...fields, imageUrl };

      if (editingId) {
        const slugChanged = loadedPost && slug && slug !== loadedPost.slug;
        if (slugChanged) Object.assign(payload, { slug, createRedirect });
        const data = await updateBlogAdmin(editingId, payload);
        toast.success(
          data.redirect
            ? `Saved. ${data.redirect.sourcePath} now redirects to ${data.redirect.targetUrl}`
            : data.message || 'Blog updated',
        );
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
        <Button
          onClick={() => {
            if (!confirmDiscard()) return;
            resetForm();
            setShowForm(true);
          }}
          className="gap-2"
        >
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
                  onChange={(html) => setFormData((current) => ({ ...current, content: html }))}
                  placeholder="Write your blog content here..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Paste from Word, Google Docs or a web page and tables, headings and
                  lists are kept.
                </p>
              </div>

              <div role="group" aria-labelledby="blog-featured-image-label">
                <span id="blog-featured-image-label" className="block text-sm font-medium text-slate-700 mb-1">
                  Featured Image
                </span>
                {/* The file input cannot show an image that is already saved,
                    which made editing look like it required a new upload. The
                    saved or newly picked image is shown instead, and the input
                    is only opened when the admin chooses to replace it. */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] || null);
                    // Clear the input so picking the same file again still fires.
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                {imagePreviewUrl || formData.imageUrl ? (
                  <div className="flex flex-wrap items-start gap-4">
                    <img
                      src={imagePreviewUrl || formData.imageUrl}
                      alt={formData.imageAlt || 'Featured image'}
                      className="h-32 w-56 rounded-lg border border-slate-200 object-cover bg-slate-50"
                    />
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-slate-600" aria-live="polite">
                        {imageFile ? `New image: ${imageFile.name} (uploads on save)` : 'Current image'}
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                          className="gap-2"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Replace image
                        </Button>
                        {imageFile && formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-800 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD1C5]"
                          >
                            Keep current image
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, imageUrl: '', imageAlt: '' });
                            setImageFile(null);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FD1C5]"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="gap-2"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload image
                  </Button>
                )}
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

              {/* Search engine listing: page title, description and, for an
                  existing post, the URL handle. */}
              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-[#1A365D]">Search engine listing</p>
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                    SEO title
                    <span className={`text-xs ${formData.seoTitle.length > 70 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {formData.seoTitle.length} of 70
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData((current) => ({ ...current, seoTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                    placeholder={`${formData.title || 'Post title'} | Best Choice Tutors`}
                  />
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                    Meta description
                    <span className={`text-xs ${formData.metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {formData.metaDescription.length} of 160
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData((current) => ({ ...current, metaDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
                    placeholder={formData.excerpt || 'Blank uses the excerpt'}
                  />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="blog-url-handle">
                      URL handle
                    </label>
                    <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#4FD1C5]">
                      <span className="px-3 flex items-center bg-slate-50 text-sm text-slate-500 whitespace-nowrap">
                        /blog/
                      </span>
                      <input
                        id="blog-url-handle"
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                          }))
                        }
                        onBlur={() =>
                          setFormData((current) => ({
                            ...current,
                            slug: current.slug.replace(/-+/g, '-').replace(/^-|-$/g, ''),
                          }))
                        }
                        className="flex-1 min-w-0 px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Changing the title no longer changes the address; edit it here when you mean to.
                    </p>
                    {loadedPost?.status === 'PUBLISHED' && formData.slug && formData.slug !== loadedPost.slug && (
                      <label className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={createRedirect}
                          onChange={(e) => setCreateRedirect(e.target.checked)}
                        />
                        <span>
                          Create a URL redirect from{' '}
                          <span className="font-mono text-xs">/blog/{loadedPost.slug}</span> to{' '}
                          <span className="font-mono text-xs">/blog/{formData.slug}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            Keeps links and search results pointing at the old address working.
                          </span>
                        </span>
                      </label>
                    )}
                  </div>
                )}
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
                      disabled={loadingEditId !== null || saving}
                      title="Edit"
                    >
                      {loadingEditId === blog._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit3 className="h-4 w-4" />
                      )}
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

