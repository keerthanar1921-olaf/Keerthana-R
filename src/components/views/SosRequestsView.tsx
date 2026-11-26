import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { EmergencyCategory, SosRequest, SosStatus } from '../../types/disaster';
import {
  formatRelativeTime,
  formatTimeClock,
  getPriorityStyles,
  getSosStatusStyles,
} from '../../utils/formatters';

const STATUS_OPTIONS: SosStatus[] = [
  'Pending',
  'Dispatched',
  'In Progress',
  'Rescued',
  'Cancelled',
];

const CATEGORY_OPTIONS: Array<'All' | EmergencyCategory> = [
  'All',
  'Medical Emergency',
  'Trapped Person',
  'Food and Water',
  'Missing Person',
  'Fire',
  'Flood',
  'Structural Collapse',
];

export const SosRequestsView: React.FC = () => {
  const {
    sosRequests,
    rescueTeams,
    setSosModalOpen,
    assignTeamToSos,
    updateSosStatus,
    focusOnMap,
  } = useHub();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SosStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EmergencyCategory>('All');
  const [inspecting, setInspecting] = useState<SosRequest | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sosRequests.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && s.emergencyType !== categoryFilter) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.personName.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.emergencyType.toLowerCase().includes(q)
      );
    });
  }, [sosRequests, search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, person, or location..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | EmergencyCategory)}
            aria-label="Filter by emergency category"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', ...STATUS_OPTIONS] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSosModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Submit SOS Request
        </button>
      </div>

      {/* SOS Requests Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Location &amp; Reporter</th>
                <th className="px-4 py-3">Emergency Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Request Time</th>
                <th className="px-4 py-3">Assigned Rescue Team</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No SOS requests match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((sos) => (
                  <tr key={sos.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {sos.id}
                      </div>
                      {sos.syncState === 'queued' && (
                        <div className="mt-0.5 text-[11px] font-medium text-amber-700">
                          Queued Offline
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900">{sos.location}</div>
                      <div className="text-xs text-slate-500">
                        {sos.personName} · {sos.peopleAffected} affected
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-xs font-medium text-slate-800">
                      {sos.emergencyType}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${getPriorityStyles(
                          sos.priority
                        )}`}
                      >
                        {sos.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="font-mono text-xs text-slate-800 tabular-nums">
                        {formatTimeClock(sos.requestTime)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatRelativeTime(sos.requestTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={sos.assignedTeamId ?? ''}
                        onChange={(e) =>
                          void assignTeamToSos(sos.id, e.target.value ? e.target.value : null)
                        }
                        aria-label={`Assign team to ${sos.id}`}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {rescueTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.callsign} — {team.availability}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={sos.status}
                        onChange={(e) =>
                          void updateSosStatus(sos.id, e.target.value as SosStatus)
                        }
                        aria-label={`Update status for ${sos.id}`}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium focus:outline-none ${getSosStatusStyles(
                          sos.status
                        )}`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspecting(sos)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => focusOnMap(sos.coordinates, `${sos.id}: ${sos.location}`)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Map
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect SOS Details Modal */}
      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {inspecting.id} — {inspecting.emergencyType}
                  </h3>
                  <div className="text-xs text-slate-500">{inspecting.location}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspecting(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Reporter</dt>
                <dd className="font-medium text-slate-900">{inspecting.personName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">People Affected</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  {inspecting.peopleAffected}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Contact Info</dt>
                <dd className="font-mono text-slate-900">{inspecting.contactInfo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Coordinates</dt>
                <dd className="font-mono text-slate-900 tabular-nums">
                  {inspecting.coordinates[0].toFixed(4)}, {inspecting.coordinates[1].toFixed(4)}
                </dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-slate-500 mb-1">Medical Requirements</dt>
                <dd className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-slate-800">
                  {inspecting.medicalRequirements}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Incident Description</dt>
                <dd className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-slate-800 leading-relaxed">
                  {inspecting.description}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const coords = inspecting.coordinates;
                  const lbl = inspecting.location;
                  setInspecting(null);
                  focusOnMap(coords, lbl);
                }}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Locate on Map
              </button>
              <button
                type="button"
                onClick={() => setInspecting(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
