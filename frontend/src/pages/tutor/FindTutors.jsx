/**
 * Find Tutors
 *
 * Subject-based tutor results page: a persistent filter sidebar on the left and
 * a responsive card grid on the right, followed by the shared FAQ and footer.
 *
 * Filtering is split deliberately. Subject, price, teaching mode and gender are
 * sent to GET /api/tutors so the server does the work and pagination stays
 * correct.
 * Experience level is applied to the returned page in the browser, because the
 * API has no such parameter and `experienceYears` is already in the response —
 * that keeps the backend untouched, at the cost of the count reflecting the
 * current page only, which the UI states rather than hides.
 *
 * Availability and language filters are intentionally absent: neither exists on
 * the tutor record, so they could not filter anything.
 *
 * Accent colour: this page uses the indigo from the supplied design rather than
 * the site's teal. Scoped here on purpose; the rest of the site is unchanged.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Loader2,
  SlidersHorizontal,
  BookOpen,
  ShieldCheck,
  CalendarClock,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Header from '@/components/landing/Header';
import FaqSection from '@/components/landing/FaqSection';
import FooterSection from '@/components/landing/FooterSection';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { DecodedImage } from '@/components/DecodedImage';
import { TutorVerificationBadges } from '@/components/tutor/TutorVerificationBadges';
import { getAllTutors } from '@/services/tutorService';
import { isAuthenticated } from '@/lib/auth';
import { localImageUrl } from '@/utils/s3Assets';
import {
  CANONICAL_SUBJECTS,
  SUBJECT_OTHER,
  slugToSubject,
  tutorSearchPath,
} from '@/constants/subjects';
import '@/styles/LandingPage.css';

/** Subjects offered in the sidebar, excluding the free-text "Other" option. */
const SUBJECT_OPTIONS = CANONICAL_SUBJECTS.filter((subject) => subject !== SUBJECT_OTHER);

/** Teaching modes, matching the values the API accepts. */
const MODE_OPTIONS = [
  { value: 'Online', label: 'Online' },
  { value: 'In-Person', label: 'In-Person' },
];

/**
 * Gender values, matching the values the API accepts. Tutors who have not
 * recorded a gender are excluded whenever one of these is selected.
 */
const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

/**
 * Experience bands. The API returns `experienceYears`, so these are applied in
 * the browser rather than sent to the server.
 */
const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', min: 0, max: 2 },
  { value: 'intermediate', label: 'Intermediate', min: 3, max: 7 },
  { value: 'advanced', label: 'Advanced', min: 8, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'best', label: 'Best Match' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

/** Hero image. Swap this file to change the artwork; no code change needed. */
const heroGraphic = localImageUrl('images/find-tutor-hero.jpg');

const PRICE_FLOOR = 0;
const PRICE_CEILING = 300;
const PAGE_SIZE = 9;

/**
 * Where a signed-out visitor is sent when they try to open a profile or book.
 * Browsing is public; acting on a tutor requires an account.
 */
const GUEST_SIGN_UP = '/register?role=learner&from=tutor-search';

/**
 * Pick the qualification shown on a card. Tutors may have several, so the first
 * is used as the headline credential.
 *
 * @param {Object} tutor
 * @returns {string} Qualification title, or an empty string when none exists.
 */
function primaryQualification(tutor) {
  const qualifications = tutor.qualifications;
  if (!Array.isArray(qualifications) || qualifications.length === 0) return '';
  const first = qualifications[0];
  return first?.title || first?.degree || '';
}

/**
 * Decide whether a tutor falls inside the selected experience bands.
 *
 * @param {Object} tutor
 * @param {string[]} levels - Selected level values; empty means no restriction.
 * @returns {boolean}
 */
function matchesExperience(tutor, levels) {
  if (levels.length === 0) return true;
  const years = Number(tutor.experienceYears) || 0;
  return levels.some((value) => {
    const band = EXPERIENCE_LEVELS.find((level) => level.value === value);
    return band ? years >= band.min && years <= band.max : true;
  });
}

/** Small pill used for the trust badges in the hero. */
function TrustChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
      <Icon className="h-4 w-4 shrink-0 text-[#1A365D]" aria-hidden />
      {label}
    </span>
  );
}

/** Checkbox row used throughout the filter sidebar. */
function FilterCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
      />
      {label}
    </label>
  );
}

/**
 * One tutor result card.
 *
 * @param {Object} tutor - Tutor as returned by GET /api/tutors.
 * @param {(tutor: Object) => void} onView - Opens the full profile.
 * @param {(tutor: Object) => void} onBook - Starts the booking flow.
 */
function TutorResultCard({ tutor, onView, onBook }) {
  const [saved, setSaved] = useState(false);
  const qualification = primaryQualification(tutor);

  return (
    <article className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Fixed image height keeps every card in a row the same height. */}
      <div className="relative">
        {tutor.profilePhoto ? (
          <DecodedImage
            src={tutor.profilePhoto}
            alt={tutor.fullName || 'Tutor'}
            className="w-full h-52 object-contain bg-slate-100"
          />
        ) : (
          <div className="w-full h-52 bg-slate-100 flex items-center justify-center text-slate-300">
            <BookOpen className="h-7 w-7" aria-hidden />
          </div>
        )}

        {tutor.mode && (
          <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/95 text-[#1A365D] shadow-sm">
            {tutor.mode}
          </span>
        )}

        <button
          type="button"
          onClick={() => setSaved((current) => !current)}
          aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
          aria-pressed={saved}
          className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/95 shadow-sm flex items-center justify-center"
        >
          <Heart
            className={`h-3.5 w-3.5 ${saved ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
            aria-hidden
          />
        </button>
      </div>

      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-[#1A365D] leading-snug truncate">
              {tutor.fullName}
            </h3>
            <TutorVerificationBadges
              isVerified={tutor.isVerified}
              isDbsVerified={tutor.isDbsVerified}
              variant="icons"
            />
          </span>
          {tutor.hourlyRate != null && (
            <span className="text-sm font-semibold text-[#1A365D] whitespace-nowrap">
              £{Number(tutor.hourlyRate).toFixed(2)}
              <span className="text-[11px] font-normal text-slate-400">/hr</span>
            </span>
          )}
        </div>

        {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tutor.subjects.slice(0, 2).map((subject) => (
              <span
                key={subject}
                className="text-[11px] px-2 py-0.5 rounded bg-[#4F46E5]/10 text-[#1A365D]"
              >
                {subject}
              </span>
            ))}
          </div>
        )}

        {/* Pushed to the bottom so the buttons line up across a row even when
            one tutor has no qualification recorded. */}
        <div className="mt-2.5 space-y-0.5 text-[11px] text-slate-500">
          {tutor.experienceYears != null && <p>{tutor.experienceYears}+ Years Experience</p>}
          {qualification && <p>{qualification}</p>}
        </div>

        <div className="mt-auto pt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-8 px-2 text-xs"
            onClick={() => onView(tutor)}
          >
            View Profile
          </Button>
          <Button
            type="button"
            // Same red as "Book a Tutor" in the header (--button-red), which
            // dims on hover rather than switching to a second shade. The
            // hover background is restated because the Button component's
            // default variant carries hover:bg-primary/90 - without it, the
            // button turns blue on hover.
            className="flex-1 h-8 px-2 text-xs bg-[#FF6B6B] hover:bg-[#FF6B6B] hover:opacity-90 text-white"
            onClick={() => onBook(tutor)}
          >
            Book Tutor
          </Button>
        </div>
      </div>
    </article>
  );
}

/**
 * The filter controls, shared by the desktop sidebar and the mobile drawer.
 *
 * Availability and language filters from the reference design are deliberately
 * absent: neither field exists on the tutor record, so they could not filter
 * anything.
 */
function FilterPanel({ draft, setDraft, toggleInDraft, onApply, onClearAll }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1A365D] inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filter Tutors
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-[#1A365D] hover:text-[#0F172A] font-medium"
        >
          Clear all
        </button>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Subject
        </h3>
        {/* Chips for what is chosen, plus a picker for adding more. Matches the
            reference and keeps the panel short regardless of subject count. */}
        {draft.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {draft.subjects.map((subject) => (
              <span
                key={subject}
                className="inline-flex items-center gap-1 text-xs pl-2 pr-1 py-1 rounded-md bg-[#4F46E5]/10 text-[#1A365D]"
              >
                {subject}
                <button
                  type="button"
                  onClick={() => toggleInDraft('subjects', subject)}
                  aria-label={`Remove ${subject}`}
                  className="h-4 w-4 rounded-full hover:bg-[#4F46E5]/20 flex items-center justify-center"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
        <select
          value=""
          onChange={(event) => {
            if (event.target.value) toggleInDraft('subjects', event.target.value);
          }}
          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          aria-label="Add a subject"
        >
          <option value="">
            {draft.subjects.length > 0 ? 'Add another subject' : 'All subjects'}
          </option>
          {SUBJECT_OPTIONS.filter((subject) => !draft.subjects.includes(subject)).map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Price Range
        </h3>
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEILING}
          step={5}
          value={draft.maxPrice}
          onChange={(event) => setDraft({ ...draft, maxPrice: Number(event.target.value) })}
          className="w-full accent-[#1A365D]"
          aria-label="Maximum hourly rate"
        />
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span>£{PRICE_FLOOR}</span>
          <span className="font-medium text-slate-700">Up to £{draft.maxPrice}/hr</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Tutor Type
        </h3>
        <div className="space-y-1.5">
          {MODE_OPTIONS.map((mode) => (
            <FilterCheckbox
              key={mode.value}
              label={mode.label}
              checked={draft.modes.includes(mode.value)}
              onChange={() => toggleInDraft('modes', mode.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Experience Level
        </h3>
        <div className="space-y-1.5">
          {EXPERIENCE_LEVELS.map((level) => (
            <FilterCheckbox
              key={level.value}
              label={level.label}
              checked={draft.levels.includes(level.value)}
              onChange={() => toggleInDraft('levels', level.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Gender
        </h3>
        <div className="space-y-1.5">
          {GENDER_OPTIONS.map((gender) => (
            <FilterCheckbox
              key={gender.value}
              label={gender.label}
              checked={draft.genders.includes(gender.value)}
              onChange={() => toggleInDraft('genders', gender.value)}
            />
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={onApply}
        className="w-full h-9 text-sm bg-[#1A365D] hover:bg-[#0F172A] text-white"
      >
        <SlidersHorizontal className="h-4 w-4 mr-1.5" aria-hidden />
        Apply Filters
      </Button>
    </div>
  );
}

export default function FindTutors() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subjectSlug } = useParams();
  const { pathname } = useLocation();

  // The subject lives in the path (/tutors/subject/english), so the URL reads
  // as a page rather than a query. Everything else stays a query parameter,
  // because those are transient filters rather than a place on the site.
  const pathSubject = slugToSubject(subjectSlug);

  // Links written before the move still arrive as /tutors?subject=English.
  // Rewrite them once so a page has a single address and old links keep working.
  const legacySubject = searchParams.get('subject');
  useEffect(() => {
    if (!legacySubject) return;
    const query = new URLSearchParams(searchParams);
    query.delete('subject');
    const search = query.toString();
    const target = tutorSearchPath(slugToSubject(legacySubject));
    navigate(`${target}${search ? `?${search}` : ''}`, { replace: true });
  }, [legacySubject, searchParams, navigate]);

  // Keep one canonical URL per subject: an unknown slug falls back to the full
  // list, and a slug that is merely miscased is corrected rather than served.
  useEffect(() => {
    if (!subjectSlug) return;
    const canonicalPath = tutorSearchPath(pathSubject);
    if (canonicalPath === `/tutors/subject/${subjectSlug}`) return;
    const search = searchParams.toString();
    navigate(`${canonicalPath}${search ? `?${search}` : ''}`, { replace: true });
  }, [subjectSlug, pathSubject, searchParams, navigate]);

  // Draft holds what the sidebar shows; applied is what the query actually uses,
  // so the results only change when "Apply Filters" is pressed.
  // Seed from the URL so a search started on the home page or the Subjects menu
  // arrives with its filters already applied.
  const initialFilters = useMemo(() => {
    const subject = pathSubject || '';
    const mode = searchParams.get('mode') || '';
    const gender = (searchParams.get('gender') || '').toUpperCase();
    const priceMax = Number(searchParams.get('priceMax'));
    return {
      subjects: subject ? [subject] : [],
      modes: MODE_OPTIONS.some((option) => option.value === mode) ? [mode] : [],
      genders: GENDER_OPTIONS.some((option) => option.value === gender) ? [gender] : [],
      levels: [],
      maxPrice: Number.isFinite(priceMax) && priceMax > 0 ? priceMax : PRICE_CEILING,
    };
    // Only the first render seeds from the URL. Later URL changes are handled by
    // the sync effect below, which keeps this from re-running on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);

  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });

  // The page number lives in the URL rather than in component state, so each
  // page is its own history entry and the browser Back button steps back
  // through the pages actually visited. Held in state, Back would leave the
  // page entirely and any link to page 4 would open on page 1.
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const [sort, setSort] = useState('best');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Picking a different subject in the header changes the path while this
  // component stays mounted, so the seeded state above never re-runs.
  // Watching the resolved subject keeps the page in step with the URL.
  const urlSubject = pathSubject || '';
  const appliedSubject = applied.subjects[0] || '';

  useEffect(() => {
    if (urlSubject === appliedSubject) return;
    const withUrlSubject = (current) => ({
      ...current,
      subjects: urlSubject ? [urlSubject] : [],
    });
    setDraft(withUrlSubject);
    setApplied(withUrlSubject);
  }, [urlSubject, appliedSubject]);

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTutors({
        // The API takes a single subject; the first selected drives the query and
        // any others are narrowed in the browser below.
        subject: applied.subjects[0] || undefined,
        mode: applied.modes.length === 1 ? applied.modes[0] : undefined,
        // The API takes a single gender, so selecting both is the same as
        // selecting neither: no restriction.
        gender: applied.genders.length === 1 ? applied.genders[0] : undefined,
        priceMax: applied.maxPrice < PRICE_CEILING ? applied.maxPrice : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTutors(Array.isArray(data.tutors) ? data.tutors : []);
      setPagination(data.pagination || { page: 1, totalPages: 0, totalCount: 0 });
    } catch (err) {
      setError(err.message || 'Could not load tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  /** Narrow the current page by the filters the API cannot apply. */
  const visibleTutors = useMemo(() => {
    let rows = tutors.filter((tutor) => matchesExperience(tutor, applied.levels));

    // Both modes selected is the same as no restriction, so only the
    // multi-select case needs handling here.
    if (applied.modes.length > 1) {
      rows = rows.filter((tutor) => applied.modes.includes(tutor.mode) || tutor.mode === 'Both');
    }
    if (applied.subjects.length > 1) {
      rows = rows.filter((tutor) =>
        (tutor.subjects || []).some((subject) => applied.subjects.includes(subject)),
      );
    }

    const sorted = [...rows];
    if (sort === 'price-asc') sorted.sort((a, b) => (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0));
    if (sort === 'price-desc') sorted.sort((a, b) => (b.hourlyRate ?? 0) - (a.hourlyRate ?? 0));
    return sorted;
  }, [tutors, applied, sort]);

  /**
   * Open a tutor's profile, or send a signed-out visitor to sign up first.
   * Mirrors how the landing page cards already treat guests.
   *
   * @param {Object} tutor - The selected tutor.
   */
  const openTutor = (tutor) => {
    navigate(isAuthenticated() ? `/dashboard/tutors/${tutor.id}` : GUEST_SIGN_UP);
  };

  const toggleInDraft = (key, value) => {
    setDraft((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  /**
   * Build the URL for a set of filters: subject in the path, the rest in the
   * query string. Returns a single string so callers can navigate in one step.
   *
   * @param {Object} filters - Draft or cleared filter state.
   * @returns {string}
   */
  const urlForFilters = (filters) => {
    const query = new URLSearchParams(searchParams);
    // The subject is no longer a parameter; drop any left by an older link.
    query.delete('subject');
    // Changing the filters changes what the results are, so start again at the
    // first page rather than landing on a page number that may no longer exist.
    query.delete('page');
    if (filters.genders.length === 1) query.set('gender', filters.genders[0]);
    else query.delete('gender');
    const search = query.toString();
    return `${tutorSearchPath(filters.subjects[0])}${search ? `?${search}` : ''}`;
  };

  /**
   * Move to a page, adding a history entry so Back returns to the previous one.
   * Page 1 is written as a bare URL rather than "?page=1", keeping the common
   * case clean and giving each page a single address.
   *
   * @param {number} next - 1-based page number.
   */
  const goToPage = (next) => {
    const target = Math.min(Math.max(1, next), Math.max(1, pagination.totalPages));
    if (target === page) return;
    const query = new URLSearchParams(searchParams);
    if (target > 1) query.set('page', String(target));
    else query.delete('page');
    const search = query.toString();
    navigate(`${pathname}${search ? `?${search}` : ''}`);
  };

  const handleApply = () => {
    setApplied(draft);
    setFiltersOpen(false);
    navigate(urlForFilters(draft), { replace: true });
  };

  const handleClearAll = () => {
    const cleared = {
      subjects: [],
      modes: [],
      genders: [],
      levels: [],
      maxPrice: PRICE_CEILING,
    };
    setDraft(cleared);
    setApplied(cleared);
    navigate(urlForFilters(cleared), { replace: true });
  };

  const activeSubject = applied.subjects[0] || '';
  // The count reflects the current page whenever a browser-side filter is on,
  // because the server does not know about those filters.
  const isNarrowedLocally =
    applied.levels.length > 0 || applied.modes.length > 1 || applied.subjects.length > 1;
  const resultCount = isNarrowedLocally ? visibleTutors.length : pagination.totalCount;

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Seo
        title={
          activeSubject
            ? `${activeSubject} Tutors | Best Choice Tutors`
            : 'Find Your Perfect Tutor | Best Choice Tutors'
        }
        description="Browse verified tutors, compare profiles and rates, and book the right tutor for your learning goals."
      />
      <Header />

      <main className="flex-1 bg-slate-50">
        {/* Hero: one banner card holding the copy and the photograph, so the
            section reads as a single unit rather than text beside an image. */}
        <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EEF2FB] via-[#F4F7FC] to-[#E7EEF9]">
              {/* Soft wave in the lower left, matching the reference artwork. */}
              <div
                className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-[560px] rounded-[100%] bg-[#C7D2FE]/40 blur-2xl"
                aria-hidden="true"
              />

              {/* The copy sets the banner height and the photograph is absolutely
                  positioned over the right half, so the image's own proportions
                  cannot stretch the banner into a tall block. min-height keeps the
                  short, wide strip the design calls for without ever clipping. */}
              <div className="relative lg:min-h-[330px] flex items-center">
                <div className="w-full lg:w-1/2 px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
                  {activeSubject && (
                    <span className="inline-flex items-center gap-2.5 text-sm font-semibold pl-3 pr-4 py-1.5 rounded-full bg-white/95 text-[#1A365D] shadow-sm mb-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4F46E5]/15">
                        <BookOpen className="h-3.5 w-3.5 text-[#1A365D]" aria-hidden />
                      </span>
                      {activeSubject}
                    </span>
                  )}

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A365D] tracking-tight leading-tight">
                    Find Your <br className="hidden sm:block" />
                    <span className="text-[#1A365D]">Perfect Tutor</span>
                  </h1>

                  <p className="mt-3 text-sm text-slate-600 max-w-md">
                    Browse experienced tutors, compare their profiles, and find the right tutor for
                    your learning goals.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-y-3">
                    <TrustChip icon={ShieldCheck} label="Verified Tutors" />
                    <span className="mx-5 h-5 w-px bg-slate-300/80" aria-hidden />
                    <TrustChip icon={CalendarClock} label="Flexible Scheduling" />
                    <span className="mx-5 h-5 w-px bg-slate-300/80" aria-hidden />
                    <TrustChip icon={Lock} label="Safe & Secure" />
                  </div>
                </div>

                {/* Decorative: the copy above already conveys everything, so this
                    is hidden from assistive tech and dropped on small screens. */}
                <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2" aria-hidden="true">
                  <img
                    src={heroGraphic}
                    alt=""
                    width={1040}
                    height={810}
                    className="w-full h-full object-cover object-[center_30%] select-none"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
            {/* Filter sidebar: same markup drives the desktop rail and the
                mobile drawer, so the two can never drift apart. */}
            <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
              <FilterPanel
                draft={draft}
                setDraft={setDraft}
                toggleInDraft={toggleInDraft}
                onApply={handleApply}
                onClearAll={handleClearAll}
              />
            </aside>

            {/* Results */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="lg:hidden h-9 text-sm"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1.5" aria-hidden />
                  Filter Tutors
                </Button>
                <h2 className="font-semibold text-[#1A365D]">
                  {loading ? 'Loading tutors…' : `${resultCount} Tutors Available`}
                  {isNarrowedLocally && !loading && (
                    <span className="ml-2 text-xs font-normal text-slate-400">on this page</span>
                  )}
                </h2>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  Sort by
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                  <p className="text-sm text-red-700">{error}</p>
                  <Button type="button" variant="outline" className="mt-3" onClick={fetchTutors}>
                    Try again
                  </Button>
                </div>
              ) : visibleTutors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3" aria-hidden />
                  <p className="font-medium text-[#1A365D]">No tutors match these filters</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Try widening the price range or clearing a filter.
                  </p>
                  <Button type="button" variant="outline" className="mt-4" onClick={handleClearAll}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {visibleTutors.map((tutor) => (
                      <TutorResultCard
                        key={tutor.id}
                        tutor={tutor}
                        onView={openTutor}
                        onBook={openTutor}
                      />
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <nav
                      className="mt-8 flex items-center justify-center gap-1"
                      aria-label="Pagination"
                    >
                      <button
                        type="button"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 flex items-center justify-center"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
                        .filter(
                          (number) =>
                            number === 1 ||
                            number === pagination.totalPages ||
                            Math.abs(number - page) <= 1,
                        )
                        .map((number) => (
                          <button
                            key={number}
                            type="button"
                            onClick={() => goToPage(number)}
                            aria-current={number === page ? 'page' : undefined}
                            className={`h-9 w-9 rounded-lg text-sm font-medium border ${
                              number === page
                                ? 'bg-[#1A365D] border-[#1A365D] text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() =>
                          goToPage(page + 1)
                        }
                        disabled={page === pagination.totalPages}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 flex items-center justify-center"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        </div>

        {/* Mobile filter drawer: the sidebar is hidden below lg, so the same
            controls are reachable from a slide-over instead. */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter tutors">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-slate-50 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
                <span className="font-semibold text-[#1A365D]">Filter Tutors</span>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-slate-500" aria-hidden />
                </button>
              </div>
              <div className="p-4">
                <FilterPanel
                  draft={draft}
                  setDraft={setDraft}
                  toggleInDraft={toggleInDraft}
                  onApply={handleApply}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>
          </div>
        )}

        {/* Shared sections, reused as-is */}
        {/* Answers for the subject being browsed. The section hides itself
            when that subject has none; general FAQs never appear here. */}
        <FaqSection subject={activeSubject || undefined} />
      </main>

      <FooterSection />
    </div>
  );
}
