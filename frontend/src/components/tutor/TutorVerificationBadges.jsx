/**
 * Qualifications + DBS verification badges for tutor surfaces (listings, profile, bookings).
 */
import { CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * @param {Object} props
 * @param {boolean} [props.isVerified] - Admin-approved qualifications / tutor verification
 * @param {boolean} [props.isDbsVerified] - DBS document approved
 * @param {'default' | 'icons'} [props.variant] - default: pill with label; icons: compact icon-only (e.g. landing cards)
 * @param {boolean} [props.onDarkBackground] - light pills for navy hero banners
 * @param {string} [props.className]
 */
export function TutorVerificationBadges({
  isVerified = false,
  isDbsVerified = false,
  variant = 'default',
  onDarkBackground = false,
  className = '',
}) {
  if (!isVerified && !isDbsVerified) return null;

  if (variant === 'icons') {
    return (
      <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
        {isVerified && (
          <span
            className="inline-flex items-center rounded-full bg-emerald-100 p-0.5"
            title="Qualifications verified"
          >
            <CheckCircle size={14} className="text-emerald-600 shrink-0" />
          </span>
        )}
        {isDbsVerified && (
          <span
            className="inline-flex items-center rounded-full bg-blue-100 p-0.5"
            title="DBS verified"
          >
            <ShieldCheck size={14} className="text-blue-600 shrink-0" />
          </span>
        )}
      </span>
    );
  }

  const verifiedCls = onDarkBackground
    ? 'inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-white'
    : 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700';
  const dbsCls = onDarkBackground
    ? 'inline-flex items-center gap-1 rounded-full border border-sky-300/40 bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-white'
    : 'inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700';

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {isVerified && (
        <span className={verifiedCls} title="Qualifications verified by Best Choice Tutors">
          <CheckCircle size={14} className="shrink-0" />
          Verified
        </span>
      )}
      {isDbsVerified && (
        <span className={dbsCls} title="DBS certificate verified">
          <ShieldCheck size={14} className="shrink-0" />
          DBS
        </span>
      )}
    </span>
  );
}
