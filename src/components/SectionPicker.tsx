import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown, IconFolder, IconFolderPlus } from '../Icons';
import type { Section } from '../preload';
import { ALL_SECTIONS, type AddSectionResult, type SectionSelection } from '../types';
import { cn } from '../lib/cn';

export type SectionPickerProps = {
  sections: Section[];
  currentSectionName: SectionSelection;
  onSelectSection: (name: SectionSelection) => void;
  onAddSection: (name: string) => Promise<AddSectionResult>;
};

export function SectionPicker({
  sections,
  currentSectionName,
  onSelectSection,
  onAddSection,
}: SectionPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setName('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!creating) return;
    inputRef.current?.focus();
  }, [creating]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (creating) {
        event.preventDefault();
        event.stopPropagation();
        setCreating(false);
        setName('');
        setError(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, creating]);

  const resetCreateState = () => {
    setCreating(false);
    setName('');
    setError(null);
  };

  const handleSelect = (sectionName: SectionSelection) => {
    onSelectSection(sectionName);
    setOpen(false);
  };

  const handleCreate = async () => {
    const result = await onAddSection(name);
    if (result.status === 'created') {
      setOpen(false);
      return;
    }

    if (result.reason === 'empty') {
      setError('Enter a section name.');
      return;
    }

    setError('Section already exists.');
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="section-picker-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="section-picker-trigger__label">
          <IconFolder size={15} />
          <span>{currentSectionName === ALL_SECTIONS ? 'All sections' : (currentSectionName ?? 'Tasks')}</span>
        </span>
        <IconChevronDown
          size={15}
          className={cn('section-picker-trigger__chevron', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="section-picker-popover" role="menu" aria-label="Sections">
          <div className="section-picker-list">
            <button
              type="button"
              className={cn(
                'section-picker-item',
                currentSectionName === ALL_SECTIONS && 'section-picker-item--active',
              )}
              onClick={() => handleSelect(ALL_SECTIONS)}
            >
              <span className="section-picker-item__label">All sections</span>
              {currentSectionName === ALL_SECTIONS ? <IconCheck size={14} /> : null}
            </button>
            <div className="section-picker-divider" />
            {sections.map((section) => {
              const active = section.name === currentSectionName;
              return (
                <button
                  key={section.name}
                  type="button"
                  className={cn('section-picker-item', active && 'section-picker-item--active')}
                  onClick={() => handleSelect(section.name)}
                >
                  <span className="section-picker-item__label">{section.name}</span>
                  {active ? <IconCheck size={14} /> : null}
                </button>
              );
            })}
          </div>

          <div className="section-picker-divider" />

          {creating ? (
            <div className="section-picker-create">
              <label className="section-picker-create__label" htmlFor="section-name">
                New section
              </label>
              <div className="section-picker-create__row">
                <input
                  id="section-name"
                  ref={inputRef}
                  className="input section-picker-create__input"
                  placeholder="Section name"
                  autoComplete="off"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreate();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      event.stopPropagation();
                      resetCreateState();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={!name.trim()}
                  onClick={() => void handleCreate()}
                >
                  Add
                </button>
              </div>
              {error ? <div className="section-picker-create__error">{error}</div> : null}
            </div>
          ) : (
            <button
              type="button"
              className="section-picker-create-toggle"
              onClick={() => {
                setCreating(true);
                setError(null);
              }}
            >
              <IconFolderPlus size={15} />
              <span>New section</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
