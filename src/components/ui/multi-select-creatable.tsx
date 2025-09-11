
"use client";

import * as React from "react";
import { X, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type Option = Record<"value" | "label", string>;

type MultiSelectCreatableProps = {
    options: Option[];
    selected: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MultiSelectCreatable({ options, selected, onChange, placeholder = "Select options...", className, disabled }: MultiSelectCreatableProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((value: string) => {
    onChange(selected.filter((s) => s !== value));
  }, [onChange, selected]);

  const handleSelect = (value: string) => {
      setInputValue("");
      if (!selected.includes(value)) {
          onChange([...selected, value]);
      }
  }

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          const newSelected = [...selected];
          newSelected.pop();
          onChange(newSelected);
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
      if (e.key === "Enter" && input.value.trim() !== "") {
          e.preventDefault();
          handleSelect(input.value.trim());
      }
    }
  }, [onChange, selected]);

  const selectables = options.filter(option => !selected.includes(option.value));

  return (
    <Command onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)}>
      <div
        className="group border border-input rounded-md px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      >
        <div className="flex gap-1 flex-wrap">
          {selected.map((value) => {
            return (
              <Badge key={value} variant="secondary">
                {value}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(value)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open ? (
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto">
              {inputValue.trim() && !options.some(o => o.value === inputValue.trim()) && !selected.includes(inputValue.trim()) && (
                  <CommandItem
                      onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                      }}
                      onSelect={() => handleSelect(inputValue.trim())}
                      className={"cursor-pointer"}
                      >
                     <Tag className="mr-2 h-4 w-4" />
                     Criar nova tag: "{inputValue}"
                  </CommandItem>
              )}
              {selectables.length > 0 && selectables.map((option) => {
                return (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(option.value)}
                    className={"cursor-pointer"}
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
               <CommandEmpty>Nenhuma tag encontrada. Digite para criar uma nova.</CommandEmpty>
            </CommandGroup>
          </div>
        ) : null}
      </div>
    </Command>
  )
}
