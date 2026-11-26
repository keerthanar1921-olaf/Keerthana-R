import React from 'react';
import {
  AlertCircle,
  Menu,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { NavSection } from '../../types/disaster';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Command Dashboard',
  map: 'Live Disaster Map',
  communication: 'Emergency Communication',
  mesh: 'Mesh Network Monitoring',
  teams: 'Rescue Team Management',
  sos: 'SOS Emergency Requests',
  iot: 'IoT Sensor Monitoring',
  resources: 'Resource Management',
  alerts: 'Alerts & Notifications',
  analytics: 'Reports & Analytics',
  settings: 'System Settings',
};

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileNav }) => {
  const {
    activeSection,
    isOnline,
    browserOnline,
    simulatedOffline,
    setSimulatedOffline,
    syncQueue,
    isSyncing,
    syncNow,
    setSosModalOpen,
  } = useHub();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Zone 1: Mobile trigger + Breadcrumb / View Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Command Center</span>
              <span aria-hidden="true">/</span>
              <span className="truncate font-medium text-slate-700">
                {SECTION_TITLES[activeSection]}
              </span>
            </div>
            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-slate-900">
              {SECTION_TITLES[activeSection]}
            </h1>
          </div>
        </div>

        {/* Zone 2 & 3: Connectivity Controls, Sync, PWA Install, Primary SOS CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Connectivity Indicator & Field Offline Simulator */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <div
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                isOnline ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              )}
              <span>
                {isOnline
                  ? 'Online'
                  : !browserOnline
                    ? 'Browser Offline'
                    : 'Offline Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedOffline(!simulatedOffline)}
              disabled={!browserOnline}
              title={
                browserOnline
                  ? 'Toggle simulated offline mode to test local IndexedDB queuing'
                  : 'Browser network is disconnected'
              }
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                simulatedOffline
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              {simulatedOffline ? 'Go Online' : 'Simulate Offline'}
            </button>
          </div>

          {syncQueue.length > 0 && (
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={!isOnline || isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="tabular-nums">
                {isSyncing ? 'Syncing...' : `Sync Queue (${syncQueue.length})`}
              </span>
            </button>
          )}

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
          >
            <AlertCircle className="h-4 w-4" />
            Report SOS
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900 sm:px-6">
          <span>
            Offline-First Mode Active — New SOS requests and messages are stored in local IndexedDB
            and queued for automatic sync when connectivity returns.
          </span>
          <span className="font-mono font-medium tabular-nums">
            Pending Queue: {syncQueue.length}
          </span>
        </div>
      )}
    </header>
  );
};
