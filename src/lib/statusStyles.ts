/**
 * Shared semantic status badge styling helper across the EMR application.
 * Ensures an identical visual language for clinical and administrative workflow statuses.
 */
export const getStatusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'Checked-in':
    case 'Open':
    case 'Paid':
    case 'Active':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'In-Consultation':
    case 'In consultation':
    case 'Sample Collected':
    case 'Analyzing':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'Scheduled':
    case 'Ordered':
    case 'Pending':
    case 'Partial':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Completed':
    case 'Closed':
    case 'Dispensed':
    case 'Inactive':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case 'Overdue':
    case 'Unpaid':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

/**
 * Priority badge styling helper for diagnostic investigations and clinical triage.
 * Uses a rounded-full pill geometry distinct from status chips with high-contrast text.
 */
export const getPriorityBadgeStyle = (priority: string): string => {
  switch (priority) {
    case 'STAT':
      return 'bg-rose-50 text-rose-900 border-rose-300';
    case 'Urgent':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'Routine':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

/**
 * System and integration tags (e.g. Invoice Synchronized) distinct from clinical workflow statuses.
 */
export const getSystemTagStyle = (): string => {
  return 'bg-slate-100 text-slate-700 border border-slate-300';
};
