import { AlertSeverity, PriorityLevel, SensorHealth, SosStatus, TeamAvailability } from '../types/disaster';

export function formatRelativeTime(isoString: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export function formatTimeClock(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPriorityStyles(priority: PriorityLevel): string {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'High':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Medium':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Low':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getSosStatusStyles(status: SosStatus): string {
  switch (status) {
    case 'Pending':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Dispatched':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'In Progress':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Rescued':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getAvailabilityStyles(avail: TeamAvailability): string {
  switch (avail) {
    case 'Available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'On Mission':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Standby':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Returning':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getSensorHealthStyles(health: SensorHealth): string {
  switch (health) {
    case 'Nominal':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Warning':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Offline':
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getAlertCardStyles(severity: AlertSeverity): string {
  switch (severity) {
    case 'Critical':
      return 'bg-red-50/70 border-red-200';
    case 'Warning':
      return 'bg-amber-50/70 border-amber-200';
    case 'Info':
      return 'bg-blue-50/70 border-blue-200';
    case 'Resolved':
      return 'bg-emerald-50/60 border-emerald-200';
  }
}
