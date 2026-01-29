/**
 * Session status derived from booking date & time (UI-only, local time).
 * No video/audio integration.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @returns {'upcoming' | 'ongoing' | 'completed'}
 */
export function getSessionStatus(date, startTime, endTime) {
  if (!date || !startTime || !endTime) return 'completed';

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  const now = new Date();

  if (now < start) return 'upcoming';
  if (now <= end) return 'ongoing';
  return 'completed';
}

/**
 * @param {'upcoming' | 'ongoing' | 'completed'} status
 * @returns {string}
 */
export function getSessionStatusLabel(status) {
  const s = (status || '').toLowerCase();
  if (s === 'upcoming') return 'Upcoming';
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'completed') return 'Completed';
  return '—';
}
