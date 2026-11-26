import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Flame,
  MapPin,
  Package,
  Radio,
  Send,
  Users,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import {
  formatRelativeTime,
  getAlertCardStyles,
  getPriorityStyles,
  getSosStatusStyles,
} from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    sosRequests,
    rescueTeams,
    meshNodes,
    resources,
    alerts,
    mapSites,
    syncQueue,
    isOnline,
    setActiveSection,
    setSosModalOpen,
    assignTeamToSos,
    focusOnMap,
    sendMessage,
    acknowledgeAlert,
  } = useHub();

  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const activeDisasters = mapSites.filter(
    (s) => s.kind === 'disaster' || s.kind === 'danger_zone'
  ).length;
  const connectedTeams = rescueTeams.filter((t) => t.availability !== 'Returning').length;
  const pendingSos = sosRequests.filter(
    (s) => s.status === 'Pending' || s.status === 'Dispatched'
  ).length;
  const activeMeshNodes = meshNodes.filter((n) => n.status !== 'Offline').length;
  const peopleRescued =
    rescueTeams.reduce((acc, t) => acc + t.completedRescues, 0) +
    sosRequests
      .filter((s) => s.status === 'Rescued')
      .reduce((acc, s) => acc + s.peopleAffected, 0);
  const availableResourceItems = resources.reduce((acc, r) => acc + r.availableQuantity, 0);

  const stats = [
    {
      label: 'Active Disasters',
      value: activeDisasters,
      sub: '2 flood/fire · 1 exclusion zone',
      icon: Flame,
      tone: 'text-red-600 bg-red-50 border-red-200',
      target: 'map' as const,
    },
    {
      label: 'Connected Rescue Teams',
      value: connectedTeams,
      sub: `${rescueTeams.filter((t) => t.availability === 'Available').length} ready for dispatch`,
      icon: Users,
      tone: 'text-blue-600 bg-blue-50 border-blue-200',
      target: 'teams' as const,
    },
    {
      label: 'Pending SOS Requests',
      value: pendingSos,
      sub: `${sosRequests.filter((s) => s.priority === 'Critical' && s.status !== 'Rescued').length} critical priority`,
      icon: AlertTriangle,
      tone: 'text-red-600 bg-red-50 border-red-200',
      target: 'sos' as const,
    },
    {
      label: 'Active Mesh Nodes',
      value: `${activeMeshNodes}/${meshNodes.length}`,
      sub: 'Simulated LoRa · Wi-Fi · BLE',
      icon: Radio,
      tone: 'text-blue-600 bg-blue-50 border-blue-200',
      target: 'mesh' as const,
    },
    {
      label: 'People Rescued',
      value: peopleRescued,
      sub: 'Across all active sectors',
      icon: CheckCircle2,
      tone: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      target: 'analytics' as const,
    },
    {
      label: 'Available Resources',
      value: availableResourceItems.toLocaleString(),
      sub: `${resources.filter((r) => r.status !== 'Adequate').length} categories low/critical`,
      icon: Package,
      tone: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      target: 'resources' as const,
    },
  ];

  const handleQuickBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    await sendMessage({
      channelId: 'authority',
      content: broadcastText,
      priority: 'Critical Broadcast',
      isBroadcast: true,
    });
    setBroadcastText('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Statistics Grid */}
      <section aria-label="Operational Summary Metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => setActiveSection(card.target)}
                className="group flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50/40"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-500">{card.label}</div>
                  <div className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {card.value}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500">{card.sub}</div>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Operations Split: Active SOS Queue + Right Rail (Alerts & Broadcast) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left 2 columns: Priority SOS Dispatch Table */}
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Active SOS Dispatch Queue
              </h2>
              <p className="text-xs text-slate-500">
                Assign available rescue units or inspect coordinates directly on the live map.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 whitespace-nowrap"
              >
                New SOS Intake
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('sos')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                All Requests
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID &amp; Time</th>
                  <th className="px-4 py-3">Emergency &amp; Location</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3 text-right">Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sosRequests.slice(0, 5).map((sos) => (
                  <tr key={sos.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {sos.id}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {formatRelativeTime(sos.requestTime)}
                        {sos.syncState === 'queued' && ' · Queued'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900">
                        {sos.emergencyType} ({sos.peopleAffected}{' '}
                        {sos.peopleAffected === 1 ? 'person' : 'people'})
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{sos.location}</div>
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
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${getSosStatusStyles(
                          sos.status
                        )}`}
                      >
                        {sos.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={sos.assignedTeamId ?? ''}
                        onChange={(e) =>
                          void assignTeamToSos(sos.id, e.target.value ? e.target.value : null)
                        }
                        aria-label={`Assign team to ${sos.id}`}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {rescueTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.callsign} ({team.availability})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => focusOnMap(sos.coordinates, `${sos.id}: ${sos.location}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        Locate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Emergency Broadcast + Active Alerts */}
        <div className="space-y-6">
          {/* Quick Emergency Broadcast */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Authority Broadcast
              </h2>
              <span className="text-xs font-medium text-blue-600">
                {isOnline ? 'Live Relay' : 'Local Queue'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Send priority directives across the Authority &amp; Rescue Mesh channels.
            </p>
            <form onSubmit={(e) => void handleQuickBroadcast(e)} className="mt-3 space-y-3">
              <textarea
                rows={3}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Type evacuation advisory or sector directive..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 tabular-nums">
                  {syncQueue.length > 0
                    ? `${syncQueue.length} outbound item(s) queued`
                    : 'All local channels synced'}
                </span>
                <button
                  type="submit"
                  disabled={!broadcastText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isOnline ? 'Broadcast' : 'Queue Offline'}
                </button>
              </div>
              {broadcastSent && (
                <div className="text-xs font-medium text-emerald-700">
                  {isOnline
                    ? 'Broadcast delivered to Authority Channel.'
                    : 'Broadcast cached offline and queued for sync.'}
                </div>
              )}
            </form>
          </section>

          {/* Latest Critical Alerts */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Recent Alerts
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('alerts')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 ${getAlertCardStyles(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{alert.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-500 tabular-nums">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 line-clamp-2">{alert.message}</p>
                  {!alert.acknowledged && (
                    <button
                      type="button"
                      onClick={() => void acknowledgeAlert(alert.id)}
                      className="mt-2 text-[11px] font-semibold text-slate-800 underline hover:text-slate-950"
                    >
                      Acknowledge alert
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Row: Rescue Team Readiness & Safe Zones Quick Access */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Field Rescue Units
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('teams')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Manage teams
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {rescueTeams.slice(0, 4).map((team) => (
              <div key={team.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span className="font-mono text-xs font-semibold text-blue-700">
                      {team.callsign}
                    </span>
                    <span className="truncate">{team.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {team.locationName} · {team.specialization}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${
                    team.availability === 'Available'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {team.availability}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Shelters &amp; Medical Hubs
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('map')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Open Live Map
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {mapSites
              .filter((s) => s.kind === 'shelter' || s.kind === 'hospital' || s.kind === 'safe_zone')
              .slice(0, 4)
              .map((site) => (
                <div key={site.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{site.name}</div>
                    <div className="truncate text-xs text-slate-500">{site.resourcesSummary}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => focusOnMap(site.coordinates, site.name)}
                    className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View on Map
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};
