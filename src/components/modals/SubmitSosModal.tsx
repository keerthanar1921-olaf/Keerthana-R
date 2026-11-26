import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, WifiOff, X } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { EmergencyCategory, PriorityLevel } from '../../types/disaster';

const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  'Medical Emergency',
  'Trapped Person',
  'Food and Water',
  'Missing Person',
  'Fire',
  'Flood',
  'Structural Collapse',
];

const PRIORITY_LEVELS: PriorityLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const PRESET_COORDINATES: Array<{ label: string; coords: [number, number] }> = [
  { label: 'Embarcadero Waterfront', coords: [37.7955, -122.3937] },
  { label: 'Civic Center District', coords: [37.7793, -122.4192] },
  { label: 'Mission Creek Sector', coords: [37.7689, -122.4085] },
  { label: 'South Pier Industrial', coords: [37.7812, -122.3885] },
  { label: 'Marina Coastal Zone', coords: [37.8005, -122.4355] },
];

export const SubmitSosModal: React.FC = () => {
  const { sosModalOpen, setSosModalOpen, submitSosRequest, isOnline } = useHub();

  const [personName, setPersonName] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyCategory>('Medical Emergency');
  const [location, setLocation] = useState('');
  const [sectorIndex, setSectorIndex] = useState(0);
  const [peopleAffected, setPeopleAffected] = useState('1');
  const [medicalRequirements, setMedicalRequirements] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Critical');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (!sosModalOpen) return null;

  const handleClose = () => {
    setSosModalOpen(false);
    setSubmittedId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personName.trim() || !location.trim() || !description.trim() || !contactInfo.trim()) {
      setError('Please complete all required fields: name, location, description, and contact.');
      return;
    }

    const parsedCount = parseInt(peopleAffected, 10);
    if (Number.isNaN(parsedCount) || parsedCount < 1) {
      setError('Number of people affected must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      const preset = PRESET_COORDINATES[sectorIndex];
      const jitterLat = (Math.random() - 0.5) * 0.004;
      const jitterLng = (Math.random() - 0.5) * 0.004;
      const created = await submitSosRequest({
        personName,
        emergencyType,
        location,
        coordinates: [preset.coords[0] + jitterLat, preset.coords[1] + jitterLng],
        peopleAffected: parsedCount,
        medicalRequirements,
        description,
        contactInfo,
        priority,
      });
      setSubmittedId(created.id);
      setPersonName('');
      setLocation('');
      setPeopleAffected('1');
      setMedicalRequirements('');
      setDescription('');
      setContactInfo('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Submit Emergency SOS Request
              </h2>
              <p className="text-xs text-slate-500">
                {isOnline
                  ? 'Dispatches immediately to command center & nearby units'
                  : 'Offline mode: Saved locally to IndexedDB & queued for sync'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close SOS form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedId ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
              SOS Request Logged: <span className="font-mono">{submittedId}</span>
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {isOnline
                ? 'Request has been persisted and broadcasted to dispatch operators.'
                : 'Stored locally in IndexedDB and added to the outbound synchronization queue.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSubmittedId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Submit Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
            {!isOnline && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  No internet connection detected. Your SOS will be cached locally and automatically
                  transmitted once connectivity or a mesh gateway becomes available.
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Person&apos;s Name *
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Full name or reporter"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Emergency Category *
                </label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as EmergencyCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {EMERGENCY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Location / Address *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Street, building, floor, or landmark"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Map Zone Sector
                </label>
                <select
                  value={sectorIndex}
                  onChange={(e) => setSectorIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {PRESET_COORDINATES.map((p, idx) => (
                    <option key={p.label} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  People Affected *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {PRIORITY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Information *
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number, radio frequency, or mesh node ID"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Medical Requirements
                </label>
                <input
                  type="text"
                  value={medicalRequirements}
                  onChange={(e) => setMedicalRequirements(e.target.value)}
                  placeholder="Oxygen, insulin, trauma kit, wheelchair extraction, etc."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Emergency Description *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe hazards, water depth, structural damage, or access routes..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : isOnline ? 'Transmit SOS Request' : 'Queue Offline SOS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
