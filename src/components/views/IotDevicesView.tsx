import React, { useMemo, useState } from 'react';
import {
  Activity,
  Battery,
  Flame,
  MapPin,
  Navigation,
  RotateCcw,
  Signal,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { SensorType } from '../../types/disaster';
import { formatRelativeTime, getSensorHealthStyles } from '../../utils/formatters';

const SENSOR_TYPES: Array<'All' | SensorType> = [
  'All',
  'Water Level',
  'Temperature',
  'Smoke Detector',
  'Gas Leakage',
  'Environmental',
  'GPS Tracker',
];

function getSensorIcon(type: SensorType) {
  switch (type) {
    case 'Water Level':
      return Waves;
    case 'Temperature':
      return Thermometer;
    case 'Smoke Detector':
      return Flame;
    case 'Gas Leakage':
      return Wind;
    case 'Environmental':
      return Activity;
    case 'GPS Tracker':
      return Navigation;
  }
}

export const IotDevicesView: React.FC = () => {
  const {
    iotSensors,
    settings,
    updateSettings,
    triggerSensorAnomaly,
    resetSensorReadings,
    focusOnMap,
  } = useHub();

  const [typeFilter, setTypeFilter] = useState<'All' | SensorType>('All');

  const filteredSensors = useMemo(
    () =>
      iotSensors.filter((s) => (typeFilter === 'All' ? true : s.type === typeFilter)),
    [iotSensors, typeFilter]
  );

  const criticalCount = iotSensors.filter((s) => s.health === 'Critical').length;
  const warningCount = iotSensors.filter((s) => s.health === 'Warning').length;
  const offlineCount = iotSensors.filter((s) => s.health === 'Offline').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500">Deployed Sensors</span>
            <div className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {iotSensors.length}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Critical Threshold</span>
            <div className="font-display text-xl font-bold text-red-600 tabular-nums">
              {criticalCount}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Warnings</span>
            <div className="font-display text-xl font-bold text-amber-600 tabular-nums">
              {warningCount}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Offline</span>
            <div className="font-display text-xl font-bold text-slate-600 tabular-nums">
              {offlineCount}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.liveTelemetrySimulation}
              onChange={(e) =>
                void updateSettings({ liveTelemetrySimulation: e.target.checked })
              }
              className="rounded border-slate-300 text-blue-600"
            />
            Simulated Live Telemetry Stream
          </label>
          <button
            type="button"
            onClick={() => void resetSensorReadings()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Baseline
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2">
        {SENSOR_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              typeFilter === type
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSensors.map((sensor) => {
          const Icon = getSensorIcon(sensor.type);
          const pctOfCritical = Math.min(
            100,
            Math.round((sensor.readingValue / Math.max(1, sensor.thresholdCritical)) * 100)
          );
          const barColor =
            sensor.health === 'Critical'
              ? 'bg-red-600'
              : sensor.health === 'Warning'
                ? 'bg-amber-500'
                : sensor.health === 'Offline'
                  ? 'bg-slate-400'
                  : 'bg-emerald-600';

          return (
            <article
              key={sensor.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-semibold text-slate-500">
                      {sensor.id} · {sensor.type}
                    </div>
                    <h3 className="truncate font-display text-sm font-semibold text-slate-900">
                      {sensor.name}
                    </h3>
                    <div className="truncate text-xs text-slate-500">{sensor.location}</div>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${getSensorHealthStyles(
                    sensor.health
                  )}`}
                >
                  {sensor.health}
                </span>
              </div>

              {/* Primary Live-Looking Reading */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      {sensor.health === 'Offline' ? '—' : sensor.readingValue}
                    </span>
                    <span className="ml-1 text-xs font-medium text-slate-600">{sensor.unit}</span>
                  </div>
                  <span className="text-xs text-slate-500">{sensor.secondaryMetric}</span>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all ${barColor}`}
                    style={{ width: `${sensor.health === 'Offline' ? 0 : pctOfCritical}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>Warn ≥ {sensor.thresholdWarning} {sensor.unit}</span>
                  <span>Crit ≥ {sensor.thresholdCritical} {sensor.unit}</span>
                </div>
              </div>

              {/* Battery, Signal & Actions */}
              <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Battery className="h-3.5 w-3.5 text-slate-400" />
                  {sensor.batteryPercent}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <Signal className="h-3.5 w-3.5 text-slate-400" />
                  {sensor.signalDbm} dBm
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatRelativeTime(sensor.lastUpdated)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => focusOnMap(sensor.coordinates, sensor.name)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => void triggerSensorAnomaly(sensor.id)}
                  disabled={sensor.health === 'Offline'}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Simulate Spike
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
