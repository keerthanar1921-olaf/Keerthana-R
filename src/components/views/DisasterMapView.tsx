import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Filter,
  LocateFixed,
  MapPin,
  Search,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { formatRelativeTime } from '../../utils/formatters';

type LayerCategory =
  | 'disaster'
  | 'danger_zone'
  | 'safe_zone'
  | 'shelter'
  | 'hospital'
  | 'team'
  | 'sos'
  | 'iot';

interface SelectedMarkerDetail {
  id: string;
  title: string;
  categoryLabel: string;
  status: string;
  coordinates: [number, number];
  description: string;
  resources: string;
  color: string;
}

const LAYER_META: Array<{ id: LayerCategory; label: string; color: string }> = [
  { id: 'disaster', label: 'Disaster Zones', color: '#DC2626' },
  { id: 'danger_zone', label: 'Danger Zones', color: '#EA580C' },
  { id: 'sos', label: 'SOS Requests', color: '#E11D48' },
  { id: 'team', label: 'Rescue Teams', color: '#2563EB' },
  { id: 'hospital', label: 'Hospitals & Med', color: '#0891B2' },
  { id: 'shelter', label: 'Shelters', color: '#7C3AED' },
  { id: 'safe_zone', label: 'Safe Zones', color: '#16A34A' },
  { id: 'iot', label: 'IoT Sensors', color: '#D97706' },
];

function createPinIcon(color: string, shortTag: string): L.DivIcon {
  return L.divIcon({
    className: 'hub-div-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};border:2px solid #FFFFFF;box-shadow:0 3px 8px rgba(15,23,42,0.35);color:#FFFFFF;font-family:JetBrains Mono,monospace;font-size:10px;font-weight:700;">${shortTag}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function buildPopupHtml(detail: SelectedMarkerDetail): string {
  return `
    <div style="padding:12px 14px;max-width:270px;font-family:Public Sans,system-ui,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:700;color:${detail.color};text-transform:uppercase;letter-spacing:0.03em;">${detail.categoryLabel}</span>
        <span style="font-size:11px;font-weight:600;color:#0F172A;background:#F1F5F9;padding:2px 6px;border-radius:4px;">${detail.status}</span>
      </div>
      <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">${detail.title}</div>
      <div style="font-size:12px;color:#475569;line-height:1.45;margin-bottom:8px;">${detail.description}</div>
      <div style="border-top:1px solid #E2E8F0;padding-top:6px;font-size:11px;color:#334155;">
        <strong>Resources / Details:</strong> ${detail.resources}
      </div>
    </div>
  `;
}

export const DisasterMapView: React.FC = () => {
  const {
    mapSites,
    rescueTeams,
    sosRequests,
    iotSensors,
    mapFocusTarget,
    isOnline,
  } = useHub();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerCategory, boolean>>({
    disaster: true,
    danger_zone: true,
    safe_zone: true,
    shelter: true,
    hospital: true,
    team: true,
    sos: true,
    iot: true,
  });
  const [selectedDetail, setSelectedDetail] = useState<SelectedMarkerDetail | null>(null);

  const allItems = useMemo<Array<SelectedMarkerDetail & { layer: LayerCategory; radiusMeters?: number; shortTag: string }>>(() => {
    const list: Array<SelectedMarkerDetail & { layer: LayerCategory; radiusMeters?: number; shortTag: string }> = [];

    for (const site of mapSites) {
      const meta = LAYER_META.find((m) => m.id === site.kind) ?? LAYER_META[0];
      const tagMap: Record<string, string> = {
        disaster: 'DZ',
        danger_zone: '!',
        safe_zone: 'OK',
        shelter: 'SH',
        hospital: 'H',
      };
      list.push({
        id: site.id,
        title: site.name,
        categoryLabel: meta.label,
        status: site.status,
        coordinates: site.coordinates,
        description: site.description,
        resources: site.resourcesSummary,
        color: meta.color,
        layer: site.kind,
        radiusMeters: site.radiusMeters,
        shortTag: tagMap[site.kind] ?? 'PT',
      });
    }

    for (const team of rescueTeams) {
      list.push({
        id: team.id,
        title: `${team.callsign} — ${team.name}`,
        categoryLabel: 'Rescue Team',
        status: team.availability,
        coordinates: team.coordinates,
        description: `${team.specialization}. ${team.missionSummary}`,
        resources: `${team.members.length} members · ${team.equipment.slice(0, 2).join(', ')}`,
        color: '#2563EB',
        layer: 'team',
        shortTag: 'RT',
      });
    }

    for (const sos of sosRequests) {
      const color =
        sos.status === 'Rescued'
          ? '#16A34A'
          : sos.priority === 'Critical'
            ? '#DC2626'
            : '#E11D48';
      list.push({
        id: sos.id,
        title: `${sos.id}: ${sos.emergencyType}`,
        categoryLabel: `SOS (${sos.priority})`,
        status: sos.status,
        coordinates: sos.coordinates,
        description: `${sos.personName} (${sos.peopleAffected} affected) at ${sos.location}. ${sos.description}`,
        resources: `Medical: ${sos.medicalRequirements} · Logged ${formatRelativeTime(sos.requestTime)}`,
        color,
        layer: 'sos',
        shortTag: 'SOS',
      });
    }

    for (const sensor of iotSensors) {
      const color =
        sensor.health === 'Critical'
          ? '#DC2626'
          : sensor.health === 'Warning'
            ? '#D97706'
            : sensor.health === 'Offline'
              ? '#64748B'
              : '#0D9488';
      list.push({
        id: sensor.id,
        title: sensor.name,
        categoryLabel: `IoT ${sensor.type}`,
        status: sensor.health,
        coordinates: sensor.coordinates,
        description: `Reading: ${sensor.readingValue} ${sensor.unit} (${sensor.secondaryMetric ?? 'Active'}). Battery ${sensor.batteryPercent}%.`,
        resources: `Signal ${sensor.signalDbm} dBm · Warning ≥ ${sensor.thresholdWarning} ${sensor.unit}`,
        color,
        layer: 'iot',
        shortTag: 'IO',
      });
    }

    return list;
  }, [mapSites, rescueTeams, sosRequests, iotSensors]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (!enabledLayers[item.layer]) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [allItems, enabledLayers, searchQuery]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.7785, -122.416],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Re-render markers & zone overlays when filters or data update
  useEffect(() => {
    const group = layerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    for (const item of filteredItems) {
      if (item.radiusMeters) {
        L.circle(item.coordinates, {
          radius: item.radiusMeters,
          color: item.color,
          fillColor: item.color,
          fillOpacity: item.layer === 'safe_zone' ? 0.16 : 0.18,
          weight: 2,
          dashArray: item.layer === 'danger_zone' ? '6 4' : undefined,
        }).addTo(group);
      }

      const marker = L.marker(item.coordinates, {
        icon: createPinIcon(item.color, item.shortTag),
      });

      marker.bindPopup(buildPopupHtml(item));
      marker.on('click', () => {
        setSelectedDetail(item);
      });
      marker.addTo(group);
    }
  }, [filteredItems]);

  // Focus map when navigated via "Locate" or "View on Map"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapFocusTarget) return;
    map.setView(mapFocusTarget.coordinates, 15, { animate: true });
    const matched = allItems.find(
      (i) =>
        Math.abs(i.coordinates[0] - mapFocusTarget.coordinates[0]) < 0.0005 &&
        Math.abs(i.coordinates[1] - mapFocusTarget.coordinates[1]) < 0.0005
    );
    if (matched) setSelectedDetail(matched);
  }, [mapFocusTarget, allItems]);

  const toggleLayer = (id: LayerCategory) => {
    setEnabledLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Search and Layer Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents, shelters, SOS IDs, teams..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 tabular-nums">
              Showing {filteredItems.length} markers
            </span>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.setView([37.7785, -122.416], 13)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
              Reset View
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Layers:
          </span>
          {LAYER_META.map((layer) => {
            const active = enabledLayers[layer.id];
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-slate-300 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Viewport + Side Inspector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative lg:col-span-2 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden h-[520px]">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Custom Zoom Controls */}
          <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>

          {!isOnline && (
            <div className="absolute left-3 bottom-3 z-[400] flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm">
              <WifiOff className="h-3.5 w-3.5 text-amber-700" />
              Offline Mode: Cached map tiles &amp; IndexedDB markers active
            </div>
          )}
        </div>

        {/* Location Details & Quick Jump List */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col h-[520px]">
          {selectedDetail ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: selectedDetail.color }}
                  >
                    {selectedDetail.categoryLabel}
                  </div>
                  <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                    {selectedDetail.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Operational Status</span>
                  <span className="font-semibold text-slate-900">{selectedDetail.status}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Coordinates</span>
                  <span className="font-mono text-slate-800 tabular-nums">
                    {selectedDetail.coordinates[0].toFixed(4)}, {selectedDetail.coordinates[1].toFixed(4)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {selectedDetail.description}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Available Resources &amp; Telemetry
                  </div>
                  <div className="text-xs font-medium text-slate-800">
                    {selectedDetail.resources}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => mapInstanceRef.current?.setView(selectedDetail.coordinates, 16, { animate: true })}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                <Compass className="h-3.5 w-3.5" />
                Center Map on Location
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Active Map Points
                </h2>
                <p className="text-xs text-slate-500">
                  Select a marker on the map or choose an entry below to inspect details.
                </p>
              </div>
              <div className="mt-3 flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedDetail(item);
                      mapInstanceRef.current?.setView(item.coordinates, 15, { animate: true });
                    }}
                    className="flex w-full items-start justify-between gap-2 py-2.5 text-left hover:bg-slate-50 px-1.5 rounded"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.categoryLabel} · {item.status}
                      </div>
                    </div>
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
