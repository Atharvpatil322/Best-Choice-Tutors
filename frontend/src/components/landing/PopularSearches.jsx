/**
 * PopularSearches Component
 * SEO-friendly internal linking section showing popular tutor search categories.
 * Reusable and easy to update.
 */

import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const POPULAR_SEARCHES = [
  { label: 'Maths Tutor', query: 'Mathematics' },
  { label: 'Physics Tutor', query: 'Physics' },
  { label: 'Chemistry Tutor', query: 'Chemistry' },
  { label: 'Biology Tutor', query: 'Biology' },
  { label: 'English Tutor', query: 'English' },
  { label: 'Computer Science Tutor', query: 'Computer Science' },
  { label: 'History Tutor', query: 'History' },
  { label: 'Geography Tutor', query: 'Geography' },
  { label: 'GCSE Tutor', query: 'GCSE' },
  { label: 'A-Level Tutor', query: 'A-Levels' },
  { label: 'University Tutor', query: 'University' },
  { label: 'Language Tutor', query: 'Languages' },
];

export default function PopularSearches() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="popular-searches-title">
      <div className="max-w-6xl mx-auto">
        <h2
          id="popular-searches-title"
          className="text-2xl sm:text-3xl font-bold text-[#1A365D] text-center mb-8"
        >
          Popular Searches
        </h2>
        <nav aria-label="Popular tutor searches">
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {POPULAR_SEARCHES.map((item) => (
              <li key={item.query}>
                <Link
                  to={`/?subject=${encodeURIComponent(item.query)}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#4FD1C5]/10 hover:border-[#4FD1C5]/30 transition-all text-sm font-medium text-slate-700 hover:text-[#1A365D] h-full"
                >
                  <Search className="h-4 w-4 shrink-0 text-[#4FD1C5]" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

export { POPULAR_SEARCHES };

