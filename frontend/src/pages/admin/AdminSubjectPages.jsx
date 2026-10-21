/**
 * Admin Subject Pages
 *
 * One editor per subject page (/tutors/subject/<slug>): the search engine
 * listing (page title, meta description, URL slug) and the on-page copy.
 *
 * The URL slug works like a URL handle in a shop builder: changing it moves
 * the page, and with "Create a URL redirect" ticked the old address forwards
 * to the new one, so existing links and search results keep working.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, ImagePlus, Loader2, Pencil, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { getAdminSubjects, updateAdminSubject } from '@/services/subjectPageService';
import { uploadBlogImageAdmin } from '@/services/blogService';
import { subjectToSlug } from '@/constants/subjects';

const SITE_HOST = 'bestchoicetutors.com';
const PATH_PREFIX = '/tutors/subject/';
const TITLE_LIMIT = 70;
const DESCRIPTION_LIMIT = 160;
const DEFAULT_DESCRIPTION =
  'Browse verified tutors, compare profiles and rates, and book the right tutor for your learning goals.';

/** The editable fields of a subject record. */
function toForm(subject) {
  return {
    slug: subject.slug || '',
    seoTitle: subject.seoTitle || '',
    metaDescription: subject.metaDescription || '',
    h1: subject.h1 || '',
    intro: subject.intro || '',
    content: subject.content || '',
    imageUrl: subject.imageUrl || '',
    imageAlt: subject.imageAlt || '',
  };
}

/** Character counter that turns amber past the recommended length. */
function Counter({ value, limit }) {
  const length = value.length;
  return (
    <span className={`text-xs ${length > limit ? 'text-amber-600' : 'text-slate-400'}`}>
      {length} of {limit} characters used
    </span>
  );
}

/** Preview of how the page may appear in Google's results. */
function SearchPreview({ title, description, slug }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 mb-1">Search engine listing preview</p>
      <p className="text-sm text-slate-700 truncate">
        {SITE_HOST} › tutors › subject › {slug || '…'}
      </p>
      <p className="text-lg text-[#1a0dab] leading-snug truncate">{title}</p>
      <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
    </div>
  );
}

/**
 * Editor for one subject page.
 */
function SubjectEditor({ subject, onSaved, onClose }) {
  const [form, setForm] = useState(() => toForm(subject));
  const [createRedirect, setCreateRedirect] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(toForm(subject));
    setCreateRedirect(true);
  }, [subject]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const slugChanged = form.slug !== subject.slug;
  const titlePreview = form.seoTitle || `${subject.name} Tutors | Best Choice Tutors`;
  const descriptionPreview = form.metaDescription || DEFAULT_DESCRIPTION;

  const handleImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadBlogImageAdmin(file);
      set('imageUrl', uploaded.imageUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const slug = subjectToSlug(form.slug);
    if (!slug) {
      toast.error('URL slug is required');
      return;
    }
    setSaving(true);
    try {
      const result = await updateAdminSubject(subject.name, { ...form, slug, createRedirect });
      if (result.redirect) {
        toast.success(`Saved. ${result.redirect.sourcePath} now redirects to ${result.redirect.targetUrl}`);
      } else {
        toast.success(result.message || 'Subject page updated');
      }
      onSaved(result.subject);
    } catch (err) {
      toast.error(err.message || 'Failed to save subject page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base text-[#1A365D]">{subject.name} page</CardTitle>
          <CardDescription>
            <a
              href={`${PATH_PREFIX}${subject.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              {PATH_PREFIX}
              {subject.slug}
              <ExternalLink size={12} />
            </a>
          </CardDescription>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close editor">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1A365D]">Search engine listing</h3>
          <SearchPreview title={titlePreview} description={descriptionPreview} slug={form.slug} />

          <label className="block">
            <span className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
              Page title
              <Counter value={form.seoTitle} limit={TITLE_LIMIT} />
            </span>
            <Input
              value={form.seoTitle}
              placeholder={`${subject.name} Tutors | Best Choice Tutors`}
              onChange={(event) => set('seoTitle', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
              Meta description
              <Counter value={form.metaDescription} limit={DESCRIPTION_LIMIT} />
            </span>
            <Textarea
              rows={3}
              value={form.metaDescription}
              placeholder={DEFAULT_DESCRIPTION}
              onChange={(event) => set('metaDescription', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">URL handle</span>
            <div className="flex items-stretch rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#4FD1C5]">
              <span className="px-3 flex items-center bg-slate-50 text-sm text-slate-500 whitespace-nowrap">
                {SITE_HOST}
                {PATH_PREFIX}
              </span>
              <input
                className="flex-1 min-w-0 px-3 py-2 text-sm outline-none"
                value={form.slug}
                onChange={(event) => set('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                onBlur={() => set('slug', subjectToSlug(form.slug))}
                aria-describedby="subject-slug-hint"
              />
            </div>
            <span id="subject-slug-hint" className="block text-xs text-slate-400 mt-1">
              Lowercase letters, numbers and hyphens.
            </span>
          </label>

          {slugChanged && (
            <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={createRedirect}
                onChange={(event) => setCreateRedirect(event.target.checked)}
              />
              <span>
                Create a URL redirect from{' '}
                <span className="font-mono text-xs">{PATH_PREFIX}{subject.slug}</span> to{' '}
                <span className="font-mono text-xs">{PATH_PREFIX}{subjectToSlug(form.slug) || '…'}</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Keeps links and search results pointing at the old address working.
                </span>
              </span>
            </label>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1A365D]">Page content</h3>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Main heading (H1)</span>
            <Input
              value={form.h1}
              placeholder="Find Your Perfect Tutor"
              onChange={(event) => set('h1', event.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Intro</span>
            <Textarea
              rows={3}
              value={form.intro}
              placeholder="Browse experienced tutors, compare their profiles, and find the right tutor for your learning goals."
              onChange={(event) => set('intro', event.target.value)}
            />
          </label>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Content below the tutor list
            </span>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((current) => ({ ...current, content: html }))}
              placeholder={`Write about ${subject.name} tutoring - levels covered, exam boards, how sessions work...`}
            />
          </div>

          <div role="group" aria-labelledby={`subject-image-${subject.slug}`}>
            <span id={`subject-image-${subject.slug}`} className="block text-sm font-medium text-slate-700 mb-1">
              Share image
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleImage(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <div className="flex flex-wrap items-start gap-4">
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt={form.imageAlt || `${subject.name} share image`}
                  className="h-24 w-44 rounded-lg border border-slate-200 object-cover bg-slate-50"
                />
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {form.imageUrl ? 'Replace image' : 'Upload image'}
                </Button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, imageUrl: '', imageAlt: '' }))}
                    className="text-left text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
            {form.imageUrl && (
              <Input
                className="mt-2"
                value={form.imageAlt}
                placeholder="Describe the image"
                onChange={(event) => set('imageAlt', event.target.value)}
              />
            )}
            <span className="block text-xs text-slate-400 mt-1">
              Shown when the page is shared on social media. Blank uses the site logo.
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Questions and answers for this subject are managed in the FAQs tab: choose{' '}
            <span className="font-medium">{subject.name}</span> as the subject.
          </p>
        </section>

        <div className="flex gap-3">
          <Button
            type="button"
            disabled={saving || uploading}
            onClick={handleSave}
            className="bg-[#4FD1C5] hover:bg-[#38B2AC] text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save subject page
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * List of subject pages with an editor for the selected one.
 */
export default function AdminSubjectPages() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminSubjects()
      .then((data) => setSubjects(data.subjects || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (updated) => {
    setSubjects((current) => current.map((subject) => (subject.name === updated.name ? updated : subject)));
    setEditing(updated);
  };

  const editingSubject = editing && subjects.find((subject) => subject.name === editing.name);
  const editorRef = useRef(null);

  // The list is long, so bring the editor into view when a subject is opened.
  useEffect(() => {
    if (editing?.name) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing?.name]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1A365D]">Subject pages</CardTitle>
          <CardDescription>
            Page title, meta description, URL and content for each subject page. Search changes
            reach Google with the next site build.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#4FD1C5]" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map((subject) => (
                <div key={subject.name} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A365D]">{subject.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {PATH_PREFIX}
                      {subject.slug}
                      {subject.seoTitle ? ` · ${subject.seoTitle}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(subject)}
                    className="gap-1.5 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={editorRef}>
        {editingSubject && (
          <SubjectEditor
            subject={editingSubject}
            onSaved={handleSaved}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  );
}
