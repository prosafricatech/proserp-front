export type AuditRow = Record<string, any>;

export const getRows = (payload: any): AuditRow[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const getTotal = (payload: any, rowsCount: number): number => {
  return (
    payload?.total ?? payload?.meta?.total ?? payload?.count ?? rowsCount ?? 0
  );
};

export const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const safeText = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const mapOption = (option: any) => {
  if (typeof option === 'string') {
    return { label: option, value: option };
  }
  return {
    label: option?.label || option?.name || option?.value || '-',
    value: option?.value || option?.id || option?.label || option?.name || '',
  };
};

/** Groups audit rows into their originating request/action, preserving first-seen order. */
export const groupByRequest = (rows: AuditRow[]) => {
  const map = new Map<string, AuditRow[]>();
  const order: string[] = [];

  rows.forEach((row) => {
    const key = String(row.request_id || row.requestId || `single-${row.id}`);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(row);
  });

  return order.map((key) => ({ requestId: key, rows: map.get(key)! }));
};

export const eventChipColor = (
  event?: string
): 'success' | 'error' | 'info' | 'primary' | 'default' => {
  if (!event) return 'default';
  if (event === 'created') return 'success';
  if (event === 'deleted') return 'error';
  if (event === 'updated') return 'info';
  if (event.toLowerCase().includes('fail')) return 'error';
  return 'primary';
};

/** One-line summary of an entry's changes, for compact rendering inside an expanded group. */
export const summarizeEntry = (entry: AuditRow): string => {
  const changes = entry.changes || [];
  if (changes.length === 0) {
    return entry.event_label || entry.event || '—';
  }

  const describe = (change: any) => {
    const label = change.label || change.field || '—';
    const oldVal = safeText(change.old_label ?? change.old);
    const newVal = safeText(change.new_label ?? change.new);

    if (entry.event === 'created') return `${label}: ${newVal}`;
    if (entry.event === 'deleted') return `${label}: ${oldVal}`;
    return `${label} ${oldVal} → ${newVal}`;
  };

  const shown = changes.slice(0, 2).map(describe);
  const remainder = changes.length - shown.length;

  return remainder > 0 ? `${shown.join(' · ')} +${remainder} more` : shown.join(' · ');
};

const AVATAR_PALETTE = [
  '#6a5a2f', '#3c6e8f', '#a35a2a', '#4a5a4a', '#7a4a5a', '#3e5a7a', '#8a6a3a', '#5a7a6a',
];

export const stringToColor = (value?: string): string => {
  const source = value || '?';
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const initials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
