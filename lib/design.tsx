export const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  analyzed:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  completed:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  processing: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500', label: 'Processing' },
  uploaded:   { bg: 'bg-surface-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Uploaded' },
  failed:     { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Failed' },
};

export function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
}

export function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateLong(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatPhone(phone: string | null) {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
