import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

/**
 * Profile avatar – shows profile photo if available, otherwise a user icon.
 * No placeholder images; uses SVG user icon when no photo or when image fails to load.
 *
 * Cached photos can load before onLoad attaches; we also reveal when complete after commit.
 * Reset on src runs in useEffect so a new URL after a failed load clears imgError; layout
 * effect depends on imgError so we re-check once the <img> is mounted again.
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
  const [imgError, setImgError] = useState(false);
  const [decoded, setDecoded] = useState(false);
  const imgRef = useRef(null);
  const revealTimeoutRef = useRef(null);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const revealFromElement = useCallback((el) => {
    const show = () => setDecoded(true);
    clearRevealTimeout();
    if (typeof el.decode === 'function') {
      el.decode().then(show).catch(show);
    } else {
      show();
    }
  }, [clearRevealTimeout]);

  useEffect(() => {
    setImgError(false);
    setDecoded(false);
  }, [src]);

  useLayoutEffect(() => {
    if (!src || imgError) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      revealFromElement(el);
    }
  }, [src, imgError, revealFromElement]);

  useEffect(() => {
    if (!src) return undefined;
    revealTimeoutRef.current = setTimeout(() => {
      setDecoded(true);
      revealTimeoutRef.current = null;
    }, 1500);
    return () => clearRevealTimeout();
  }, [src, clearRevealTimeout]);

  const showImage = src && !imgError;

  const onLoad = useCallback(
    (e) => {
      revealFromElement(e.currentTarget);
    },
    [revealFromElement],
  );

  if (showImage) {
    return (
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        style={{
          opacity: decoded ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
        onLoad={onLoad}
        onError={() => {
          clearRevealTimeout();
          setImgError(true);
        }}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-slate-200 text-slate-500 ${className} ${fallbackClassName}`.trim()}>
      <ProfileIcon className={iconClassName} />
    </div>
  );
}
