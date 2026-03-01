/**
 * Profile avatar – shows profile photo if available, otherwise a user icon.
 * Does not use any image assets; uses SVG icon for fallback.
 */

const ProfileIcon = ({ className = 'h-1/2 w-1/2' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

/**
 * @param {Object} props
 * @param {string|null|undefined} props.src - Profile photo URL
 * @param {string} [props.alt] - Alt text for img
 * @param {string} [props.className] - Classes for container/img (e.g. size, rounded-full)
 * @param {string} [props.iconClassName] - Classes for the fallback icon
 * @param {string} [props.fallbackClassName] - Extra classes for fallback container (e.g. bg-white/10)
 */
export function ProfileAvatar({ src, alt = 'Profile', className = '', iconClassName = 'h-1/2 w-1/2', fallbackClassName = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-slate-200 text-slate-500 ${className} ${fallbackClassName}`.trim()}>
      <ProfileIcon className={iconClassName} />
    </div>
  );
}
