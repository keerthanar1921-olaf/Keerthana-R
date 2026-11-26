import React, { useMemo, useState } from 'react';
import {
  Activity,
  Battery,
  Info,
  Power,
  Radio,
  Signal,
  Wifi,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { MeshProtocol } from '../../types/disaster';
import { formatRelativeTime } from '../../utils/formatters';

export const MeshNetworkView: React.FC = () => {
  const { meshNodes, settings, toggleMeshNodeStatus } = useHub();
  const [selectedNodeId, setSelectedNodeId] = useState<string>(meshNodes[0]?.id ?? '');
  const [protocolFilter, setProtocolFilter] = useState<'All' | MeshProtocol>('All');

  const connectedNodes = meshNodes.filter((n) => n.status === 'Connected');
  const degradedNodes = meshNodes.filter((n) => n.status === 'Degraded');
  const offlineNodes = meshNodes.filter((n) => n.status === 'Offline');

  const activeNodes = connectedNodes.length + degradedNodes.length;
  const coveragePct = Math.round((activeNodes / Math.max(1, meshNodes.length)) * 100);
  const avgSignal = Math.round(
    meshNodes
      .filter((n) => n.status !== 'Offline')
      .reduce((acc, n) => acc + n.signalStrengthDbm, 0) / Math.max(1, activeNodes)
  );

  const selectedNode =
    meshNodes.find((n) => n.id === selectedNodeId) ?? meshNodes[0] ?? null;

  const filteredNodes = useMemo(
    () =>
      meshNodes.filter((n) =>
        protocolFilter === 'All' ? true : n.protocol === protocolFilter
      ),
    [meshNodes, protocolFilter]
  );

  // Deduplicated undirected edges for SVG topology
  const topologyEdges = useMemo(() => {
    const seen = new Set<string>();
    const edges: Array<{ from: typeof meshNodes[0]; to: typeof meshNodes[0]; key: string }> = [];
    for (const node of meshNodes) {
      for (const peerId of node.connectedPeers) {
        const peer = meshNodes.find((p) => p.id === peerId);
        if (!peer) continue;
        const pairKey = [node.id, peer.id].sort().join('--');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        edges.push({ from: node, to: peer, key: pairKey });
      }
    }
    return edges;
  }, [meshNodes]);

  return (
    <div className="space-y-6">
      {/* Hardware Realism Disclaimer */}
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-800">
        <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900">
            Simulated Hardware Mesh Telemetry ({settings.meshBridgeMode})
          </div>
          <p className="text-slate-600 leading-relaxed">
            Standard web browsers cannot transmit raw sub-GHz LoRa, Bluetooth Mesh, or Wi-Fi Direct
            radio frames without external bridge hardware or native OS APIs. This console models
            live topology and node health via a simulated gateway interface ready to bind to a
            WebSerial/WebSocket LoRa bridge.
          </p>
        </div>
      </div>

      {/* Mesh Network Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Connected Mesh Nodes</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {activeNodes}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {meshNodes.length} ({offlineNodes.length} offline)
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Estimated Sector Coverage</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-blue-600 tabular-nums">
            {coveragePct}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Mean Signal Strength</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {avgSignal} <span className="text-sm font-normal text-slate-500">dBm</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Last Gateway Sync</div>
          <div className="mt-1.5 font-display text-lg font-semibold text-emerald-700 tabular-nums">
            {formatRelativeTime(settings.lastSyncTime)}
          </div>
          <div className="text-[11px] text-slate-500">
            Network Health: {offlineNodes.length > 1 ? 'Degraded' : 'Operational'}
          </div>
        </div>
      </div>

      {/* Topology Diagram + Node Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Mesh Network Topology Diagram
              </h2>
              <p className="text-xs text-slate-500">
                Click any node to inspect peer links, hop count, and simulated radio transport.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Connected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Degraded
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Offline
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-[#0B1528] p-3 overflow-x-auto">
            <svg
              viewBox="0 0 800 350"
              className="w-full min-w-[600px] h-[310px]"
              role="img"
              aria-label="Mesh network node connectivity diagram"
            >
              {/* Subtle grid */}
              <defs>
                <pattern id="meshGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="0.75"
                  />
                </pattern>
              </defs>
              <rect width="800" height="350" fill="url(#meshGrid)" rx="8" />

              {/* Edges */}
              {topologyEdges.map(({ from, to, key }) => {
                const isBroken = from.status === 'Offline' || to.status === 'Offline';
                const isDegraded = from.status === 'Degraded' || to.status === 'Degraded';
                return (
                  <line
                    key={key}
                    x1={from.svgPos.x}
                    y1={from.svgPos.y}
                    x2={to.svgPos.x}
                    y2={to.svgPos.y}
                    stroke={isBroken ? '#EF4444' : isDegraded ? '#F59E0B' : '#3B82F6'}
                    strokeWidth={isBroken ? 1.5 : 2.25}
                    strokeDasharray={isBroken || from.protocol === 'LoRa 915MHz' ? '5 4' : undefined}
                    opacity={isBroken ? 0.35 : 0.85}
                  />
                );
              })}

              {/* Nodes */}
              {meshNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const fill =
                  node.status === 'Connected'
                    ? '#16A34A'
                    : node.status === 'Degraded'
                      ? '#D97706'
                      : '#DC2626';
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.svgPos.x}, ${node.svgPos.y})`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle r="24" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.9" />
                    )}
                    <circle
                      r={node.role === 'Gateway Hub' ? 18 : 14}
                      fill="#0F172A"
                      stroke={fill}
                      strokeWidth="3"
                    />
                    <circle r="5" fill={fill} />
                    <text
                      y={node.role === 'Gateway Hub' ? 32 : 27}
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {node.id.replace('NODE-', '')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Node Details Panel */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-mono text-xs font-semibold text-blue-700">
                    {selectedNode.id}
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {selectedNode.name}
                  </h3>
                  <div className="text-xs text-slate-500">{selectedNode.locationName}</div>
                </div>
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-medium ${
                    selectedNode.status === 'Connected'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : selectedNode.status === 'Degraded'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Simulated Protocol</dt>
                  <dd className="font-medium text-slate-900">{selectedNode.protocol}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Node Role</dt>
                  <dd className="font-medium text-slate-900">{selectedNode.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Signal RSSI</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {selectedNode.signalStrengthDbm} dBm
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Battery</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {selectedNode.batteryPercent}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Hops to Gateway</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {selectedNode.status === 'Offline' ? 'Unreachable' : selectedNode.hopsToGateway}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Relay Latency</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {selectedNode.status === 'Offline' ? '—' : `${selectedNode.latencyMs} ms`}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-500 mb-1.5">Connected Peers</div>
                {selectedNode.connectedPeers.length === 0 ? (
                  <div className="text-xs text-slate-400">No active peer links</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.connectedPeers.map((peerId) => (
                      <button
                        key={peerId}
                        type="button"
                        onClick={() => setSelectedNodeId(peerId)}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 hover:bg-slate-100"
                      >
                        {peerId}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void toggleMeshNodeStatus(selectedNode.id)}
                className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white ${
                  selectedNode.status === 'Offline'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                {selectedNode.status === 'Offline'
                  ? 'Simulate Node Reconnect'
                  : 'Simulate Node Drop'}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Node Inventory Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Mesh Radio &amp; Gateway Nodes
          </h2>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', 'LoRa 915MHz', 'Wi-Fi Direct', 'Bluetooth Mesh'] as const).map((proto) => (
              <button
                key={proto}
                type="button"
                onClick={() => setProtocolFilter(proto)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  protocolFilter === proto
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {proto}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Device &amp; Location</th>
                <th className="px-4 py-3">Protocol</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Simulation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNodes.map((node) => (
                <tr key={node.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {node.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{node.name}</div>
                    <div className="text-xs text-slate-500">{node.locationName}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      {node.protocol === 'Wi-Fi Direct' ? (
                        <Wifi className="h-3.5 w-3.5 text-blue-600" />
                      ) : node.protocol === 'LoRa 915MHz' ? (
                        <Radio className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-teal-600" />
                      )}
                      {node.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Signal className="h-3.5 w-3.5 text-slate-400" />
                      {node.signalStrengthDbm} dBm
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5 text-slate-400" />
                      {node.batteryPercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${
                        node.status === 'Connected'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : node.status === 'Degraded'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {node.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleMeshNodeStatus(node.id)}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {node.status === 'Offline' ? 'Restore' : 'Drop Link'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
