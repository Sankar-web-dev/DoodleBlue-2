"use client";

import * as React from "react";
import { Column } from "@tanstack/react-table";
import { Check, CirclePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  /** Standalone (non-table) usage: controlled selected values */
  selectedValues?: Set<string>;
  /** Standalone (non-table) usage: called when selection changes */
  onSelectedValuesChange?: (values: Set<string>) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  selectedValues: controlledSelectedValues,
  onSelectedValuesChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  // Use controlled values if provided (standalone), otherwise derive from column (table mode)
  const selectedValues =
    controlledSelectedValues ??
    new Set(column?.getFilterValue() as string[]);

  const setSelected = (next: Set<string>) => {
    if (onSelectedValuesChange) {
      onSelectedValuesChange(next);
    } else {
      const filterValues = Array.from(next);
      column?.setFilterValue(filterValues.length ? filterValues : undefined);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-input bg-background text-foreground"
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="outline"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="outline"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="outline"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-popover" align="start">
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              // Keep the menu open so multiple options can be toggled.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => {
                const next = new Set(selectedValues);
                if (next.has(option.value)) {
                  next.delete(option.value);
                } else {
                  next.add(option.value);
                }
                setSelected(next);
              }}
            >
              <span
                className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-input",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                )}
              >
                <Check className="h-4 w-4" />
              </span>
              {option.icon && (
                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              <span>{option.label}</span>
              {facets?.get(option.value) && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground">
                  {facets.get(option.value)}
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setSelected(new Set())}
              className="justify-center text-center"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
