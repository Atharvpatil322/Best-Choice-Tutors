/**
 * Country code picker – returns only the dial code (e.g. +44, +91).
 * Uses react-countries for flag, country name, and dial code.
 * Search by country name or dial code.
 * Custom dropdown (no Radix Select) so the search input keeps focus while typing.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useCountries } from 'react-countries';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EMPTY_VALUE = '';

/**
 * @param {Object} props
 * @param {string} props.value - Current dial code (e.g. '+44') or empty string
 * @param {(dialCode: string) => void} props.onChange - Called with selected dial code (e.g. '+44') or ''
 * @param {string} [props.placeholder] - Placeholder when no selection
 * @param {string} [props.className] - Optional class for the trigger
 * @param {string} [props.triggerClassName] - Optional class for trigger button
 * @param {boolean} [props.disabled]
 */
function CountryCodePicker({
  value = '',
  onChange,
  placeholder = '—',
  className,
  triggerClassName,
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const { countries } = useCountries();

  const uniqueByDialCode = useMemo(() => {
    const byDial = new Map();
    countries.forEach((c) => {
      const code = c.dial_code || '';
      if (code && !byDial.has(code)) byDial.set(code, c);
    });
    return [...byDial.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return uniqueByDialCode;
    const codePart = searchQuery.trim().replace(/\s/g, '');
    return uniqueByDialCode.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const dial = (c.dial_code || '').replace(/\s/g, '');
      return name.includes(q) || dial.includes(codePart);
    });
  }, [uniqueByDialCode, searchQuery]);

  const displayValue = value || placeholder;

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    (dialCode) => {
      onChange(dialCode === EMPTY_VALUE ? '' : dialCode);
      close();
    },
    [onChange, close]
  );

  const handleTriggerClick = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    },
    [close]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e) => {
      const trigger = triggerRef.current;
      const dropdown = dropdownRef.current;
      if (
        trigger?.contains(e.target) ||
        dropdown?.contains(e.target)
      ) {
        return;
      }
      close();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen, close]);

  const dropdownEl = isOpen && (
    <div
      ref={dropdownRef}
      className="z-50 w-[220px] min-w-[200px] max-w-[90vw] max-h-[320px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md absolute top-full left-0 mt-1"
      onKeyDown={handleKeyDown}
    >
      <div className="shrink-0 border-b border-border p-2 bg-popover">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search country or code"
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-9 pl-8 pr-2 text-sm"
            aria-label="Search country or dial code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>
      <div className="overflow-y-auto max-h-[260px] p-1">
        <button
          type="button"
          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          onClick={() => handleSelect(EMPTY_VALUE)}
        >
          <span className="text-muted-foreground">{placeholder}</span>
        </button>
        {filteredCountries.map((country) => {
          const dialCode = country.dial_code || '';
          const label = `${country.flag || ''} ${country.name || ''} (${dialCode})`.trim();
          return (
            <button
              key={dialCode}
              type="button"
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              onClick={() => handleSelect(dialCode)}
            >
              {label}
            </button>
          );
        })}
        {filteredCountries.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No countries found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('relative min-w-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={handleTriggerClick}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
          'w-full max-w-[220px] min-w-[160px]',
          triggerClassName
        )}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {dropdownEl}
    </div>
  );
}

export { CountryCodePicker };
