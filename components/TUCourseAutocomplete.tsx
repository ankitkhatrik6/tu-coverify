"use client";

import { useState, useRef, useEffect } from "react";
import { TUCourse, searchTUCourses } from "@/lib/tu-courses";
import { BookOpen, Check, Search } from "lucide-react";

interface TUCourseAutocompleteProps {
  id: string;
  value: string;
  placeholder?: string;
  searchType?: "title" | "code";
  onChange: (value: string) => void;
  onSelectCourse: (course: TUCourse) => void;
  className?: string;
}

export default function TUCourseAutocomplete({
  id,
  value,
  placeholder,
  searchType = "title",
  onChange,
  onSelectCourse,
  className = "",
}: TUCourseAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const suggestions = trimmed.length >= 1 ? searchTUCourses(trimmed).slice(0, 8) : [];

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
        chooseCourse(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const chooseCourse = (course: TUCourse) => {
    onSelectCourse(course);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => {
          if (trimmed.length >= 1) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-zinc-800 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              CSIT Course Suggestions
            </span>
            <span>{suggestions.length} match{suggestions.length > 1 ? "es" : ""}</span>
          </div>

          <ul className="py-1" role="listbox">
            {suggestions.map((course, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={`${course.code}-${course.semesterNumber}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => chooseCourse(course)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-neutral-100"
                      : "text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-black/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-900 dark:bg-white/10 dark:text-neutral-100">
                        {course.code}
                      </span>
                      <span className="truncate font-medium text-gray-900 dark:text-neutral-100">
                        {course.title}
                      </span>
                      {course.isElective && (
                        <span className="shrink-0 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                          {course.electiveType || "Elective"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-400">
                      <span>{course.semesterName}</span>
                      <span>•</span>
                      <span>{course.creditHours} Cr</span>
                      <span>•</span>
                      <span>{course.fullMarks} Marks</span>
                      {course.oldCode && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-gray-400 dark:text-neutral-500">was {course.oldCode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] text-gray-400 group-hover:text-black dark:group-hover:text-white">
                    Auto-fill →
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
