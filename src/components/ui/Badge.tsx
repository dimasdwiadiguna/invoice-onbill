const STYLES = {
  draft:   'bg-very-light-gray  text-medium-gray  border-border',
  sent:    'bg-blue-50           text-blue-600     border-blue-200',
  paid:    'bg-success/10        text-success      border-success/25',
  overdue: 'bg-error/10          text-error        border-error/25',
} as const

const LABELS: Record<keyof typeof STYLES, string> = {
  draft:   'Draft',
  sent:    'Terkirim',
  paid:    'Dibayar',
  overdue: 'Overdue',
}

type Status = keyof typeof STYLES

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
