"use client";

import { useState, useRef, useEffect } from "react";
import { TUCollege, searchTUColleges } from "@/lib/tu-colleges";
import { Building2, MapPin, Check, GraduationCap } from "lucide-react";

interface TUCollegeAutocompleteProps {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelectCollege: (college: TUCollege) => void;
  className?: string;
}

export default function TUCollegeAutocomplete({
  id,
  value,
  placeholder = "e.g. Amrit Science Campus",
  onChange,
  onSelectCollege,
  className = "",
}: TUCollegeAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const suggestions = trimmed.length >= 1 ? searchTUColleges(trimmed).slice(0, 8) : [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (college: TUCollege) => {
    onSelectCollege(college);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          id={`${id}-suggestions-dropdown`}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 transition-all custom-scrollbar"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-zinc-800 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              TU CSIT College Suggestions
            </span>
            <span>{suggestions.length} match{suggestions.length > 1 ? "es" : ""}</span>
          </div>

          <ul role="listbox" className="p-1 space-y-0.5">
            {suggestions.map((college, idx) => {
              const isSelected = idx === selectedIndex;
              const isCurrentExact = value.trim().toLowerCase() === college.name.toLowerCase();

              return (
                <li
                  key={college.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(college);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-start justify-between gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? "bg-gray-100 text-gray-950 dark:bg-zinc-800 dark:text-white"
                      : "text-gray-800 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-neutral-500" />
                      <span className="font-semibold text-gray-950 dark:text-white truncate">
                        {college.name}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-neutral-400">
                      <MapPin className="h-3 w-3 shrink-0 text-red-500/80 dark:text-red-400/80" />
                      <span className="truncate">{college.location}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        college.type === "Constituent"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {college.type}
                    </span>
                    {isCurrentExact && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
