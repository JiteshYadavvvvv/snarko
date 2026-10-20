"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  label,
  placeholder = "Search games",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`.trim()}>
      <Search
        className="text-muted-foreground pointer-events-none absolute left-3 size-4"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="bg-surface border-border text-foreground placeholder:text-muted-foreground w-full rounded-md border py-2 pr-9 pl-9 text-sm"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-muted-foreground hover:bg-surface-elevated hover:text-foreground absolute right-2 inline-flex size-6 items-center justify-center rounded-sm transition-colors duration-150"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
