/**
 * Admin SEO Tools
 *
 * Tabbed container for every SEO control. The existing page-meta screen is
 * embedded unchanged as the "Meta" tab; the remaining tabs manage settings that
 * previously required a code change and redeploy.
 */

import { Fragment, useCallback, useEffect, useState } from 'react';
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
  Rocket,
  Pencil,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AdminSeoManager from './AdminSeoManager';
import {
  getSeoDashboard,
  publishSite,
  getSeoSettings,
  updateSeoSettings,
  getSchemaPreview,
  listRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  listNotFound,
  deleteNotFound,
  clearNotFound,
  listPseoTemplates,
  createPseoTemplate,
  updatePseoTemplate,
  deletePseoTemplate,
  previewPseoTemplate,
  generatePseoPages,
  listPseoPages,
  updatePseoPage,
  deletePseoPage,
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

  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result = await publishSite();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setData((current) => (current ? { ...current, publish: result.publish } : current));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <TabLoading />;
  if (!data) return null;

  const publish = data.publish || {};
  const health = data.health || { issues: [], issueCount: 0, hiddenPages: [], organizationMissing: [] };

  const tiles = [
    { label: 'Active redirects', value: data.redirects.active, sub: `${data.redirects.total} total` },
    { label: 'Unresolved 404s', value: data.notFound.unresolved, sub: `${data.notFound.total} logged` },
    { label: 'PSEO pages live', value: data.pseo.active, sub: `${data.pseo.pages} generated` },
    { label: 'PSEO templates', value: data.pseo.templates, sub: 'configured' },
  ];

  return (
    <div className="space-y-6">
      {/* The public site is a static build, so SEO edits go live when it is rebuilt. */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#1A365D]">Publish SEO changes</h3>
          <p className="text-sm text-slate-600 mt-1">
            {publish.configured
              ? publish.pending
                ? 'A site build starts automatically in a couple of minutes.'
                : publish.changesSinceLast > 0
                  ? `${publish.changesSinceLast} change(s) are not on the live site yet. Publish now to build it.`
                  : 'Everything is published. Edits go live automatically a couple of minutes after you make them.'
              : 'No deploy hook is set up yet, so SEO edits go live with the next site deploy. Ask the site owner to add RENDER_DEPLOY_HOOK_URL to the API service.'}
          </p>
          {publish.last && (
            <p className="text-xs text-slate-400 mt-1">
              Last build requested {new Date(publish.last.at).toLocaleString()}
              {publish.last.ok === false ? ` - failed: ${publish.last.message}` : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          onClick={handlePublish}
          disabled={publishing || !publish.configured}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white shrink-0"
        >
          {publishing ? <Loader2 size={16} className="animate-spin mr-1" /> : <Rocket size={16} className="mr-1" />}
          Publish now
        </Button>
      </div>

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
        <h3 className="text-sm font-semibold text-[#1A365D] mb-2">
          Search listing health ({health.pagesChecked || 0} pages checked)
        </h3>
        {health.issueCount === 0 && health.organizationMissing.length === 0 ? (
          <p className="text-sm text-slate-600 inline-flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" /> No problems found.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {health.organizationMissing.length > 0 && (
              <div className="px-4 py-3 text-sm">
                <span className="font-medium text-slate-700">Organization schema: </span>
                <span className="text-slate-600">still missing {health.organizationMissing.join(', ')} (Schema tab).</span>
              </div>
            )}
            {health.issues.map((issue, index) => (
              <div key={`${issue.path}-${index}`} className="flex items-start gap-2 px-4 py-2.5 text-sm">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <span className="font-mono text-slate-700 shrink-0">{issue.path}</span>
                <span className="text-slate-600">{issue.problem}</span>
              </div>
            ))}
            {health.issueCount > health.issues.length && (
              <p className="px-4 py-2 text-xs text-slate-400">
                and {health.issueCount - health.issues.length} more
              </p>
            )}
          </div>
        )}
        {health.hiddenPages.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Hidden from search (noindex): {health.hiddenPages.join(', ')}
          </p>
        )}
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

  // The rule being edited, if any; the form above the list doubles as the editor.
  const [editingId, setEditingId] = useState(null);
  const emptyRedirect = { sourcePath: '', targetUrl: '', statusCode: 301, matchType: 'exact', note: '' };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = editingId ? await updateRedirect(editingId, form) : await createRedirect(form);
      const finalTarget = result.redirect?.targetUrl;
      toast.success(
        finalTarget && finalTarget !== form.targetUrl.trim()
          ? `Saved. ${form.targetUrl} already redirects on, so this points straight to ${finalTarget}.`
          : editingId
            ? 'Redirect updated'
            : 'Redirect created successfully',
      );
      setForm(emptyRedirect);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      sourcePath: row.sourcePath,
      targetUrl: row.targetUrl,
      statusCode: row.statusCode,
      matchType: row.matchType,
      note: row.note || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (row) => {
    try {
      await updateRedirect(row._id, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Redirect paused' : 'Redirect turned on');
      await load();
    } catch (err) {
      toast.error(err.message);
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

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-1" /> Saving...
              </>
            ) : editingId ? (
              <>
                <Save size={16} className="mr-1" /> Update redirect
              </>
            ) : (
              <>
                <Plus size={16} className="mr-1" /> Add redirect
              </>
            )}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyRedirect);
              }}
            >
              Cancel edit
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          A target that already redirects is followed to its final page, so visitors never pass
          through a chain, and a rule that would loop back is refused. Old blog and subject
          addresses get a real redirect page at the next site build; any other address forwards
          visitors as soon as the page loads.
        </p>
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
                  <th className="px-4 py-2 font-medium">Active</th>
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
                    <td className="px-4 py-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!row.isActive}
                          onChange={() => handleToggle(row)}
                          aria-label={`Redirect from ${row.sourcePath} is ${row.isActive ? 'on' : 'off'}`}
                        />
                        {row.isActive ? 'On' : 'Off'}
                      </label>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="text-xs text-[#1A365D] hover:underline inline-flex items-center gap-1 mr-3"
                      >
                        <Pencil size={14} /> Edit
                      </button>
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
          No missing pages recorded. A path is logged when a visitor opens an address that does
          not exist on the site.
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
                <th className="px-4 py-2 font-medium" />
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
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteNotFound(row._id);
                          await load();
                        } catch (err) {
                          toast.error(err.message);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1"
                      aria-label={`Remove ${row.path} from the log`}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Crawling</label>
            <select
              value={settings.robotsMode || 'auto'}
              onChange={(event) => update({ robotsMode: event.target.value })}
              className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="auto">Automatic - allow on the live site, block on test copies</option>
              <option value="allow">Always allow search engines</option>
              <option value="block">Block all search engines (site in preview)</option>
            </select>
          </div>

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
            onClick={() => save({ robotsMode: settings.robotsMode, robotsOverride: settings.robotsOverride })}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
            Save robots settings
          </Button>

        </div>
      )}
    </SettingsTab>
  );
}

/**
 * Excluded-paths box. Held as text while editing and split into a list only
 * on save, so pressing Enter starts a new line instead of being stripped.
 */
function ExcludedPathsField({ value, onChange }) {
  const [text, setText] = useState(() => (value || []).join('\n'));
  return (
    <Textarea
      rows={5}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onChange(linesToArray(event.target.value));
      }}
      placeholder="/terms"
    />
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
            <ExcludedPathsField
              value={settings.sitemapExcludePaths}
              onChange={(paths) => update({ sitemapExcludePaths: paths })}
            />
            <p className="text-xs text-slate-400 mt-1">
              Private areas and pages marked "hide from search results" are always left out; this
              is for other public pages you would rather not list.
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
            Preview the result at <span className="font-mono">/sitemap.xml</span> after the next site
            build.
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
            Pages, subject pages, generated pages, blog posts, FAQs and benefits are added
            automatically. Preview at <span className="font-mono">/llms.txt</span> after the next
            site build. llms.txt is a proposed convention; Google Search does not use it.
          </p>
        </div>
      )}
    </SettingsTab>
  );
}

const SCHEMA_LABELS = {
  organization: 'Organization and WebSite (homepage) - business identity, logo and contact details',
  service: 'Service (homepage) - describes the tutoring offering',
  faq: 'FAQ (homepage, tutor search, subject pages) - the questions shown on each page',
  breadcrumb: 'Breadcrumb (all public pages) - shows the page hierarchy under the result',
  article: 'Article (blog posts) - headline, image, dates and author for each post',
};

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'EducationalOrganization', label: 'Educational organisation (recommended)' },
  { value: 'OnlineBusiness', label: 'Online business' },
  { value: 'Organization', label: 'Organisation' },
  { value: 'LocalBusiness', label: 'Local business (needs a street address)' },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Fields edited as one-per-line text and saved as lists. */
const ORGANIZATION_LIST_FIELDS = ['sameAs', 'founders', 'areaServed', 'knowsAbout'];

const SITE_URL = 'https://bestchoicetutors.com';

/**
 * Editable copy of the organization settings. Lists are held as text while
 * editing and only split into arrays on save, so pressing Enter in a list box
 * starts a new line instead of being stripped on the spot.
 *
 * @param {Object} [org]
 * @returns {Object}
 */
function toOrganizationDraft(org = {}) {
  const draft = {
    type: 'EducationalOrganization',
    name: '',
    legalName: '',
    alternateName: '',
    slogan: '',
    description: '',
    url: '',
    logo: '',
    image: '',
    email: '',
    telephone: '',
    onlineOnly: false,
    priceRange: '',
    foundingDate: '',
    companyNumber: '',
    vatID: '',
    taxID: '',
    websiteName: '',
    websiteAlternateName: '',
    ...org,
    address: {
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: '',
      ...(org.address || {}),
    },
    geo: { latitude: '', longitude: '', ...(org.geo || {}) },
    contactPoints: (org.contactPoints || []).map((point) => ({
      contactType: point.contactType || '',
      telephone: point.telephone || '',
      email: point.email || '',
      areaServed: point.areaServed || '',
      availableLanguage: (point.availableLanguage || []).join(', '),
    })),
    openingHours: (org.openingHours || []).map((slot) => ({
      days: slot.days || [],
      opens: slot.opens || '',
      closes: slot.closes || '',
    })),
  };
  for (const field of ORGANIZATION_LIST_FIELDS) draft[field] = (org[field] || []).join('\n');
  return draft;
}

/** Convert an editing draft back into the shape the API stores. */
function fromOrganizationDraft(draft) {
  const payload = {
    ...draft,
    contactPoints: draft.contactPoints.map((point) => ({
      ...point,
      availableLanguage: point.availableLanguage
        .split(',')
        .map((language) => language.trim())
        .filter(Boolean),
    })),
  };
  for (const field of ORGANIZATION_LIST_FIELDS) payload[field] = linesToArray(draft[field]);
  return payload;
}

/** Labelled form row. */
function FormField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

/** Titled group of fields. */
function FormSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[#1A365D]">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Organization editor with the structured data on/off switches and a preview
 * of the homepage JSON-LD exactly as the next build will publish it.
 */
function OrganizationEditor({ settings, update, save, saving, preview }) {
  const [draft, setDraft] = useState(() => toOrganizationDraft(settings.organization || {}));

  // Re-seed from what the server stored after a save, so normalised values
  // (an upper-cased country code, dropped blank list entries) are what the
  // admin sees. Toggling a schema type leaves settings.organization untouched,
  // so unsaved edits survive that.
  useEffect(() => {
    setDraft(toOrganizationDraft(settings.organization || {}));
  }, [settings.organization]);

  const set = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const setNested = (group, field, value) =>
    setDraft((current) => ({ ...current, [group]: { ...current[group], [field]: value } }));
  const setRow = (list, index, field, value) =>
    setDraft((current) => ({
      ...current,
      [list]: current[list].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  const addRow = (list, row) => setDraft((current) => ({ ...current, [list]: [...current[list], row] }));
  const removeRow = (list, index) =>
    setDraft((current) => ({ ...current, [list]: current[list].filter((_, i) => i !== index) }));

  const text = (field, props = {}) => (
    <Input value={draft[field] || ''} onChange={(event) => set(field, event.target.value)} {...props} />
  );

  const handleSave = () =>
    save({ organization: fromOrganizationDraft(draft), schemaToggles: settings.schemaToggles });

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        These details are published as Organization structured data on the homepage, so search
        engines can show the right name, logo and contact details. Leave a field blank rather than
        guessing - blank fields are left out, never filled with placeholder text. Changes go live
        with the next site build.
      </p>

      <FormSection title="Structured data types" description="Turn a type off only if it causes validation errors.">
        <div className="space-y-2">
          {Object.entries(SCHEMA_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.schemaToggles?.[key] !== false}
                onChange={(event) =>
                  update({ schemaToggles: { ...settings.schemaToggles, [key]: event.target.checked } })
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Identity">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Organization type">
            <select
              value={draft.type}
              onChange={(event) => set('type', event.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white"
            >
              {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Name" hint="Blank uses Best Choice Tutors.">{text('name', { placeholder: 'Best Choice Tutors' })}</FormField>
          <FormField label="Registered company name">{text('legalName')}</FormField>
          <FormField label="Other name" hint="An abbreviation or trading name, for example BCT.">{text('alternateName')}</FormField>
          <FormField label="Slogan">{text('slogan')}</FormField>
          <FormField label="Website address" hint="Blank uses https://bestchoicetutors.com.">{text('url', { placeholder: SITE_URL })}</FormField>
          <FormField label="Logo" hint="Full URL or a path such as /logo.png. Square, at least 112px.">{text('logo', { placeholder: '/logo.png' })}</FormField>
          <FormField label="Image" hint="A photo representing the business.">{text('image')}</FormField>
          <FormField label="Founding date" hint="A year (2024) or a date (2024-01-31).">{text('foundingDate')}</FormField>
          <FormField label="Price range" hint="For example £25-£60 per hour.">{text('priceRange')}</FormField>
        </div>
        <FormField label="Description">
          <Textarea rows={3} value={draft.description} onChange={(event) => set('description', event.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Email">{text('email', { type: 'email' })}</FormField>
          <FormField label="Telephone" hint="International format, for example +44 20 1234 5678.">{text('telephone')}</FormField>
        </div>
        <div className="space-y-3">
          {draft.contactPoints.map((point, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-5 items-end rounded-lg bg-slate-50 p-3">
              <FormField label="Department">
                <Input value={point.contactType} placeholder="customer support" onChange={(e) => setRow('contactPoints', index, 'contactType', e.target.value)} />
              </FormField>
              <FormField label="Telephone">
                <Input value={point.telephone} onChange={(e) => setRow('contactPoints', index, 'telephone', e.target.value)} />
              </FormField>
              <FormField label="Email">
                <Input value={point.email} onChange={(e) => setRow('contactPoints', index, 'email', e.target.value)} />
              </FormField>
              <FormField label="Languages" hint="Comma separated.">
                <Input value={point.availableLanguage} placeholder="English" onChange={(e) => setRow('contactPoints', index, 'availableLanguage', e.target.value)} />
              </FormField>
              <Button type="button" variant="outline" size="sm" onClick={() => removeRow('contactPoints', index)} aria-label="Remove contact point">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addRow('contactPoints', { contactType: '', telephone: '', email: '', areaServed: '', availableLanguage: '' })}
          >
            <Plus size={16} className="mr-1" />
            Add contact point
          </Button>
        </div>
      </FormSection>

      <FormSection title="Location and hours" description="Only for a business with premises customers can visit.">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={draft.onlineOnly} onChange={(event) => set('onlineOnly', event.target.checked)} />
          Online only - leave out the address, map position and opening hours
        </label>
        {!draft.onlineOnly && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Street address">
                <Input value={draft.address.streetAddress} onChange={(e) => setNested('address', 'streetAddress', e.target.value)} />
              </FormField>
              <FormField label="Town or city">
                <Input value={draft.address.addressLocality} onChange={(e) => setNested('address', 'addressLocality', e.target.value)} />
              </FormField>
              <FormField label="County or region">
                <Input value={draft.address.addressRegion} onChange={(e) => setNested('address', 'addressRegion', e.target.value)} />
              </FormField>
              <FormField label="Postcode">
                <Input value={draft.address.postalCode} onChange={(e) => setNested('address', 'postalCode', e.target.value)} />
              </FormField>
              <FormField label="Country code" hint="Two letters, for example GB.">
                <Input value={draft.address.addressCountry} maxLength={2} onChange={(e) => setNested('address', 'addressCountry', e.target.value.toUpperCase())} />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Latitude">
                  <Input value={draft.geo.latitude} onChange={(e) => setNested('geo', 'latitude', e.target.value)} />
                </FormField>
                <FormField label="Longitude">
                  <Input value={draft.geo.longitude} onChange={(e) => setNested('geo', 'longitude', e.target.value)} />
                </FormField>
              </div>
            </div>
            <div className="space-y-3">
              {draft.openingHours.map((slot, index) => (
                <div key={index} className="rounded-lg bg-slate-50 p-3 space-y-2">
                  <div className="flex flex-wrap gap-3">
                    {WEEK_DAYS.map((day) => (
                      <label key={day} className="flex items-center gap-1 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={slot.days.includes(day)}
                          onChange={(event) =>
                            setRow(
                              'openingHours',
                              index,
                              'days',
                              event.target.checked ? [...slot.days, day] : slot.days.filter((d) => d !== day),
                            )
                          }
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <FormField label="Opens">
                      <Input type="time" value={slot.opens} onChange={(e) => setRow('openingHours', index, 'opens', e.target.value)} />
                    </FormField>
                    <FormField label="Closes">
                      <Input type="time" value={slot.closes} onChange={(e) => setRow('openingHours', index, 'closes', e.target.value)} />
                    </FormField>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRow('openingHours', index)} aria-label="Remove opening hours">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addRow('openingHours', { days: [], opens: '09:00', closes: '17:00' })}>
                <Plus size={16} className="mr-1" />
                Add opening hours
              </Button>
            </div>
          </>
        )}
      </FormSection>

      <FormSection title="Profiles and coverage" description="One per line.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Social profiles" hint="Full https:// links to Facebook, Instagram, LinkedIn and so on.">
            <Textarea rows={4} className="font-mono text-xs" value={draft.sameAs} onChange={(e) => set('sameAs', e.target.value)} />
          </FormField>
          <FormField label="Founders">
            <Textarea rows={4} value={draft.founders} onChange={(e) => set('founders', e.target.value)} />
          </FormField>
          <FormField label="Countries served" hint="For example United Kingdom.">
            <Textarea rows={3} value={draft.areaServed} onChange={(e) => set('areaServed', e.target.value)} />
          </FormField>
          <FormField label="Topics of expertise" hint="For example GCSE Maths tutoring.">
            <Textarea rows={3} value={draft.knowsAbout} onChange={(e) => set('knowsAbout', e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Business identifiers">
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Company registration number">{text('companyNumber')}</FormField>
          <FormField label="VAT number">{text('vatID')}</FormField>
          <FormField label="Tax reference">{text('taxID')}</FormField>
        </div>
      </FormSection>

      <FormSection title="Website" description="The site name search engines show next to your results.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Site name" hint="Blank uses the organization name.">{text('websiteName')}</FormField>
          <FormField label="Other site name">{text('websiteAlternateName')}</FormField>
        </div>
      </FormSection>

      <Button type="button" disabled={saving} onClick={handleSave} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
        {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
        Save schema settings
      </Button>

      <FormSection title="Homepage structured data preview" description="Exactly what the next build publishes on the homepage.">
        {preview?.missing?.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">Recommended fields still empty</p>
            <ul className="list-disc ml-4 space-y-0.5">
              {preview.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 text-slate-100 text-xs p-3">
          {preview ? JSON.stringify(preview.schemas, null, 2) : 'Loading preview...'}
        </pre>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(`${SITE_URL}/`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#1A365D]"
          >
            Test the live homepage in Google Rich Results Test
          </a>
          <a
            href={`https://validator.schema.org/#url=${encodeURIComponent(`${SITE_URL}/`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#1A365D]"
          >
            Validate on schema.org
          </a>
        </div>
      </FormSection>
    </div>
  );
}

function SchemaTab() {
  const [preview, setPreview] = useState(null);

  const loadPreview = useCallback(() => {
    getSchemaPreview()
      .then(setPreview)
      .catch(() => setPreview({ schemas: [], missing: [] }));
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return (
    <SettingsTab>
      {(settings, update, save, saving) => (
        <OrganizationEditor
          settings={settings}
          update={update}
          save={async (payload) => {
            await save(payload);
            loadPreview();
          }}
          saving={saving}
          preview={preview}
        />
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
            Paste the token each service gives you. It is added as a verification meta tag to every
            page at the next site build, next to any verification tag already in the site code -
            existing verifications keep working.
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

/** Starting values for a new generated-page template. */
const NEW_PSEO_TEMPLATE = {
  name: '',
  pathPattern: '/{subject}-tutors-in-{location}',
  titlePattern: '{Subject} Tutors in {Location} | Best Choice Tutors',
  descriptionPattern:
    'Find verified {subject} tutors in {location}. Compare profiles, prices and availability.',
  headingPattern: '{Subject} Tutors in {Location}',
  introPattern: '',
  subjects: '',
  locations: '',
};

/** Inline editor for one generated page's copy. */
function PseoPageEditor({ page, onSaved, onCancel }) {
  const [draft, setDraft] = useState({
    title: page.title || '',
    description: page.description || '',
    heading: page.heading || '',
    intro: page.intro || '',
  });
  const [saving, setSaving] = useState(false);
  const field = (key, label, multiline) => (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {multiline ? (
        <Textarea rows={2} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
      ) : (
        <Input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
      )}
    </label>
  );
  const save = async () => {
    setSaving(true);
    try {
      await updatePseoPage(page._id, draft);
      toast.success('Page updated. It will keep these edits when the template is generated again.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 p-3 bg-slate-50 rounded-lg">
      {field('title', 'Page title')}
      {field('heading', 'Heading')}
      {field('description', 'Meta description', true)}
      {field('intro', 'Intro', true)}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={save} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
          Save page
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PseoTab() {
  const [templates, setTemplates] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingPageId, setEditingPageId] = useState(null);
  const [previews, setPreviews] = useState({});
  const [form, setForm] = useState(NEW_PSEO_TEMPLATE);

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

  const closeForm = () => {
    setShowForm(false);
    setEditingTemplateId(null);
    setForm(NEW_PSEO_TEMPLATE);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        subjects: linesToArray(form.subjects),
        locations: linesToArray(form.locations),
      };
      if (editingTemplateId) {
        await updatePseoTemplate(editingTemplateId, payload);
        toast.success('Template updated. Generate again to apply it to its pages.');
      } else {
        await createPseoTemplate(payload);
        toast.success('Template created successfully');
      }
      closeForm();
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template._id);
    setForm({
      ...NEW_PSEO_TEMPLATE,
      ...template,
      subjects: (template.subjects || []).join('\n'),
      locations: (template.locations || []).join('\n'),
    });
    setShowForm(true);
  };

  const handleTogglePage = async (page) => {
    try {
      await updatePseoPage(page._id, { isActive: !page.isActive });
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeletePage = async (page) => {
    if (!window.confirm(`Delete ${page.path}? Generating the template again would recreate it.`)) return;
    try {
      await deletePseoPage(page._id);
      toast.success('Page deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
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
      setPreviews((current) => ({ ...current, [templateId]: result }));
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
          onClick={() => {
            if (showForm) closeForm();
            else setShowForm(true);
          }}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Heading pattern</label>
            <Input
              value={form.headingPattern}
              onChange={(event) => setForm({ ...form, headingPattern: event.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Intro pattern</label>
            <Textarea
              rows={3}
              value={form.introPattern}
              onChange={(event) => setForm({ ...form, introPattern: event.target.value })}
              placeholder="Looking for a {subject} tutor in {location}? Compare verified tutors..."
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
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white">
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
              {editingTemplateId ? 'Update template' : 'Create template'}
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
                  <Button type="button" variant="outline" onClick={() => handleEditTemplate(template)}>
                    <Pencil size={14} className="mr-1" /> Edit
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
              {previews[template._id] && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-medium mb-1">Would generate {previews[template._id].total} page(s). First few:</p>
                  <ul className="font-mono space-y-0.5">
                    {previews[template._id].sample.map((page) => (
                      <li key={page.path}>{page.path}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => (
                  <Fragment key={page._id}>
                  <tr>
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
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingPageId(editingPageId === page._id ? null : page._id)}
                        className="text-xs text-[#1A365D] hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePage(page)}
                        className="text-xs text-[#1A365D] hover:underline mr-3"
                      >
                        {page.isActive ? 'Hide' : 'Make live'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePage(page)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editingPageId === page._id && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2">
                        <PseoPageEditor
                          page={page}
                          onCancel={() => setEditingPageId(null)}
                          onSaved={async () => {
                            setEditingPageId(null);
                            await load();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
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
