"use client"

import * as React from "react"
import { CirclePlus } from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface FacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  /** Standalone (non-table) usage: controlled selected values */
  selectedValues?: Set<string>
  /** Standalone (non-table) usage: called when selection changes */
  onSelectedValuesChange?: (values: Set<string>) => void
}

export function FacetedFilter<TData, TValue>({
  column,
  title,
  options,
  selectedValues: controlledSelectedValues,
  onSelectedValuesChange,
}: FacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues =
    controlledSelectedValues ?? new Set(column?.getFilterValue() as string[])

  const toggleValue = (value: string) => {
    const next = new Set(selectedValues)
    if (next.has(value)) next.delete(value)
    else next.add(value)

    if (onSelectedValuesChange) {
      onSelectedValuesChange(next)
    } else {
      column?.setFilterValue(next.size ? Array.from(next) : undefined)
    }
  }

  const clearValues = () => {
    if (onSelectedValuesChange) onSelectedValuesChange(new Set())
    else column?.setFilterValue(undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-input bg-background"
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
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
      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedValues.has(option.value)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => toggleValue(option.value)}
          >
            {option.icon && (
              <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            <span>{option.label}</span>
            {facets?.get(option.value) ? (
              <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground">
                {facets.get(option.value)}
              </span>
            ) : null}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={clearValues}
              className="justify-center text-center"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
