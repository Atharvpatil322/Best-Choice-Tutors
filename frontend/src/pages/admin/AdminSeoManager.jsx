import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createSeoConfig, deleteSeoConfig, getSeoConfigs, updateSeoConfig } from '@/services/seoService';
import { toast } from 'sonner';

const DUMMY_SEO = {
  path: '/gcse-maths-tutors',
  title: 'GCSE Maths Tutors Online | Best Choice Tutors',
  description:
    'Find verified GCSE maths tutors for online and in-person lessons. Compare profiles, book flexible sessions, and learn with confidence.',
  keywords: 'GCSE maths tutors, online maths tutor, private maths lessons',
  canonicalUrl: 'https://bestchoicetutors.com/gcse-maths-tutors',
  ogDescription:
    'Compare trusted GCSE maths tutors and book lessons that fit your schedule.',
};

function formatDate(dateValue) {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emptyForm() {
  return {
    id: null,
    path: '',
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    ogDescription: '',
    ogImage: '',
    noindex: false,
  };
}

/**
 * Recommended lengths. Google truncates beyond roughly these, and something far
 * under them usually means the field was left half-written.
 */
const LENGTH_GUIDES = {
  title: { min: 20, max: 60 },
  description: { min: 70, max: 155 },
};

/**
 * Character count with a plain-language warning when a field is too long or
 * too short. Advisory only - nothing here blocks a save, because an editor may
 * have a good reason to go over.
 *
 * @param {string} value - Current field value.
 * @param {'title'|'description'} field - Which guide to apply.
 */
function LengthHint({ value, field }) {
  const { min, max } = LENGTH_GUIDES[field];
  const length = (value || '').trim().length;
  let tone = 'text-slate-400';
  let note = '';
  if (length === 0) {
    note = 'empty - the page falls back to the site default';
  } else if (length > max) {
    tone = 'text-amber-600';
    note = `over ${max}; search results will cut it off`;
  } else if (length < min) {
    tone = 'text-amber-600';
    note = `under ${min}; likely too short to be useful`;
  } else {
    tone = 'text-green-600';
    note = 'good length';
  }
  return (
    <p className={`text-xs mt-1 ${tone}`}>
      {length}/{max} characters - {note}
    </p>
  );
}

/**
 * Warn when another saved page already uses this exact title or description.
 * Duplicate metadata across pages competes with itself in search results.
 *
 * @param {Array} configs - Every saved page config.
 * @param {Object} form - The record being edited.
 */
function DuplicateWarning({ configs, form }) {
  const clashes = [];
  const same = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();
  for (const config of configs) {
    if (config._id === form.id) continue;
    if (same(config.title, form.title)) clashes.push(`title matches ${config.path}`);
    if (same(config.description, form.description)) clashes.push(`description matches ${config.path}`);
  }
  if (clashes.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      <span className="font-medium">Duplicate metadata: </span>
      {clashes.join('; ')}. Pages sharing a title or description compete with each other in
      search results.
    </div>
  );
}

export default function AdminSeoManager() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getSeoConfigs()
      .then((data) => setConfigs(data.configs || []))
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load SEO configurations');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedConfig = useMemo(
    () => configs.find((item) => item._id === form.id) || null,
    [configs, form.id]
  );

  useEffect(() => {
    if (selectedConfig) {
      setForm({
        id: selectedConfig._id,
        path: selectedConfig.path,
        title: selectedConfig.title || '',
        description: selectedConfig.description || '',
        keywords: selectedConfig.keywords || '',
        canonicalUrl: selectedConfig.canonicalUrl || '',
        ogDescription: selectedConfig.ogDescription || '',
        ogImage: selectedConfig.ogImage || '',
        noindex: Boolean(selectedConfig.noindex),
      });
    }
  }, [selectedConfig]);

  const preview = {
    path: form.path || DUMMY_SEO.path,
    title: form.title || DUMMY_SEO.title,
    description: form.description || DUMMY_SEO.description,
    keywords: form.keywords || DUMMY_SEO.keywords,
    canonicalUrl: form.canonicalUrl || DUMMY_SEO.canonicalUrl,
    ogDescription: form.ogDescription || DUMMY_SEO.ogDescription,
  };

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        path: form.path,
        title: form.title,
        description: form.description,
        keywords: form.keywords,
        canonicalUrl: form.canonicalUrl,
        ogDescription: form.ogDescription,
        ogImage: form.ogImage,
        noindex: form.noindex,
      };

      let result;
      if (form.id) {
        result = await updateSeoConfig(form.id, payload);
        setConfigs((current) => current.map((item) => (item._id === form.id ? result.config : item)));
        toast.success('SEO configuration updated.');
      } else {
        result = await createSeoConfig(payload);
        setConfigs((current) => {
          const exists = current.some((item) => item._id === result.config._id);
          if (exists) {
            return current.map((item) => (item._id === result.config._id ? result.config : item));
          }
          return [result.config, ...current];
        });
        toast.success(result.upserted ? 'SEO configuration updated.' : 'SEO configuration created.');
      }

      setForm(emptyForm());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to save SEO configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this SEO configuration?')) return;
    setSaving(true);
    setError('');

    try {
      await deleteSeoConfig(id);
      setConfigs((current) => current.filter((item) => item._id !== id));
      if (form.id === id) setForm(emptyForm());
      toast.success('SEO configuration deleted.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete SEO configuration');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Manage page-specific path, title, meta description, keywords, canonical URL, and share description.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Path</label>
                  <Input
                    value={form.path}
                    onChange={(event) => handleChange('path', event.target.value)}
                    placeholder="/about"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Canonical URL</label>
                  <Input
                    value={form.canonicalUrl}
                    onChange={(event) => handleChange('canonicalUrl', event.target.value)}
                    placeholder="https://bestchoicetutors.com/about"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={Boolean(form.noindex)}
                  onChange={(event) => handleChange('noindex', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4FD1C5] focus:ring-[#4FD1C5]"
                />
                <span className="text-sm text-slate-700">
                  Hide this page from search results
                  <span className="block text-xs text-slate-400">
                    Adds noindex, nofollow. Use for thin or duplicate pages. Blocking a page in
                    robots.txt does not remove it from search; this does.
                  </span>
                </span>
              </label>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Page title</label>
                  <Input
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    placeholder="Best Choice Tutors | About Us"
                  />
                  <LengthHint value={form.title} field="title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Meta description</label>
                  <Textarea
                    value={form.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    placeholder="Write a short description for search engines and social shares."
                    rows={4}
                  />
                  <LengthHint value={form.description} field="description" />
                </div>
                <DuplicateWarning configs={configs} form={form} />
                <div>
                  <label className="block text-sm font-medium text-slate-700">Keywords</label>
                  <Textarea
                    value={form.keywords}
                    onChange={(event) => handleChange('keywords', event.target.value)}
                    placeholder="Enter comma-separated keywords"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Share description</label>
                  <Input
                    value={form.ogDescription}
                    onChange={(event) => handleChange('ogDescription', event.target.value)}
                    placeholder="Short description used when this page is shared"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Share image URL</label>
                  <Input
                    value={form.ogImage}
                    onChange={(event) => handleChange('ogImage', event.target.value)}
                    placeholder="https://bestchoicetutors.com/logo.png"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Shown when the page is shared on social media. Leave blank to use the site logo.
                  </p>
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-3 items-center">
                <Button type="submit" disabled={saving}>
                  {form.id ? 'Update SEO config' : 'Create SEO config'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setForm(emptyForm())} disabled={saving}>
                  Clear form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Uses dummy SEO until you type into the form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{preview.canonicalUrl}</p>
              <p className="mt-1 text-lg font-medium text-blue-700">{preview.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{preview.description}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Shared Link</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{preview.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{preview.ogDescription || preview.description}</p>
              <p className="mt-2 text-xs text-slate-500">bestchoicetutors.com{preview.path}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Keywords</p>
              <p className="mt-2 text-sm text-slate-700">{preview.keywords}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle>Configured Pages</CardTitle>
          <CardDescription>Review and edit existing page SEO metadata.</CardDescription>
        </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                Loading SEO configurations…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Path</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Title</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Updated</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {configs.map((config) => (
                      <tr key={config._id}>
                        <td className="px-4 py-3 text-slate-700">{config.path}</td>
                        <td className="px-4 py-3 text-slate-700">{config.title || '–'}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(config.updatedAt || config.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setForm({
                                id: config._id,
                                path: config.path,
                                title: config.title || '',
                                description: config.description || '',
                                keywords: config.keywords || '',
                                canonicalUrl: config.canonicalUrl || '',
                                ogDescription: config.ogDescription || '',
                              })}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => handleDelete(config._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {configs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                          No SEO configurations found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
