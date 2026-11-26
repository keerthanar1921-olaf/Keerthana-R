import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ChannelId, TeamAvailability } from '../../types/disaster';
import { getAvailabilityStyles } from '../../utils/formatters';

const AVAILABILITY_OPTIONS: TeamAvailability[] = [
  'Available',
  'On Mission',
  'Standby',
  'Returning',
];

export const RescueTeamsView: React.FC = () => {
  const {
    rescueTeams,
    sosRequests,
    registerRescueTeam,
    updateTeamAvailability,
    assignMissionToTeam,
    focusOnMap,
  } = useHub();

  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [specialization, setSpecialization] = useState('Search & Medical Extraction');
  const [locationName, setLocationName] = useState('');
  const [membersText, setMembersText] = useState('');
  const [equipmentText, setEquipmentText] = useState('');
  const [radioChannel, setRadioChannel] = useState<ChannelId>('rescue-team');

  const activeSosList = sosRequests.filter(
    (s) => s.status !== 'Rescued' && s.status !== 'Cancelled'
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !callsign.trim() || !locationName.trim()) return;
    await registerRescueTeam({
      name,
      callsign,
      specialization,
      locationName,
      members: membersText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      equipment: equipmentText
        .split(',')
        .map((eq) => eq.trim())
        .filter(Boolean),
      radioChannel,
    });
    setName('');
    setCallsign('');
    setLocationName('');
    setMembersText('');
    setEquipmentText('');
    setShowRegister(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Summary + Register Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500">Total Units</span>
            <div className="font-display text-xl font-bold text-slate-900 tabular-nums">
              {rescueTeams.length}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Available</span>
            <div className="font-display text-xl font-bold text-emerald-600 tabular-nums">
              {rescueTeams.filter((t) => t.availability === 'Available').length}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Active Missions</span>
            <div className="font-display text-xl font-bold text-blue-600 tabular-nums">
              {rescueTeams.filter((t) => t.availability === 'On Mission').length}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRegister(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Register Rescue Team
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {rescueTeams.map((team) => {
          const linkedSos = sosRequests.find((s) => s.id === team.assignedMissionId);
          return (
            <article
              key={team.id}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-blue-700">
                        {team.callsign}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{team.specialization}</span>
                    </div>
                    <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                      {team.name}
                    </h2>
                  </div>

                  <select
                    value={team.availability}
                    onChange={(e) =>
                      void updateTeamAvailability(team.id, e.target.value as TeamAvailability)
                    }
                    aria-label={`Availability for ${team.name}`}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getAvailabilityStyles(
                      team.availability
                    )}`}
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location & Mission Assignment */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">
                      Location: <strong className="text-slate-900">{team.locationName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => focusOnMap(team.coordinates, `${team.callsign}: ${team.name}`)}
                      className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Show on Map
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label className="text-slate-600 font-medium">Assigned Mission:</label>
                    <select
                      value={team.assignedMissionId ?? ''}
                      onChange={(e) =>
                        void assignMissionToTeam(team.id, e.target.value ? e.target.value : null)
                      }
                      className="flex-1 min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
                    >
                      <option value="">No active mission (Standby)</option>
                      {activeSosList.map((sos) => (
                        <option key={sos.id} value={sos.id}>
                          {sos.id} — {sos.emergencyType} ({sos.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {linkedSos
                      ? `Mission ${linkedSos.id} (${linkedSos.status}): ${linkedSos.description}`
                      : team.missionSummary}
                  </p>
                </div>

                {/* Members & Equipment */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      Team Members ({team.members.length})
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {team.members.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1.5">
                      <Wrench className="h-3.5 w-3.5 text-slate-500" />
                      Equipment Ready
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {team.equipment.map((eq) => (
                        <li key={eq}>• {eq}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Rescues completed:{' '}
                  <strong className="font-mono text-slate-800 tabular-nums">
                    {team.completedRescues}
                  </strong>
                </span>
                <span className="font-mono tabular-nums">
                  Avg response: {team.avgResponseMinutes} min
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Register Rescue Team Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Register New Rescue Team
              </h3>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleRegister(e)} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Foxtrot Drone Recon"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Callsign *
                  </label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    placeholder="FOX-5"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Radio Channel
                  </label>
                  <select
                    value={radioChannel}
                    onChange={(e) => setRadioChannel(e.target.value as ChannelId)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="rescue-team">Rescue Team Channel</option>
                    <option value="medical-emergency">Medical Emergency Channel</option>
                    <option value="public-safety">Public Safety Channel</option>
                    <option value="authority">Authority Channel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Staging Location *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Marina High School Staging Lot"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Team Members (comma-separated)
                </label>
                <input
                  type="text"
                  value={membersText}
                  onChange={(e) => setMembersText(e.target.value)}
                  placeholder="Lead Alex Park, Medic Dana Fox, Tech Ray Ortiz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Equipment Inventory (comma-separated)
                </label>
                <input
                  type="text"
                  value={equipmentText}
                  onChange={(e) => setEquipmentText(e.target.value)}
                  placeholder="4x4 Utility Van, LoRa Repeater, Trauma Kit"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
