/**
 * UserTable Component
 * 
 * Displays user list in sortable table format (desktop) or cards (mobile).
 * Supports sorting by column header click and action buttons per row.
 * 
 * @module UserTable
 * @task US_035 TASK_002
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import type { User } from '../../types/user.types';

interface UserTableProps {
  users: User[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  currentUserId: number | undefined;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
}

const SORTABLE_COLUMNS = ['email', 'role', 'last_login_at'];

function SortIndicator({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
  return <span style={{ marginLeft: '4px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

function formatLastLogin(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  sortBy,
  sortOrder,
  onSort,
  currentUserId,
  onEdit,
  onDeactivate,
}) => {
  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
        No users found matching the filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="user-table-desktop" style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}
          role="grid"
          aria-label="User management table"
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              {[
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
                { key: 'department', label: 'Department' },
                { key: 'status', label: 'Status' },
                { key: 'last_login_at', label: 'Last Login' },
                { key: 'actions', label: 'Actions' },
              ].map(({ key, label }) => {
                const isSortable = SORTABLE_COLUMNS.includes(key);
                return (
                  <th
                    key={key}
                    style={{
                      padding: '12px 8px',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={isSortable ? () => onSort(key) : undefined}
                    onKeyDown={isSortable ? (e) => { if (e.key === 'Enter') onSort(key); } : undefined}
                    tabIndex={isSortable ? 0 : undefined}
                    aria-sort={sortBy === key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                    role={isSortable ? 'columnheader' : undefined}
                  >
                    {label}
                    {isSortable && <SortIndicator column={key} sortBy={sortBy} sortOrder={sortOrder} />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr
                  key={user.id}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                  role="row"
                >
                  <td style={{ padding: '10px 8px' }}>{user.email}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{user.role}</td>
                  <td style={{ padding: '10px 8px' }}>{user.department_name || '—'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <StatusBadge isActive={user.is_active} />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {formatLastLogin(user.last_login_at)}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(user)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        aria-label={`Edit user ${user.email}`}
                        title="Edit user"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => onDeactivate(user)}
                        disabled={isSelf || !user.is_active}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          backgroundColor: isSelf || !user.is_active ? '#f9fafb' : '#fef2f2',
                          color: isSelf || !user.is_active ? '#9ca3af' : '#dc2626',
                          border: `1px solid ${isSelf || !user.is_active ? '#e5e7eb' : '#fecaca'}`,
                          borderRadius: '4px',
                          cursor: isSelf || !user.is_active ? 'not-allowed' : 'pointer',
                          opacity: isSelf || !user.is_active ? 0.6 : 1,
                        }}
                        aria-label={
                          isSelf
                            ? 'Cannot deactivate your own account'
                            : `Deactivate user ${user.email}`
                        }
                        title={isSelf ? 'Cannot deactivate your own account' : 'Deactivate user'}
                      >
                        🚫 Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="user-cards-mobile" style={{ display: 'none' }}>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div
              key={user.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.875rem' }}>{user.email}</strong>
                <StatusBadge isActive={user.is_active} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                {user.department_name && ` · ${user.department_name}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>
                Last login: {formatLastLogin(user.last_login_at)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onEdit(user)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  aria-label={`Edit user ${user.email}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeactivate(user)}
                  disabled={isSelf || !user.is_active}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    backgroundColor: isSelf || !user.is_active ? '#f9fafb' : '#fef2f2',
                    color: isSelf || !user.is_active ? '#9ca3af' : '#dc2626',
                    border: `1px solid ${isSelf || !user.is_active ? '#e5e7eb' : '#fecaca'}`,
                    borderRadius: '4px',
                    cursor: isSelf || !user.is_active ? 'not-allowed' : 'pointer',
                  }}
                  aria-label={isSelf ? 'Cannot deactivate your own account' : `Deactivate user ${user.email}`}
                >
                  Deactivate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .user-table-desktop { display: none !important; }
          .user-cards-mobile { display: block !important; }
        }
        @media (min-width: 768px) {
          .user-table-desktop { display: block !important; }
          .user-cards-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
};
