import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import Skeleton from './Skeleton';

type SortDir = 'asc' | 'desc' | null;

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  stickyHeader?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  pageSize = 20,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange || !selectedKeys) return;
    const allKeys = new Set(paged.map(keyExtractor));
    const allSelected = paged.every((r) => selectedKeys.has(keyExtractor(r)));
    const next = new Set(selectedKeys);
    paged.forEach((r) => {
      const k = keyExtractor(r);
      allSelected ? next.delete(k) : next.add(k);
    });
    onSelectionChange(next);
  };

  const toggleRow = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    next.has(key) ? next.delete(key) : next.add(key);
    onSelectionChange(next);
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown size={14} className="text-white/20" />;
    if (sortDir === 'asc') return <ArrowUp size={14} className="text-primary" />;
    return <ArrowDown size={14} className="text-primary" />;
  };

  // Mobile card view
  if (loading) {
    return <Skeleton variant="card" />;
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Inbox size={48} className="mb-3" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto scrollbar-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {selectable && (
                <th className="p-3 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={paged.length > 0 && paged.every((r) => selectedKeys?.has(keyExtractor(r)))}
                    className="accent-[#007AFF]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 text-left text-2xs font-bold uppercase tracking-wider text-white/30 ${col.sortable ? 'cursor-pointer hover:text-white/50 select-none' : ''}`}
                  style={{ width: col.width, textAlign: col.align }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => {
              const key = keyExtractor(row);
              return (
                <tr
                  key={key}
                  className={`border-b border-white/[0.04] transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/[0.04]' : ''} ${selectedKeys?.has(key) ? 'bg-primary/10' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedKeys?.has(key)}
                        onChange={() => toggleRow(key)}
                        className="accent-[#007AFF]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-white/90" style={{ textAlign: col.align }}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {paged.map((row) => {
          const key = keyExtractor(row);
          return (
            <div
              key={key}
              className={`card ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between py-1.5">
                  <span className="text-2xs font-bold uppercase tracking-wider text-white/30">{col.label}</span>
                  <span className="text-sm text-white/90">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3 px-2 text-xs text-white/40">
          <span>Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </>
  );
}