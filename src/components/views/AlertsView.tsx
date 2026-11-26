import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Flame,
  Info,
  Plus,
  Waves,
  WifiOff,
  X,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { AlertCategory, AlertSeverity } from '../../types/disaster';
import { formatRelativeTime, formatTimeClock, getAlertCardStyles } from '../../utils/formatters';

const SEVERITIES: Array<'All' | AlertSeverity> = [
  'All',
  'Critical',
  'Warning',
  'Info',
  'Resolved',
];

const CATEGORIES: AlertCategory[] = [
  'Critical Emergency',
  'Flood Warning',
  'Fire Warning',
  'Network Failure',
  'SOS Notification',
  'Rescue Update',
];

function getAlertIcon(category: AlertCategory) {
  switch (category) {
    case 'Flood Warning':
      return Waves;
    case 'Fire Warning':
      return Flame;
    case 'Network Failure':
      return WifiOff;
    case 'SOS Notification':
      return AlertTriangle;
    case 'Rescue Update':
      return CheckCircle2;
    case 'Critical Emergency':
      return AlertOctagon;
  }
}

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, createAlert } = useHub();
  const [severityFilter, setSeverityFilter] = useState<'All' | AlertSeverity>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | AlertCategory>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('Critical');
  const [category, setCategory] = useState<AlertCategory>('Critical Emergency');
  const [location, setLocation] = useState('');

  const filtered = useMemo(
    () =>
      alerts.filter((a) => {
        if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
        if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
        return true;
      }),
    [alerts, severityFilter, categoryFilter]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !location.trim()) return;
    await createAlert({ title, message, severity, category, location });
    setTitle('');
    setMessage('');
    setLocation('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Issue Alert Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  severityFilter === sev
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | AlertCategory)}
            aria-label="Filter alerts by category"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="All">All Alert Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Issue Emergency Alert
        </button>
      </div>

      {/* Color-Coded Alert Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-400" />
            <div className="mt-2 text-sm font-medium text-slate-700">
              No alerts match the selected filters.
            </div>
          </div>
        ) : (
          filtered.map((alert) => {
            const Icon = getAlertIcon(alert.category);
            const iconTone =
              alert.severity === 'Critical'
                ? 'text-red-600'
                : alert.severity === 'Warning'
                  ? 'text-amber-600'
                  : alert.severity === 'Resolved'
                    ? 'text-emerald-600'
                    : 'text-blue-600';

            return (
              <article
                key={alert.id}
                className={`rounded-xl border p-4 sm:p-5 transition-colors ${getAlertCardStyles(
                  alert.severity
                )}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
                      <Icon className={`h-4 w-4 ${iconTone}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className={`font-semibold ${iconTone}`}>{alert.severity}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.location}</span>
                      </div>
                      <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                        {alert.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{alert.message}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Source: {alert.source}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatTimeClock(alert.timestamp)} ({formatRelativeTime(alert.timestamp)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {alert.acknowledged ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void acknowledgeAlert(alert.id)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Issue Emergency Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreate(e)} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alert Headline *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Flash Flood Advisory — Lower Waterfront"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AlertCategory)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Affected Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sector 4 / Marina District"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alert Details *
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide actionable instructions for rescue crews and residents..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Publish Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
