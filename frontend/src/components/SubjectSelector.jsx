/**
 * Subject selector with support for "Other (custom subject)".
 * - Standard subjects from canonical list
 * - When "Other" selected, shows text input to enter custom subject
 * - Stores custom subject string, never "Other"
 */

import { useState } from 'react';
import { CANONICAL_SUBJECTS, SUBJECT_OTHER } from '@/constants/subjects';
import { normalizeSubject } from '@/utils/subjectUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CUSTOM_PLACEHOLDER = 'e.g. Latin, Statistics';

/**
 * @param {Object} props
 * @param {string[]} props.value - Current selected subjects (strings)
 * @param {function(string[]): void} props.onChange - Called with new subjects array
 * @param {string} [props.customInputClassName] - Extra class for custom input wrapper
 * @param {string} [props.chipClassName] - Base class for chips
 * @param {string} [props.chipSelectedClassName] - Class when chip selected
 * @param {string} [props.chipUnselectedClassName] - Class when chip unselected
 */
export function SubjectSelector({ value = [], onChange, customInputClassName = '', chipClassName = '', chipSelectedClassName = '', chipUnselectedClassName = '' }) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const subjects = Array.isArray(value) ? value : [];
  const standardSubjects = CANONICAL_SUBJECTS.filter((s) => s !== SUBJECT_OTHER);

  const handleToggle = (subject) => {
    if (subject === SUBJECT_OTHER) {
      setShowOtherInput((prev) => !prev);
      if (showOtherInput) setCustomInput('');
      return;
    }
    const next = subjects.includes(subject)
      ? subjects.filter((s) => s !== subject)
      : [...subjects, subject];
    onChange(next);
  };

  const handleAddCustom = () => {
    const normalized = normalizeSubject(customInput);
    if (!normalized) return;
    if (subjects.includes(normalized)) {
      setCustomInput('');
      setShowOtherInput(false);
      return;
    }
    onChange([...subjects, normalized]);
    setCustomInput('');
    setShowOtherInput(false);
  };

  const handleRemoveSubject = (subject) => {
    onChange(subjects.filter((s) => s !== subject));
  };

  const isStandardSelected = (s) => subjects.includes(s);
  const isOtherActive = showOtherInput || subjects.some((s) => !standardSubjects.includes(s));

  const defaultChipBase = 'px-3 py-1 rounded-full text-xs font-medium border transition-colors';
  const defaultChipSelected = 'bg-[#1a365d] text-white border-[#1a365d]';
  const defaultChipUnselected = chipUnselectedClassName || 'bg-white text-slate-500 border-slate-200 hover:border-slate-300';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {standardSubjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleToggle(s)}
            className={`${chipClassName || defaultChipBase} ${isStandardSelected(s) ? (chipSelectedClassName || defaultChipSelected) : defaultChipUnselected}`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleToggle(SUBJECT_OTHER)}
          className={`${chipClassName || defaultChipBase} ${isOtherActive ? (chipSelectedClassName || defaultChipSelected) : defaultChipUnselected}`}
        >
          Other (custom)
        </button>
      </div>

      {showOtherInput && (
        <div className={`flex gap-2 items-center flex-wrap ${customInputClassName}`}>
          <Input
            type="text"
            placeholder={CUSTOM_PLACEHOLDER}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="max-w-xs"
            maxLength={80}
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAddCustom}>
            Add
          </Button>
        </div>
      )}

      {subjects.some((s) => !standardSubjects.includes(s)) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {subjects
            .filter((s) => !standardSubjects.includes(s))
            .map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {s}
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(s)}
                  className="hover:text-red-600 ml-0.5"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
