import React, { useState } from 'react';
import { HubProvider, useHub } from './context/HubContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SubmitSosModal } from './components/modals/SubmitSosModal';
import { DashboardView } from './components/views/DashboardView';
import { DisasterMapView } from './components/views/DisasterMapView';
import { CommunicationView } from './components/views/CommunicationView';
import { MeshNetworkView } from './components/views/MeshNetworkView';
import { RescueTeamsView } from './components/views/RescueTeamsView';
import { SosRequestsView } from './components/views/SosRequestsView';
import { IotDevicesView } from './components/views/IotDevicesView';
import { ResourcesView } from './components/views/ResourcesView';
import { AlertsView } from './components/views/AlertsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';

const HubShell: React.FC = () => {
  const { activeSection, isHydrated } = useHub();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'map':
        return <DisasterMapView />;
      case 'communication':
        return <CommunicationView />;
      case 'mesh':
        return <MeshNetworkView />;
      case 'teams':
        return <RescueTeamsView />;
      case 'sos':
        return <SosRequestsView />;
      case 'iot':
        return <IotDevicesView />;
      case 'resources':
        return <ResourcesView />;
      case 'alerts':
        return <AlertsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F6F9] text-slate-900">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[1440px]">
            {!isHydrated ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : (
              renderSection()
            )}
          </div>
        </main>
      </div>

      <SubmitSosModal />
    </div>
  );
};

export default function App() {
  return (
    <HubProvider>
      <HubShell />
    </HubProvider>
  );
}
