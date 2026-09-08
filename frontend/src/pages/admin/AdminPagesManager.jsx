/**
 * Admin Pages Manager
 *
 * Tabbed editor for the copy on the public pages. Each page tab renders one
 * form per section, built from the registry the backend returns, so adding a
 * newly editable section on the server surfaces here without a frontend change.
 *
 * The Why Choose Us and FAQ tabs embed their existing managers unchanged, so
 * every piece of editable page content sits behind one menu item.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Home,
  Info,
  Workflow,
  BookOpen,
  BadgeCheck,
  HelpCircle,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AdminBenefitManager from './AdminBenefitManager';
import AdminFaqManager from './AdminFaqManager';
import {
  getPageRegistry,
  getAdminPageContent,
  updatePageSection,
  resetPageSection,
} from '@/services/pageContentService';

/** Tabs shown across the top. The last two embed existing managers. */
const TABS = [
  { key: 'home', label: 'Home', icon: Home, type: 'page' },
  { key: 'about', label: 'About Us', icon: Info, type: 'page' },
  { key: 'how-it-works', label: 'How It Works', icon: Workflow, type: 'page' },
  { key: 'subjects', label: 'Subjects', icon: BookOpen, type: 'page' },
  { key: 'benefits', label: 'Why Choose Us', icon: BadgeCheck, type: 'embed' },
  { key: 'faq', label: 'FAQs', icon: HelpCircle, type: 'embed' },
];

/** Human labels for the generic content fields. */
const FIELD_LABELS = {
  heading: 'Heading',
  subheading: 'Subheading',
  body: 'Body text',
  ctaLabel: 'Button label',
  ctaHref: 'Button link',
  imageUrl: 'Image URL',
  imageAlt: 'Image alt text',
};

/** Fields rendered as a multi-line input. */
const MULTILINE_FIELDS = new Set(['body', 'subheading']);

/** Human labels for the per-item fields. */
const ITEM_FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  imageUrl: 'Image URL',
  imageAlt: 'Image alt text',
  linkUrl: 'Link URL',
};

/** Item fields rendered as a multi-line input. */
const MULTILINE_ITEM_FIELDS = new Set(['description']);

/**
 * Item fields a section uses. Sections declare this so the editor never offers
 * an input the component cannot render - a bullet has no image, for example.
 * Falls back to title and description for any section that omits it.
 */
function itemFieldsFor(section) {
  return section.itemFields && section.itemFields.length > 0
    ? section.itemFields
    : ['title', 'description'];
}

/**
 * Editor for a single section of a page.
 *
 * @param {string} pageKey
 * @param {Object} section - Registry entry describing which fields to show.
 * @param {Object|null} saved - Stored content, or null when using defaults.
 * @param {Function} onSaved - Called after a successful save or reset.
 */
function SectionForm({ pageKey, section, saved, onSaved }) {
  const [values, setValues] = useState({});
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Re-seed whenever a different section or freshly loaded content arrives.
  useEffect(() => {
    const next = {};
    for (const field of section.fields) {
      if (field === 'items') continue;
      next[field] = saved?.[field] ?? '';
    }
    setValues(next);
    setItems(saved?.items ? saved.items.map((item) => ({ ...item })) : []);
  }, [section, saved]);

  const showItems = section.fields.includes('items');

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...values };
      if (showItems) payload.items = items;
      await updatePageSection(pageKey, section.sectionKey, payload);
      toast.success(`${section.label} saved successfully`);
      await onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset this section to the original built-in text?')) return;
    try {
      await resetPageSection(pageKey, section.sectionKey);
      toast.success(`${section.label} reset to default`);
      await onSaved();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-slate-900">{section.label}</h3>
        {saved ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Customised</Badge>
        ) : (
          <Badge className="bg-slate-200 text-slate-500 hover:bg-slate-200">Using default</Badge>
        )}
      </div>

      {section.fields
        .filter((field) => field !== 'items')
        .map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {FIELD_LABELS[field] || field}
            </label>
            {MULTILINE_FIELDS.has(field) ? (
              <Textarea
                rows={field === 'body' ? 5 : 2}
                value={values[field] ?? ''}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                placeholder={section.defaults?.[field] || 'Leave blank to keep the current text'}
              />
            ) : (
              <Input
                value={values[field] ?? ''}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                placeholder={section.defaults?.[field] || 'Leave blank to keep the current text'}
              />
            )}
          </div>
        ))}

      {showItems && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Items {section.itemHint ? <span className="font-normal text-slate-400">- {section.itemHint}</span> : null}
          </label>

          {items.length === 0 ? (
            <p className="text-sm text-slate-500">
              This section has no list items.
            </p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <span className="text-xs font-medium text-slate-500">Item {index + 1}</span>
                {itemFieldsFor(section).map((field) => {
                  const update = (value) => {
                    const next = [...items];
                    next[index] = { ...item, [field]: value };
                    setItems(next);
                  };
                  return MULTILINE_ITEM_FIELDS.has(field) ? (
                    <Textarea
                      key={field}
                      rows={2}
                      value={item[field] ?? ''}
                      onChange={(event) => update(event.target.value)}
                      placeholder={ITEM_FIELD_LABELS[field] || field}
                    />
                  ) : (
                    <Input
                      key={field}
                      value={item[field] ?? ''}
                      onChange={(event) => update(event.target.value)}
                      placeholder={ITEM_FIELD_LABELS[field] || field}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white"
        >
          {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
          Save section
        </Button>
        {saved && (
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw size={16} className="mr-1" /> Reset to default
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * All sections for one page.
 *
 * @param {string} pageKey
 * @param {Array} registry - Page definitions from the backend.
 */
function PageEditor({ pageKey, registry }) {
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPageContent(pageKey);
      setSaved(data.sections || {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => {
    load();
  }, [load]);

  const definition = registry.find((page) => page.pageKey === pageKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
      </div>
    );
  }
  if (!definition) return <p className="text-sm text-slate-500">This page is not editable yet.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{definition.description}</p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Sections marked &quot;Using default&quot; show the text already built into the page. Saving a
        section overrides it; resetting restores the original.
      </div>
      {definition.sections.map((section) => (
        <SectionForm
          key={section.sectionKey}
          pageKey={pageKey}
          section={section}
          saved={saved[section.sectionKey] || null}
          onSaved={load}
        />
      ))}
    </div>
  );
}

/**
 * Tabbed container for all editable page content.
 */
export default function AdminPagesManager() {
  const [active, setActive] = useState('home');
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPageRegistry()
      .then((data) => !cancelled && setRegistry(data.pages || []))
      .catch((err) => toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTab = TABS.find((tab) => tab.key === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A365D]">Pages</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit the content shown on the public pages. Changes appear on the website immediately.
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

      {activeTab?.type === 'embed' ? (
        // Existing managers, embedded unchanged.
        active === 'benefits' ? <AdminBenefitManager /> : <AdminFaqManager />
      ) : (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#1A365D]">{activeTab?.label}</CardTitle>
            <CardDescription>Section-by-section content for this page.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#4FD1C5]" />
              </div>
            ) : (
              <PageEditor pageKey={active} registry={registry} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
