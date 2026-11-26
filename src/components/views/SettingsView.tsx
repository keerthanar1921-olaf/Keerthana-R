import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { HubSettings } from '../../types/disaster';
import { formatRelativeTime } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDemoData,
    syncQueue,
    syncNow,
    isOnline,
    isSyncing,
    sosRequests,
    messages,
    rescueTeams,
    iotSensors,
    alerts,
  } = useHub();

  const [form, setForm] = useState<HubSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left 2 columns: Configuration Form */}
      <form
        onSubmit={(e) => void handleSave(e)}
        className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Command Station &amp; Offline Sync Settings
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            All changes are stored locally in IndexedDB so preferences survive full offline
            restarts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Operator Name
            </label>
            <input
              type="text"
              value={form.operatorName}
              onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Station Callsign
            </label>
            <input
              type="text"
              value={form.stationCallsign}
              onChange={(e) => setForm({ ...form, stationCallsign: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Offline &amp; Telemetry Behavior
          </h3>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoSyncOnReconnect}
              onChange={(e) => setForm({ ...form, autoSyncOnReconnect: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-blue-600"
            />
            <div>
              <div className="text-sm font-medium text-slate-900">
                Automatic Sync on Reconnect
              </div>
              <div className="text-xs text-slate-500">
                Drain the IndexedDB outbound queue automatically when internet or gateway
                connectivity returns.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.liveTelemetrySimulation}
              onChange={(e) => setForm({ ...form, liveTelemetrySimulation: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-blue-600"
            />
            <div>
              <div className="text-sm font-medium text-slate-900">
                Live Sensor Simulation Tick
              </div>
              <div className="text-xs text-slate-500">
                Periodically updates simulated IoT water, smoke, and temperature sensor values.
              </div>
            </div>
          </label>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hardware Gateway &amp; Optional Cloud Backend
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mesh Gateway Mode
              </label>
              <select
                value={form.meshBridgeMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    meshBridgeMode: e.target.value as HubSettings['meshBridgeMode'],
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Simulated Hardware Bridge">Simulated Hardware Bridge</option>
                <option value="WebSerial LoRa Gateway (Pending Device)">
                  WebSerial LoRa Gateway (Pending Device)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Local Gateway Relay URL
              </label>
              <input
                type="text"
                value={form.gatewayEndpoint}
                onChange={(e) => setForm({ ...form, gatewayEndpoint: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sync Backend Mode
              </label>
              <select
                value={form.backendProvider}
                onChange={(e) =>
                  setForm({
                    ...form,
                    backendProvider: e.target.value as HubSettings['backendProvider'],
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Local IndexedDB Only">Local IndexedDB Only (Demo Ready)</option>
                <option value="Firebase (Optional)">Firebase (Optional Endpoint)</option>
                <option value="Supabase (Optional)">Supabase (Optional Endpoint)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Optional Cloud Project Endpoint
              </label>
              <input
                type="text"
                value={form.backendUrl}
                onChange={(e) => setForm({ ...form, backendUrl: e.target.value })}
                placeholder="https://your-project.supabase.co"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Settings saved to local IndexedDB.
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Last synchronized: {formatRelativeTime(settings.lastSyncTime)}
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </form>

      {/* Right Column: IndexedDB Storage Inspector & Demo Reset */}
      <aside className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 h-fit">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Local Offline Cache
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Data is cached locally via IndexedDB (<code className="font-mono">disaster_comm_hub_db</code>) and Service Worker precaching for offline field resilience.
        </p>

        <dl className="divide-y divide-slate-100 text-xs">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Cached SOS Records</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums">
              {sosRequests.length}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Cached Channel Messages</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums">
              {messages.length}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Rescue Teams &amp; Sensors</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums">
              {rescueTeams.length} / {iotSensors.length}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Alerts Stored</dt>
            <dd className="font-mono font-semibold text-slate-900 tabular-nums">
              {alerts.length}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Pending Outbound Queue</dt>
            <dd className="font-mono font-semibold text-amber-700 tabular-nums">
              {syncQueue.length}
            </dd>
          </div>
        </dl>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={!isOnline || isSyncing || syncQueue.length === 0}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Force Sync Queue ({syncQueue.length})
          </button>

          <button
            type="button"
            onClick={() => void resetDemoData()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset Demo Dataset
          </button>
        </div>
      </aside>
    </div>
  );
};
