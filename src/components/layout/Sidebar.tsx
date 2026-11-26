import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Cpu,
  LayoutDashboard,
  Map,
  MessageSquare,
  Package,
  Radio,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { NavSection } from '../../types/disaster';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Live Disaster Map', icon: Map },
  { id: 'communication', label: 'Emergency Communication', icon: MessageSquare },
  { id: 'mesh', label: 'Mesh Network', icon: Radio },
  { id: 'teams', label: 'Rescue Teams', icon: Users },
  { id: 'sos', label: 'SOS Requests', icon: AlertTriangle },
  { id: 'iot', label: 'IoT Devices', icon: Cpu },
  { id: 'resources', label: 'Resource Management', icon: Package },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
  { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeSection,
    setActiveSection,
    sosRequests,
    alerts,
    meshNodes,
    syncQueue,
    isOnline,
  } = useHub();

  const pendingSosCount = sosRequests.filter(
    (s) => s.status === 'Pending' || s.status === 'Dispatched'
  ).length;
  const unreadAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const activeNodes = meshNodes.filter((n) => n.status !== 'Offline').length;

  const handleSelect = (id: NavSection) => {
    setActiveSection(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#0B1528] text-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold tracking-tight text-white">
              DisasterHub
            </div>
            <div className="truncate text-xs text-slate-400">Emergency Command</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          let count: number | null = null;
          let countTone = 'bg-slate-800 text-slate-300';

          if (item.id === 'sos' && pendingSosCount > 0) {
            count = pendingSosCount;
            countTone = 'bg-red-600/20 text-red-300 border border-red-500/30';
          } else if (item.id === 'alerts' && unreadAlertsCount > 0) {
            count = unreadAlertsCount;
            countTone = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
          } else if (item.id === 'communication' && syncQueue.length > 0) {
            count = syncQueue.length;
            countTone = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`group flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {count !== null && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : countTone
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              Mesh Relay Status
            </span>
            <span className="font-mono text-[11px] tabular-nums text-emerald-400">
              {activeNodes}/{meshNodes.length}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isOnline ? 'Internet + Local Cache' : 'Offline IndexedDB Mode'}</span>
            <span className="font-mono tabular-nums">
              {syncQueue.length > 0 ? `${syncQueue.length} queued` : 'Synced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-slate-800">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">{navContent}</div>
        </div>
      )}
    </>
  );
};
