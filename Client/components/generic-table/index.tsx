"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type Updater,
  flexRender,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsString, useQueryStates } from "nuqs";
import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableFacetedFilter } from "./generic-filter";

interface RegularTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const EMPTY_SEARCH_VALUE = "";

type FilterMode = "text" | "multi";

type FilterDescriptor = {
  columnId: string;
  queryKey: string;
  mode: FilterMode;
};

const getSearchQueryKey = (
  filterColumn: string | undefined,
  searchQueryKey: string | undefined
) => searchQueryKey ?? filterColumn;

const getSelectQueryKey = (
  fieldName: string,
  filterQueryKeys: Record<string, string> | undefined
) => filterQueryKeys?.[fieldName] ?? fieldName;

const getFilterDescriptors = ({
  filter,
  filterColumn,
  filterWithSelect,
  filterWithSelectFieldNames,
  filterQueryKeys,
  searchQueryKey,
}: {
  filter?: boolean;
  filterColumn?: string;
  filterWithSelect?: boolean;
  filterWithSelectFieldNames?: string[];
  filterQueryKeys?: Record<string, string>;
  searchQueryKey?: string;
}): FilterDescriptor[] => {
  const descriptors: FilterDescriptor[] = [];

  if (filter && filterColumn) {
    const queryKey = getSearchQueryKey(filterColumn, searchQueryKey);

    if (queryKey) {
      descriptors.push({
        columnId: filterColumn,
        queryKey,
        mode: "text",
      });
    }
  }

  if (filterWithSelect) {
    filterWithSelectFieldNames?.forEach((fieldName) => {
      descriptors.push({
        columnId: fieldName,
        queryKey: getSelectQueryKey(fieldName, filterQueryKeys),
        mode: "multi",
      });
    });
  }

  return descriptors;
};

const getStringValue = (value: unknown) =>
  typeof value === "string" ? value : EMPTY_SEARCH_VALUE;

const getMultiFilterValues = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return [] as string[];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const serializeMultiFilterValue = (value: unknown) => {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedValue = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return normalizedValue.length > 0 ? normalizedValue.join(",") : null;
};

const getColumnFilters = (
  descriptors: FilterDescriptor[],
  queryFilters: Record<string, string | null>
): ColumnFiltersState => {
  const nextFilters: ColumnFiltersState = [];

  descriptors.forEach(({ columnId, mode, queryKey }) => {
    const value = queryFilters[queryKey];

    if (mode === "multi") {
      const multiValue = getMultiFilterValues(value);

      if (multiValue.length > 0) {
        nextFilters.push({ id: columnId, value: multiValue });
      }

      return;
    }

    const stringValue = getStringValue(value);
    if (stringValue) {
      nextFilters.push({ id: columnId, value: stringValue });
    }
  });

  return nextFilters;
};

const getTextFilterValue = (
  descriptors: FilterDescriptor[],
  queryFilters: Record<string, string | null>,
  filterColumn: string | undefined
) => {
  const textDescriptor = descriptors.find(
    ({ columnId }) => columnId === filterColumn
  );

  return textDescriptor
    ? getStringValue(queryFilters[textDescriptor.queryKey])
    : EMPTY_SEARCH_VALUE;
};

const getNextQueryFilterState = (
  descriptors: FilterDescriptor[],
  nextFilters: ColumnFiltersState
) => {
  return descriptors.reduce<Record<string, string | null>>(
    (accumulator, { columnId, mode, queryKey }) => {
      const matchingFilter = nextFilters.find(
        (filter) => filter.id === columnId
      );

      accumulator[queryKey] =
        mode === "multi"
          ? serializeMultiFilterValue(matchingFilter?.value)
          : (() => {
              const nextValue = getStringValue(matchingFilter?.value).trim();

              return nextValue ? nextValue : null;
            })();

      return accumulator;
    },
    {}
  );
};

export default function GenericTable<TData, TValue>({
  columns,
  data,
  sort,
  filter,
  filterColumn,
  filterPlaceHolder,
  pagination,
  filterWithSelect,
  filterWithSelectFieldNames,
  filterWithSelectFieldOptions,
  searchQueryKey,
  filterQueryKeys,
  initialSorting,
  customFilterComponent,
}: RegularTableProps<TData, TValue> & {
  sort?: boolean;
  filter?: boolean;
  filterColumn?: string;
  filterPlaceHolder?: string;
  filterWithSelect?: boolean;
  filterWithSelectFieldNames?: string[];
  filterWithSelectFieldOptions?: {
    label: string;
    value: string;
    icon?: React.ComponentType;
  }[][];
  pagination?: boolean;
  searchQueryKey?: string;
  filterQueryKeys?: Record<string, string>;
  initialSorting?: SortingState;
  customFilterComponent?: React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const filterDescriptors = useMemo(
    () =>
      getFilterDescriptors({
        filter,
        filterColumn,
        filterQueryKeys,
        filterWithSelect,
        filterWithSelectFieldNames,
        searchQueryKey,
      }),
    [
      filter,
      filterColumn,
      filterQueryKeys,
      filterWithSelect,
      filterWithSelectFieldNames,
      searchQueryKey,
    ]
  );
  const filterQueryParsers = useMemo(
    () =>
      filterDescriptors.reduce<
        Record<string, ReturnType<typeof parseAsString.withDefault>>
      >((accumulator, { queryKey }) => {
        accumulator[queryKey] = parseAsString.withDefault(EMPTY_SEARCH_VALUE);

        return accumulator;
      }, {}),
    [filterDescriptors]
  );
  const [queryFilters, setQueryFilters] = useQueryStates(filterQueryParsers);
  const columnFilters = useMemo(
    () => getColumnFilters(filterDescriptors, queryFilters),
    [filterDescriptors, queryFilters]
  );
  const textFilterValue = useMemo(
    () => getTextFilterValue(filterDescriptors, queryFilters, filterColumn),
    [filterColumn, filterDescriptors, queryFilters]
  );

  const state: { sorting?: SortingState; columnFilters?: ColumnFiltersState } =
    {};
  if (sort) {
    state.sorting = sorting;
  }
  if (filter || filterWithSelect) {
    state.columnFilters = columnFilters;
  }

  const sortingValues = sort
    ? {
        getSortedRowModel: getSortedRowModel(),
      }
    : {};
  const handleColumnFiltersChange = (updater: Updater<ColumnFiltersState>) => {
    const nextFilters =
      typeof updater === "function" ? updater(columnFilters) : updater;

    void setQueryFilters(
      getNextQueryFilterState(filterDescriptors, nextFilters)
    );
  };

  const filterValues =
    filter || filterWithSelect
      ? {
          onColumnFiltersChange: handleColumnFiltersChange,
          getFilteredRowModel: getFilteredRowModel(),
        }
      : {};
  const paginationValues = pagination
    ? {
        getPaginationRowModel: getPaginationRowModel(),
      }
    : {};
  const filterWithSelectValues = filterWithSelect
    ? {
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
      }
    : {};

  const table = useReactTable({
    data,
    // @ts-expect-error generic column inference mismatch
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    ...sortingValues,
    ...filterValues,
    ...paginationValues,
    ...filterWithSelectValues,
    state,
  });

  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto py-4">
        {filter && (
          <div className="relative min-w-[120px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 dark:text-white"
              placeholder={filterPlaceHolder}
              key={filterColumn}
              value={textFilterValue}
              onChange={(event) =>
                table
                  .getColumn(filterColumn ?? "")
                  ?.setFilterValue(event.target.value)
              }
            />
          </div>
        )}
        {filterWithSelect && (
          <div className="flex shrink-0 items-center gap-2">
            {filterWithSelectFieldNames?.map((fieldName, index) => (
              <React.Fragment key={index}>
                {table.getColumn(fieldName) && (
                  <DataTableFacetedFilter
                    column={table.getColumn(fieldName)}
                    title={
                      fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
                    }
                    options={filterWithSelectFieldOptions![index]!}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {customFilterComponent}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-muted/50 text-black dark:text-white"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-gray-900 dark:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
