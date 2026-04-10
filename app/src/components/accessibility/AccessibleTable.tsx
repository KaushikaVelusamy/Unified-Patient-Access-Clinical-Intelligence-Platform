/**
 * AccessibleTable Component
 *
 * Semantic HTML table wrapper that satisfies WCAG 1.3.1 (Info and
 * Relationships).  Renders `<caption>`, `<th scope="col">`, optional
 * `scope="row"`, and `aria-sort` on sortable columns.
 *
 * @module AccessibleTable
 * @task US_043 TASK_002
 */

import React, { type ReactNode } from 'react';

export interface TableColumn<T = Record<string, unknown>> {
  /** Unique key matching a property on the row object */
  key: string;
  /** Human-readable header text */
  header: string;
  /** Whether the column supports sorting */
  sortable?: boolean;
  /** Optional custom cell renderer */
  render?: (row: T, index: number) => ReactNode;
}

export interface AccessibleTableProps<T = Record<string, unknown>> {
  /** Table caption (announced by screen readers, visually hidden by default) */
  caption: string;
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Row data */
  data: T[];
  /** Currently-sorted column key */
  sortColumn?: string;
  /** Sort direction for the sorted column */
  sortDirection?: 'ascending' | 'descending' | 'none';
  /** Called when user clicks a sortable column header */
  onSort?: (columnKey: string) => void;
  /** Whether the caption should be visually hidden (default: true) */
  hideCaption?: boolean;
}

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function AccessibleTable<T extends Record<string, unknown>>({
  caption,
  columns,
  data,
  sortColumn,
  sortDirection = 'none',
  onSort,
  hideCaption = true,
}: AccessibleTableProps<T>) {
  return (
    <table aria-label={caption}>
      <caption style={hideCaption ? srOnlyStyle : undefined}>{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              aria-sort={
                col.sortable
                  ? col.key === sortColumn
                    ? sortDirection
                    : 'none'
                  : undefined
              }
            >
              {col.sortable ? (
                <button
                  type="button"
                  onClick={() => onSort?.(col.key)}
                  aria-label={`Sort by ${col.header}`}
                >
                  {col.header}
                  {col.key === sortColumn && (
                    <span aria-hidden="true">
                      {sortDirection === 'ascending' ? ' \u25B2' : ' \u25BC'}
                    </span>
                  )}
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row, idx) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AccessibleTable;
