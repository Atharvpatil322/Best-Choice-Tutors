/**
 * Admin SEO Tools
 *
 * Tabbed container for every SEO control. The existing page-meta screen is
 * embedded unchanged as the "Meta" tab; the remaining tabs manage settings that
 * previously required a code change and redeploy.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Gauge,
  Tag,
  CornerUpRight,
  FileWarning,
  Bot,
  Map as MapIcon,
  Sparkles,
  Braces,
  LayoutTemplate,
  BadgeCheck,
  Loader2,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AdminSeoManager from './AdminSeoManager';
import {
  getSeoDashboard,
  getSeoSettings,
  updateSeoSettings,
  listRedirects,
  createRedirect,
  deleteRedirect,
  listNotFound,
  clearNotFound,
  listPseoTemplates,
  createPseoTemplate,
  deletePseoTemplate,
  previewPseoTemplate,
  generatePseoPages,
  listPseoPages,
} from '@/services/seoToolsService';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: Gauge },
  { key: 'meta', label: 'Meta', icon: Tag },
  { key: 'redirect', label: 'Redirect', icon: CornerUpRight },
  { key: 'notfound', label: '404 Log', icon: FileWarning },
  { key: 'robot', label: 'Robot', icon: Bot },
  { key: 'sitemap', label: 'Sitemap', icon: MapIcon },
  { key: 'llm', label: 'LLM', icon: Sparkles },
  { key: 'schema', label: 'Schema', icon: Braces },
  { key: 'pseo', label: 'PSEO', icon: LayoutTemplate },
  { key: 'verification', label: 'Verification', icon: BadgeCheck },
];

/** Full-width spinner used while a tab loads its data. */
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
    </div>
  );
}

/**
 * Convert a newline-separated textarea value into a trimmed array.
 *
 * @param {string} value
 * @returns {string[]}
 */
function linesToArray(value) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/* --------------------------------------------------------------- Dashboard */

function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSeoDashboard()
      .then((result) => !cancelled && setData(result))
      .catch((err) => toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <TabLoading />;
  if (!data) return null;

  const tiles = [
    { label: 'Active redirects', value: data.redirects.active, sub: `${data.redirects.total} total` },
    { label: 'Unresolved 404s', value: data.notFound.unresolved, sub: `${data.notFound.total} logged` },
    { label: 'PSEO pages live', value: data.pseo.active, sub: `${data.pseo.pages} generated` },
    { label: 'PSEO templates', value: data.pseo.templates, sub: 'configured' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{tile.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#1A365D]">{tile.value}</p>
            <p className="mt-1 text-xs text-slate-400">{tile.sub}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#1A365D] mb-2">Most requested missing pages</h3>
        {data.topMisses.length === 0 ? (
          <p className="text-sm text-slate-500">No unresolved missing pages. Nothing to fix.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {data.topMisses.map((miss) => (
              <div key={miss.path} className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-sm text-slate-700">{miss.path}</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {miss.hits} hits
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Redirects */

function RedirectTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sourcePath: '',
    targetUrl: '',
    statusCode: 301,
    matchType: 'exact',
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRedirects();
      setRows(data.redirects || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createRedirect(form);
      toast.success('Redirect created successfully');
      setForm({ sourcePath: '', targetUrl: '', statusCode: 301, matchType: 'exact', note: '' });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (redirectId) => {
    if (!window.confirm('Delete this redirect? Links using it will stop working.')) return;
    try {
      await deleteRedirect(redirectId);
      toast.success('Redirect deleted successfully');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source path</label>
            <Input
              value={form.sourcePath}
              onChange={(event) => setForm({ ...form, sourcePath: event.target.value })}
              placeholder="/old-page"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target URL</label>
            <Input
              value={form.targetUrl}
              onChange={(event) => setForm({ ...form, targetUrl: event.target.value })}
              placeholder="/new-page"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.statusCode}
              onChange={(event) => setForm({ ...form, statusCode: Number(event.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
            >
              <option value={301}>301 (Permanent)</option>
              <option value={302}>302 (Temporary)</option>
              <option value={307}>307 (Temporary, keeps method)</option>
              <option value={308}>308 (Permanent, keeps method)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Match</label>
            <select
              value={form.matchType}
              onChange={(event) => setForm({ ...form, matchType: event.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4FD1C5] focus:border-transparent"
            >
              <option value="exact">Exact</option>
              <option value="prefix">Prefix (keeps the rest of the path)</option>
              <option value="regex">Regex (advanced)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <Input
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="Why this exists"
            />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin mr-1" /> Saving...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-1" /> Add redirect
            </>
          )}
        </Button>
      </form>

      <div>
        <h3 className="text-sm font-semibold text-[#1A365D] mb-2">
          Existing redirects ({rows.length})
        </h3>
        {loading ? (
          <TabLoading />
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No redirects yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium">Target</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Match</th>
                  <th className="px-4 py-2 font-medium">Hits</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td className="px-4 py-2 font-mono text-slate-700">{row.sourcePath}</td>
                    <td className="px-4 py-2 font-mono text-slate-700">{row.targetUrl}</td>
                    <td className="px-4 py-2">{row.statusCode}</td>
                    <td className="px-4 py-2 capitalize">{row.matchType}</td>
                    <td className="px-4 py-2">{row.hits}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(row._id)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
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
}

/* ----------------------------------------------------------------- 404 log */

function NotFoundTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotFound(unresolvedOnly);
      setRows(data.entries || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [unresolvedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = async () => {
    if (!window.confirm('Clear the entire 404 log? This cannot be undone.')) return;
    try {
      const result = await clearNotFound();
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={unresolvedOnly}
            onChange={(event) => setUnresolvedOnly(event.target.checked)}
          />
          Hide paths that already have a redirect
        </label>
        <Button type="button" variant="outline" onClick={load}>
          <RefreshCw size={16} className="mr-1" /> Refresh
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          <Trash2 size={16} className="mr-1" /> Clear log
        </Button>
      </div>

      {loading ? (
        <TabLoading />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No missing pages recorded. Paths are logged automatically when a visitor or crawler
          requests a URL that does not exist.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Path</th>
                <th className="px-4 py-2 font-medium">Hits</th>
                <th className="px-4 py-2 font-medium">Last seen</th>
                <th className="px-4 py-2 font-medium">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-2 font-mono text-slate-700">{row.path}</td>
                  <td className="px-4 py-2">{row.hits}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-slate-500 truncate max-w-[16rem]">
                    {row.lastReferrer || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------- settings-backed tabs (shared) */

/**
 * Shared editor for the tabs that all read and write the single settings
 * document. Each tab supplies its own fields via a render function.
 *
 * @param {(settings: Object, update: Function) => React.ReactNode} children
 */
function SettingsTab({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSeoSettings()
      .then((data) => !cancelled && setSettings(data.settings))
      .catch((err) => toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const result = await updateSeoSettings(payload);
      setSettings(result.settings);
      toast.success('SEO settings updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TabLoading />;
  if (!settings) return null;
  return children(settings, update, handleSave, saving);
}

/** Shown in the empty override box as a shape to copy, never saved. */
const ROBOTS_PLACEHOLDER = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://bestchoicetutors.com/sitemap.xml`;

function RobotTab() {
  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Override <code className="text-xs">/robots.txt</code> rules (blank = default rules).
            </p>
            <Textarea
              rows={16}
              className="font-mono text-xs"
              value={settings.robotsOverride || ''}
              onChange={(event) => update({ robotsOverride: event.target.value })}
              placeholder={ROBOTS_PLACEHOLDER}
            />
            <p className="text-xs text-slate-400 mt-1">
              Served exactly as typed. Leave blank to use the generated rules, which already
              allow the major search and AI crawlers and block private areas. Preview the live
              result at{' '}
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="underline">
                /robots.txt
              </a>
              .
            </p>
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={() => save({ robotsOverride: settings.robotsOverride })}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save robots settings
          </Button>

          <p className="text-xs text-slate-500">
            Preview the result at <span className="font-mono">/robots.txt</span>.
          </p>
        </div>
      )}
    </SettingsTab>
  );
}

function SitemapTab() {
  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!settings.sitemapIncludeBlogs}
                onChange={(event) => update({ sitemapIncludeBlogs: event.target.checked })}
              />
              Include published blog posts
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!settings.sitemapIncludePseo}
                onChange={(event) => update({ sitemapIncludePseo: event.target.checked })}
              />
              Include generated landing pages
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Excluded paths (one per line)
            </label>
            <Textarea
              rows={5}
              value={(settings.sitemapExcludePaths || []).join('\n')}
              onChange={(event) => update({ sitemapExcludePaths: linesToArray(event.target.value) })}
              placeholder="/terms"
            />
            <p className="text-xs text-slate-400 mt-1">
              Private areas are always excluded automatically; this is for public pages you would
              rather not list.
            </p>
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={() =>
              save({
                sitemapIncludeBlogs: settings.sitemapIncludeBlogs,
                sitemapIncludePseo: settings.sitemapIncludePseo,
                sitemapExcludePaths: settings.sitemapExcludePaths,
              })
            }
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save sitemap settings
          </Button>

          <p className="text-xs text-slate-500">
            Preview the result at <span className="font-mono">/sitemap.xml</span>.
          </p>
        </div>
      )}
    </SettingsTab>
  );
}

function LlmTab() {
  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Introduction shown to AI assistants
            </label>
            <Textarea
              rows={5}
              value={settings.llmsIntro || ''}
              onChange={(event) => update({ llmsIntro: event.target.value })}
              placeholder="Leave blank to use the default description."
            />
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={() => save({ llmsIntro: settings.llmsIntro })}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save llms.txt settings
          </Button>

          <p className="text-xs text-slate-500">
            Blog posts, FAQs and benefits are added automatically. Preview at{' '}
            <span className="font-mono">/llms.txt</span>. Note that llms.txt is a proposed
            convention, not an adopted standard.
          </p>
        </div>
      )}
    </SettingsTab>
  );
}

const SCHEMA_LABELS = {
  faq: 'FAQ (homepage) - can show expandable questions in search results',
  breadcrumb: 'Breadcrumb (all pages) - shows the page hierarchy under the result',
  service: 'Service (homepage) - describes the tutoring offering',
  article: 'Article (blog posts) - eligible for article rich results',
  organization: 'Organization - business identity and logo',
};

function SchemaTab() {
  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Structured data helps search engines understand each page. Turn a type off only if it is
            causing validation warnings.
          </p>
          <div className="space-y-2">
            {Object.entries(SCHEMA_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!settings.schemaToggles?.[key]}
                  onChange={(event) =>
                    update({
                      schemaToggles: { ...settings.schemaToggles, [key]: event.target.checked },
                    })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={() => save({ schemaToggles: settings.schemaToggles })}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save schema settings
          </Button>
        </div>
      )}
    </SettingsTab>
  );
}

const VERIFICATION_FIELDS = [
  { key: 'google', label: 'Google Search Console', placeholder: 'Verification token' },
  { key: 'bing', label: 'Bing Webmaster Tools', placeholder: 'Verification token' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'Verification token' },
  { key: 'yandex', label: 'Yandex', placeholder: 'Verification token' },
];

function VerificationTab() {
  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Paste the token each service gives you. It is rendered as a verification meta tag on
            every page, so no code change or redeploy is needed.
          </p>
          {VERIFICATION_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              <Input
                value={settings.verification?.[field.key] || ''}
                onChange={(event) =>
                  update({
                    verification: { ...settings.verification, [field.key]: event.target.value },
                  })
                }
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <Button
            type="button"
            disabled={saving}
            onClick={() => save({ verification: settings.verification })}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save verification tags
          </Button>
        </div>
      )}
    </SettingsTab>
  );
}

/* -------------------------------------------------------------------- PSEO */

function PseoTab() {
  const [templates, setTemplates] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    pathPattern: '/{subject}-tutors-in-{location}',
    titlePattern: '{Subject} Tutors in {Location} | Best Choice Tutors',
    descriptionPattern:
      'Find verified {subject} tutors in {location}. Compare profiles, prices and availability.',
    headingPattern: '{Subject} Tutors in {Location}',
    introPattern: '',
    subjects: '',
    locations: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templateData, pageData] = await Promise.all([listPseoTemplates(), listPseoPages({ limit: 100 })]);
      setTemplates(templateData.templates || []);
      setPages(pageData.pages || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createPseoTemplate({
        ...form,
        subjects: linesToArray(form.subjects),
        locations: linesToArray(form.locations),
      });
      toast.success('Template created successfully');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (templateId) => {
    try {
      const result = await generatePseoPages(templateId);
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePreview = async (templateId) => {
    try {
      const result = await previewPseoTemplate(templateId);
      const sample = result.sample.map((page) => page.path).join('\n');
      window.alert(`Would generate ${result.total} page(s).\n\nFirst few:\n${sample}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template and every page it generated?')) return;
    try {
      const result = await deletePseoTemplate(templateId);
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Programmatic pages target searches the generic tutor list cannot rank for, such as
        &quot;maths tutors in london&quot;. Use <span className="font-mono">{'{subject}'}</span> and{' '}
        <span className="font-mono">{'{location}'}</span> in each pattern; capitalise them
        (<span className="font-mono">{'{Subject}'}</span>) for title case in visible copy.
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A365D]">Templates ({templates.length})</h3>
        <Button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
        >
          <Plus size={16} className="mr-1" /> New template
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template name</label>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Subject by city"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL pattern</label>
            <Input
              value={form.pathPattern}
              onChange={(event) => setForm({ ...form, pathPattern: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Page title pattern</label>
            <Input
              value={form.titlePattern}
              onChange={(event) => setForm({ ...form, titlePattern: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meta description pattern</label>
            <Textarea
              rows={2}
              value={form.descriptionPattern}
              onChange={(event) => setForm({ ...form, descriptionPattern: event.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subjects (one per line)</label>
              <Textarea
                rows={6}
                value={form.subjects}
                onChange={(event) => setForm({ ...form, subjects: event.target.value })}
                placeholder={'Mathematics\nPhysics\nChemistry'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Locations (one per line)</label>
              <Textarea
                rows={6}
                value={form.locations}
                onChange={(event) => setForm({ ...form, locations: event.target.value })}
                placeholder={'London\nManchester\nBirmingham'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
              Create template
            </Button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-slate-500">No templates yet.</p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-slate-900">{template.name}</h4>
                  <p className="font-mono text-xs text-slate-500 mt-1">{template.pathPattern}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(template.subjects || []).length} subjects x {(template.locations || []).length || 1}{' '}
                    locations - {template.pageCount} page(s) generated
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => handlePreview(template._id)}>
                    <Eye size={14} className="mr-1" /> Preview
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleGenerate(template._id)}
                    className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
                  >
                    <RefreshCw size={14} className="mr-1" /> Generate
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-[#1A365D] mb-2">Generated pages ({pages.length})</h3>
        {pages.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing generated yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Path</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => (
                  <tr key={page._id}>
                    <td className="px-4 py-2 font-mono text-slate-700">{page.path}</td>
                    <td className="px-4 py-2 text-slate-600 truncate max-w-[22rem]">{page.title}</td>
                    <td className="px-4 py-2">
                      {page.isCustomised && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mr-1">Edited</Badge>
                      )}
                      <Badge
                        className={
                          page.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
                        }
                      >
                        {page.isActive ? 'Live' : 'Hidden'}
                      </Badge>
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
}

/* -------------------------------------------------------------- container */

const TAB_CONTENT = {
  dashboard: DashboardTab,
  redirect: RedirectTab,
  notfound: NotFoundTab,
  robot: RobotTab,
  sitemap: SitemapTab,
  llm: LlmTab,
  schema: SchemaTab,
  pseo: PseoTab,
  verification: VerificationTab,
};

/**
 * Tabbed SEO section. The Meta tab renders the pre-existing page-meta screen
 * unchanged; every other tab is new.
 */
export default function AdminSeoTools() {
  const [active, setActive] = useState('dashboard');
  const ActiveTab = TAB_CONTENT[active];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A365D]">SEO</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage metadata, crawl rules, redirects and generated landing pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                isActive
                  ? 'bg-white border-slate-200 text-[#1A365D]'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === 'meta' ? (
        // The existing page-meta screen, embedded unchanged.
        <AdminSeoManager />
      ) : (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">
              {TABS.find((tab) => tab.key === active)?.label}
            </CardTitle>
            <CardDescription>
              {active === 'dashboard' && 'Overview of redirects, missing pages and generated pages.'}
              {active === 'redirect' && 'Send old URLs to new ones so existing links keep working.'}
              {active === 'notfound' && 'Paths that were requested but do not exist.'}
              {active === 'robot' && 'Control which crawlers may access the site.'}
              {active === 'sitemap' && 'Choose what appears in sitemap.xml.'}
              {active === 'llm' && 'Summary served to AI assistants at /llms.txt.'}
              {active === 'schema' && 'Structured data emitted on public pages.'}
              {active === 'pseo' && 'Generate landing pages from subject and location combinations.'}
              {active === 'verification' && 'Ownership tokens for search engine consoles.'}
            </CardDescription>
          </CardHeader>
          <CardContent>{ActiveTab ? <ActiveTab /> : null}</CardContent>
        </Card>
      )}
    </div>
  );
}
