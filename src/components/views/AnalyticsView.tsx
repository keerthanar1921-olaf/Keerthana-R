import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { ANALYTICS_TIMELINE } from '../../data/seedData';
import { useHub } from '../../context/HubContext';

const PIE_COLORS = ['#DC2626', '#2563EB', '#D97706', '#16A34A', '#7C3AED', '#0891B2', '#64748B'];

export const AnalyticsView: React.FC = () => {
  const { sosRequests, rescueTeams, resources, mapSites, meshNodes } = useHub();

  const totalSos = sosRequests.length;
  const rescuedOps = sosRequests.filter((s) => s.status === 'Rescued').length +
    rescueTeams.reduce((acc, t) => acc + t.completedRescues, 0);
  const activeDisasterZones = mapSites.filter(
    (s) => s.kind === 'disaster' || s.kind === 'danger_zone'
  ).length;
  const avgResponse = (
    rescueTeams.reduce((acc, t) => acc + t.avgResponseMinutes, 0) /
    Math.max(1, rescueTeams.length)
  ).toFixed(1);

  const sosByCategory = Object.entries(
    sosRequests.reduce<Record<string, number>>((acc, item) => {
      acc[item.emergencyType] = (acc[item.emergencyType] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const teamPerfData = rescueTeams.map((t) => ({
    callsign: t.callsign,
    rescues: t.completedRescues,
    responseMin: t.avgResponseMinutes,
  }));

  const resourceChartData = resources.map((r) => ({
    name: r.category.replace(' Supplies', '').replace('Temporary ', ''),
    available: r.availableQuantity,
    allocated: r.allocatedQuantity,
  }));

  const handleExportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalActiveSos: totalSos,
        successfulRescues: rescuedOps,
        activeDisasterZones,
        averageResponseMinutes: Number(avgResponse),
        activeMeshNodes: meshNodes.filter((n) => n.status !== 'Offline').length,
      },
      sosRequests,
      rescueTeams,
      resources,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disaster-hub-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 flex-1">
          <div>
            <div className="text-xs text-slate-500">Tracked SOS Requests</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {totalSos}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Successful Rescues</div>
            <div className="mt-1 font-display text-2xl font-bold text-emerald-600 tabular-nums">
              {rescuedOps}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Active Disaster Sites</div>
            <div className="mt-1 font-display text-2xl font-bold text-red-600 tabular-nums">
              {activeDisasterZones}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Mean Response Time</div>
            <div className="mt-1 font-display text-2xl font-bold text-blue-600 tabular-nums">
              {avgResponse} <span className="text-sm font-normal text-slate-500">min</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4" />
          Export Report (JSON)
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. SOS Requests vs Successful Rescues Timeline */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            SOS Intake &amp; Rescue Operations Timeline
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Hourly SOS requests received versus completed rescue extractions
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="sosReceived"
                  name="SOS Received"
                  stroke="#DC2626"
                  fill="#FEE2E2"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="rescuesCompleted"
                  name="Rescues Completed"
                  stroke="#16A34A"
                  fill="#DCFCE7"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 2. Network Availability: Internet vs Mesh */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Network Availability &amp; Response Time
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Simulated Mesh Relay uptime (%) vs Cellular/Internet availability during outage
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ANALYTICS_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="meshUptime"
                  name="Mesh Relay Uptime (%)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="internetUptime"
                  name="Cellular/Internet (%)"
                  stroke="#D97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Rescue Team Performance */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Rescue Team Performance
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Completed rescues and mean dispatch response duration (minutes)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="callsign" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rescues" name="Completed Rescues" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="responseMin"
                  name="Avg Response (min)"
                  fill="#0F172A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. SOS Category Breakdown */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Active SOS Distribution by Category
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Live breakdown from IndexedDB SOS intake records
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sosByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {sosByCategory.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 5. Resource Distribution Overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Emergency Resource Distribution (Normalized Units)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Available reserves versus currently allocated field quantities across depots
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resourceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="available" name="Available" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="allocated" name="Allocated" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
