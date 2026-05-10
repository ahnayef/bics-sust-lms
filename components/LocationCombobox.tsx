"use client";

import { useState } from "react";
import { FaCheck, FaChevronDown } from "react-icons/fa";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Option {
  id: string;
  name: string;
}

interface Props {
  /** Hidden input name submitted with the form */
  name: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Text shown inside trigger when disabled and no value */
  disabledHint?: string;
}

export default function LocationCombobox({
  name,
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled = false,
  loading = false,
  disabledHint,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);

  const triggerLabel = loading
    ? "Loading…"
    : selected
      ? selected.name
      : disabled && disabledHint
        ? disabledHint
        : placeholder;

  return (
    <>
      {/* Hidden input so FormData picks up the value */}
      <input type="hidden" name={name} value={value} />

      <Popover
        open={open && !disabled && !loading}
        onOpenChange={(v) => {
          if (!disabled && !loading) setOpen(v);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || loading}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "w-full flex items-center justify-between gap-2",
              "px-4 py-2.5 text-sm rounded-sm border",
              "border-[#8a7966] bg-[#f6ecdd] ink-text transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]",
              selected ? "text-[#2f251d]" : "text-[#9a8a7a]",
              (disabled || loading) && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <FaChevronDown
              className={cn(
                "w-3 h-3 shrink-0 text-[#8a7966] transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            // width matches the trigger
            "w-(--radix-popover-trigger-width) p-0",
            // override default popover colours with sepia palette
            "bg-[#f6ecdd] border border-[#8a7966] rounded-sm shadow-md",
            "[--cmdk-input-border:transparent]",
          )}
          align="start"
          sideOffset={4}
        >
          <Command className="bg-transparent rounded-sm">
            <div className="border-b border-[#d2bfa5] px-1 pt-1 pb-0">
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-9 text-[#2f251d] placeholder:text-[#9a8a7a] ink-text bg-transparent"
              />
            </div>
            <CommandList className="max-h-56">
              <CommandEmpty className="py-4 text-center text-sm text-[#7a6a5c] ink-text">
                No results found.
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "ink-text text-[#2f251d] rounded-sm cursor-pointer",
                      "data-selected:bg-[#e8d9c2] data-selected:text-[#221910]",
                      "hover:bg-[#ede0cc]",
                    )}
                  >
                    <span className="flex-1">{opt.name}</span>
                    {value === opt.id && (
                      <FaCheck className="w-3 h-3 text-[#5a4d40] shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
