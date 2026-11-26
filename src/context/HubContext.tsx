import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  INITIAL_ALERTS,
  INITIAL_IOT_SENSORS,
  INITIAL_MAP_SITES,
  INITIAL_MESH_NODES,
  INITIAL_MESSAGES,
  INITIAL_RESOURCES,
  INITIAL_RESCUE_TEAMS,
  INITIAL_SETTINGS,
  INITIAL_SOS_REQUESTS,
} from '../data/seedData';
import {
  deleteFromStore,
  putInStore,
  putManyInStore,
  resetDatabaseToDemo,
  seedAndHydrateDatabase,
} from '../db/indexedDb';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  AlertCategory,
  AlertSeverity,
  ChannelId,
  ChatMessage,
  DisasterAlert,
  EmergencyCategory,
  EmergencyResource,
  HubSettings,
  IotSensor,
  MapSite,
  MeshNode,
  NavSection,
  PriorityLevel,
  RescueTeam,
  SosRequest,
  SosStatus,
  SyncQueueItem,
  TeamAvailability,
} from '../types/disaster';

export interface NewSosInput {
  personName: string;
  emergencyType: EmergencyCategory;
  location: string;
  coordinates?: [number, number];
  peopleAffected: number;
  medicalRequirements: string;
  description: string;
  contactInfo: string;
  priority: PriorityLevel;
}

export interface NewTeamInput {
  name: string;
  callsign: string;
  specialization: string;
  locationName: string;
  coordinates?: [number, number];
  members: string[];
  equipment: string[];
  radioChannel: ChannelId;
}

export interface NewAlertInput {
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  location: string;
}

interface HubContextValue {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  mapFocusTarget: { coordinates: [number, number]; label?: string } | null;
  focusOnMap: (coordinates: [number, number], label?: string) => void;
  isHydrated: boolean;
  isOnline: boolean;
  browserOnline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (offline: boolean) => void;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  sosModalOpen: boolean;
  setSosModalOpen: (open: boolean) => void;

  sosRequests: SosRequest[];
  messages: ChatMessage[];
  rescueTeams: RescueTeam[];
  iotSensors: IotSensor[];
  resources: EmergencyResource[];
  alerts: DisasterAlert[];
  meshNodes: MeshNode[];
  mapSites: MapSite[];
  syncQueue: SyncQueueItem[];
  settings: HubSettings;

  submitSosRequest: (input: NewSosInput) => Promise<SosRequest>;
  assignTeamToSos: (sosId: string, teamId: string | null) => Promise<void>;
  updateSosStatus: (sosId: string, status: SosStatus) => Promise<void>;

  sendMessage: (params: {
    channelId: ChannelId;
    content: string;
    priority: 'Standard' | 'High' | 'Critical Broadcast';
    isBroadcast?: boolean;
    isSos?: boolean;
    senderName?: string;
    senderRole?: ChatMessage['senderRole'];
  }) => Promise<void>;
  removeQueuedItem: (queueId: string) => Promise<void>;

  registerRescueTeam: (input: NewTeamInput) => Promise<RescueTeam>;
  updateTeamAvailability: (teamId: string, availability: TeamAvailability) => Promise<void>;
  assignMissionToTeam: (teamId: string, sosId: string | null) => Promise<void>;

  toggleMeshNodeStatus: (nodeId: string) => Promise<void>;
  triggerSensorAnomaly: (sensorId: string) => Promise<void>;
  resetSensorReadings: () => Promise<void>;

  allocateResource: (resourceId: string, delta: number) => Promise<void>;
  restockResource: (resourceId: string, amount: number) => Promise<void>;

  acknowledgeAlert: (alertId: string) => Promise<void>;
  createAlert: (input: NewAlertInput) => Promise<void>;

  updateSettings: (partial: Partial<HubSettings>) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const HubContext = createContext<HubContextValue | null>(null);

export const HubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const browserOnline = useOnlineStatus();
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const isOnline = browserOnline && !simulatedOffline;

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mapFocusTarget, setMapFocusTarget] = useState<{
    coordinates: [number, number];
    label?: string;
  } | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [sosRequests, setSosRequests] = useState<SosRequest[]>(INITIAL_SOS_REQUESTS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>(INITIAL_RESCUE_TEAMS);
  const [iotSensors, setIotSensors] = useState<IotSensor[]>(INITIAL_IOT_SENSORS);
  const [resources, setResources] = useState<EmergencyResource[]>(INITIAL_RESOURCES);
  const [alerts, setAlerts] = useState<DisasterAlert[]>(INITIAL_ALERTS);
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>(INITIAL_MESH_NODES);
  const [mapSites, setMapSites] = useState<MapSite[]>(INITIAL_MAP_SITES);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [settings, setSettings] = useState<HubSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    let active = true;
    seedAndHydrateDatabase()
      .then((data) => {
        if (!active) return;
        setSosRequests(data.sosRequests);
        setMessages(data.messages);
        setRescueTeams(data.rescueTeams);
        setIotSensors(data.iotSensors);
        setResources(data.resources);
        setAlerts(data.alerts);
        setMeshNodes(data.meshNodes);
        setMapSites(data.mapSites);
        setSyncQueue(data.syncQueue);
        setSettings(data.settings);
        setIsHydrated(true);
      })
      .catch(() => {
        if (active) setIsHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const focusOnMap = useCallback((coordinates: [number, number], label?: string) => {
    setMapFocusTarget({ coordinates, label });
    setActiveSection('map');
  }, []);

  const enqueueSyncItem = useCallback(async (item: SyncQueueItem) => {
    setSyncQueue((prev) => [...prev, item]);
    await putInStore('sync_queue', item).catch(() => {});
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) return;
    setIsSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 650));

      const syncedMsgIds = new Set(
        syncQueue.filter((q) => q.entityType === 'message').map((q) => q.entityId)
      );
      const syncedSosIds = new Set(
        syncQueue.filter((q) => q.entityType === 'sos').map((q) => q.entityId)
      );

      if (syncedMsgIds.size > 0) {
        setMessages((prev) => {
          const next = prev.map((m) =>
            syncedMsgIds.has(m.id)
              ? {
                  ...m,
                  deliveryStatus: 'Delivered' as const,
                  transport: 'Internet Relay' as const,
                }
              : m
          );
          putManyInStore('messages', next.filter((m) => syncedMsgIds.has(m.id))).catch(() => {});
          return next;
        });
      }

      if (syncedSosIds.size > 0) {
        setSosRequests((prev) => {
          const next = prev.map((s) =>
            syncedSosIds.has(s.id) ? { ...s, syncState: 'synced' as const } : s
          );
          putManyInStore('sos_requests', next.filter((s) => syncedSosIds.has(s.id))).catch(() => {});
          return next;
        });
      }

      const itemsToRemove = [...syncQueue];
      setSyncQueue([]);
      await Promise.all(
        itemsToRemove.map((item) => deleteFromStore('sync_queue', item.id).catch(() => {}))
      );

      const nowIso = new Date().toISOString();
      setSettings((prev) => {
        const next = { ...prev, lastSyncTime: nowIso };
        putInStore('settings', { id: 'primary', ...next }).catch(() => {});
        return next;
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncQueue]);

  // Automatic synchronization when connectivity returns
  const wasOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (!wasOnlineRef.current && isOnline && settings.autoSyncOnReconnect && syncQueue.length > 0) {
      void syncNow();
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, settings.autoSyncOnReconnect, syncQueue.length, syncNow]);

  // Simulated IoT telemetry & mesh signal fluctuation when enabled
  useEffect(() => {
    if (!settings.liveTelemetrySimulation) return;
    const interval = setInterval(() => {
      setIotSensors((prev) =>
        prev.map((sensor) => {
          if (sensor.health === 'Offline') return sensor;
          const jitter =
            sensor.type === 'Temperature'
              ? Number(((Math.random() - 0.5) * 1.4).toFixed(1))
              : Math.round((Math.random() - 0.5) * 4);
          const nextValue = Math.max(0, Number((sensor.readingValue + jitter).toFixed(1)));
          const nextHealth =
            nextValue >= sensor.thresholdCritical
              ? 'Critical'
              : nextValue >= sensor.thresholdWarning
                ? 'Warning'
                : 'Nominal';
          return {
            ...sensor,
            readingValue: nextValue,
            health: nextHealth,
            lastUpdated: new Date().toISOString(),
          };
        })
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [settings.liveTelemetrySimulation]);

  const submitSosRequest = useCallback(
    async (input: NewSosInput): Promise<SosRequest> => {
      const id = `SOS-${Math.floor(1050 + Math.random() * 8900)}`;
      const now = new Date().toISOString();
      const baseCoords: [number, number] = input.coordinates ?? [
        37.765 + Math.random() * 0.032,
        -122.435 + Math.random() * 0.045,
      ];

      const newSos: SosRequest = {
        id,
        personName: input.personName.trim(),
        emergencyType: input.emergencyType,
        location: input.location.trim(),
        coordinates: baseCoords,
        peopleAffected: Math.max(1, input.peopleAffected),
        medicalRequirements: input.medicalRequirements.trim() || 'None reported',
        description: input.description.trim(),
        contactInfo: input.contactInfo.trim(),
        priority: input.priority,
        requestTime: now,
        assignedTeamId: null,
        status: 'Pending',
        syncState: isOnline ? 'synced' : 'queued',
      };

      setSosRequests((prev) => [newSos, ...prev]);
      await putInStore('sos_requests', newSos).catch(() => {});

      const newAlert: DisasterAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 8999)}`,
        title: `${input.priority} SOS Intake — ${input.emergencyType}`,
        message: `${input.personName} reported ${input.emergencyType.toLowerCase()} at ${input.location} (${input.peopleAffected} affected).`,
        severity: input.priority === 'Critical' ? 'Critical' : 'Warning',
        category: 'SOS Notification',
        location: input.location,
        timestamp: now,
        acknowledged: false,
        source: isOnline ? 'SOS Web Intake' : 'Offline IndexedDB Intake',
      };
      setAlerts((prev) => [newAlert, ...prev]);
      await putInStore('alerts', newAlert).catch(() => {});

      if (!isOnline) {
        await enqueueSyncItem({
          id: `Q-${Date.now()}`,
          entityType: 'sos',
          entityId: id,
          summary: `SOS ${id}: ${input.emergencyType} at ${input.location}`,
          createdAt: now,
          attempts: 0,
        });
      }

      return newSos;
    },
    [isOnline, enqueueSyncItem]
  );

  const assignTeamToSos = useCallback(
    async (sosId: string, teamId: string | null) => {
      const targetSos = sosRequests.find((s) => s.id === sosId);
      if (!targetSos) return;

      const updatedSos: SosRequest = {
        ...targetSos,
        assignedTeamId: teamId,
        status: teamId && targetSos.status === 'Pending' ? 'Dispatched' : targetSos.status,
      };
      setSosRequests((prev) => prev.map((s) => (s.id === sosId ? updatedSos : s)));
      await putInStore('sos_requests', updatedSos).catch(() => {});

      if (teamId) {
        setRescueTeams((prev) =>
          prev.map((team) => {
            if (team.id !== teamId) return team;
            const updatedTeam: RescueTeam = {
              ...team,
              availability: 'On Mission',
              assignedMissionId: sosId,
              missionSummary: `Responding to ${targetSos.emergencyType} at ${targetSos.location}`,
            };
            putInStore('rescue_teams', updatedTeam).catch(() => {});
            return updatedTeam;
          })
        );
      }
    },
    [sosRequests]
  );

  const updateSosStatus = useCallback(
    async (sosId: string, status: SosStatus) => {
      const targetSos = sosRequests.find((s) => s.id === sosId);
      if (!targetSos) return;

      const updated: SosRequest = { ...targetSos, status };
      setSosRequests((prev) => prev.map((s) => (s.id === sosId ? updated : s)));
      await putInStore('sos_requests', updated).catch(() => {});

      if ((status === 'Rescued' || status === 'Cancelled') && targetSos.assignedTeamId) {
        setRescueTeams((prev) =>
          prev.map((team) => {
            if (team.id !== targetSos.assignedTeamId) return team;
            const updatedTeam: RescueTeam = {
              ...team,
              availability: 'Available',
              assignedMissionId: null,
              missionSummary: 'Standby after mission completion.',
              completedRescues:
                status === 'Rescued' ? team.completedRescues + 1 : team.completedRescues,
            };
            putInStore('rescue_teams', updatedTeam).catch(() => {});
            return updatedTeam;
          })
        );
      }
    },
    [sosRequests]
  );

  const sendMessage = useCallback(
    async (params: {
      channelId: ChannelId;
      content: string;
      priority: 'Standard' | 'High' | 'Critical Broadcast';
      isBroadcast?: boolean;
      isSos?: boolean;
      senderName?: string;
      senderRole?: ChatMessage['senderRole'];
    }) => {
      const now = new Date().toISOString();
      const id = `MSG-${Date.now().toString().slice(-6)}`;
      const msg: ChatMessage = {
        id,
        channelId: params.channelId,
        senderName: params.senderName ?? settings.operatorName,
        senderRole: params.senderRole ?? 'Authority',
        content: params.content.trim(),
        timestamp: now,
        priority: params.priority,
        isBroadcast: params.isBroadcast,
        isSos: params.isSos,
        deliveryStatus: isOnline ? 'Delivered' : 'Queued Offline',
        transport: isOnline ? 'Internet Relay' : 'Local Cache Queue',
      };

      setMessages((prev) => [...prev, msg]);
      await putInStore('messages', msg).catch(() => {});

      if (!isOnline) {
        await enqueueSyncItem({
          id: `Q-${Date.now()}`,
          entityType: 'message',
          entityId: id,
          summary: `[${params.channelId}] ${msg.content.slice(0, 64)}`,
          createdAt: now,
          attempts: 0,
        });
      }
    },
    [isOnline, settings.operatorName, enqueueSyncItem]
  );

  const removeQueuedItem = useCallback(async (queueId: string) => {
    setSyncQueue((prev) => prev.filter((item) => item.id !== queueId));
    await deleteFromStore('sync_queue', queueId).catch(() => {});
  }, []);

  const registerRescueTeam = useCallback(async (input: NewTeamInput): Promise<RescueTeam> => {
    const newTeam: RescueTeam = {
      id: `TEAM-${Math.floor(10 + Math.random() * 89)}`,
      name: input.name.trim(),
      callsign: input.callsign.trim().toUpperCase(),
      specialization: input.specialization.trim(),
      availability: 'Available',
      locationName: input.locationName.trim(),
      coordinates: input.coordinates ?? [37.776 + Math.random() * 0.018, -122.42 + Math.random() * 0.02],
      assignedMissionId: null,
      missionSummary: 'Awaiting mission dispatch.',
      members: input.members.filter(Boolean),
      equipment: input.equipment.filter(Boolean),
      radioChannel: input.radioChannel,
      completedRescues: 0,
      avgResponseMinutes: 9.0,
    };
    setRescueTeams((prev) => [newTeam, ...prev]);
    await putInStore('rescue_teams', newTeam).catch(() => {});
    return newTeam;
  }, []);

  const updateTeamAvailability = useCallback(
    async (teamId: string, availability: TeamAvailability) => {
      setRescueTeams((prev) =>
        prev.map((team) => {
          if (team.id !== teamId) return team;
          const updated = { ...team, availability };
          putInStore('rescue_teams', updated).catch(() => {});
          return updated;
        })
      );
    },
    []
  );

  const assignMissionToTeam = useCallback(
    async (teamId: string, sosId: string | null) => {
      if (!sosId) {
        setRescueTeams((prev) =>
          prev.map((t) => {
            if (t.id !== teamId) return t;
            const updated: RescueTeam = {
              ...t,
              availability: 'Available',
              assignedMissionId: null,
              missionSummary: 'Standby at staging location.',
            };
            putInStore('rescue_teams', updated).catch(() => {});
            return updated;
          })
        );
        return;
      }
      await assignTeamToSos(sosId, teamId);
    },
    [assignTeamToSos]
  );

  const toggleMeshNodeStatus = useCallback(async (nodeId: string) => {
    setMeshNodes((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        const nextStatus = node.status === 'Offline' ? 'Connected' : 'Offline';
        const updated: MeshNode = {
          ...node,
          status: nextStatus,
          signalStrengthDbm: nextStatus === 'Connected' ? -72 : -120,
          batteryPercent: nextStatus === 'Connected' && node.batteryPercent === 0 ? 65 : node.batteryPercent,
          latencyMs: nextStatus === 'Connected' ? 84 : 0,
          lastSeen: new Date().toISOString(),
        };
        putInStore('mesh_nodes', updated).catch(() => {});
        return updated;
      })
    );
  }, []);

  const triggerSensorAnomaly = useCallback(async (sensorId: string) => {
    const now = new Date().toISOString();
    let spikedSensor: IotSensor | null = null;
    setIotSensors((prev) =>
      prev.map((sensor) => {
        if (sensor.id !== sensorId) return sensor;
        const spikedValue = Math.round(sensor.thresholdCritical * 1.25);
        const updated: IotSensor = {
          ...sensor,
          readingValue: spikedValue,
          health: 'Critical',
          lastUpdated: now,
        };
        spikedSensor = updated;
        putInStore('iot_sensors', updated).catch(() => {});
        return updated;
      })
    );

    if (spikedSensor) {
      const s = spikedSensor as IotSensor;
      const alert: DisasterAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 8999)}`,
        title: `Sensor Threshold Breach — ${s.name}`,
        message: `${s.type} reading spiked to ${s.readingValue} ${s.unit} (critical threshold ${s.thresholdCritical} ${s.unit}).`,
        severity: 'Critical',
        category:
          s.type === 'Water Level'
            ? 'Flood Warning'
            : s.type === 'Smoke Detector' || s.type === 'Temperature'
              ? 'Fire Warning'
              : 'Critical Emergency',
        location: s.location,
        timestamp: now,
        acknowledged: false,
        source: `IoT Sensor ${s.id}`,
      };
      setAlerts((prev) => [alert, ...prev]);
      await putInStore('alerts', alert).catch(() => {});
    }
  }, []);

  const resetSensorReadings = useCallback(async () => {
    setIotSensors(INITIAL_IOT_SENSORS);
    await putManyInStore('iot_sensors', INITIAL_IOT_SENSORS).catch(() => {});
  }, []);

  const allocateResource = useCallback(async (resourceId: string, delta: number) => {
    setResources((prev) =>
      prev.map((res) => {
        if (res.id !== resourceId) return res;
        const actualDelta = Math.min(delta, res.availableQuantity);
        if (actualDelta <= 0) return res;
        const nextAvail = res.availableQuantity - actualDelta;
        const nextAlloc = res.allocatedQuantity + actualDelta;
        const total = nextAvail + nextAlloc;
        const ratio = total > 0 ? nextAvail / total : 0;
        const status: EmergencyResource['status'] =
          ratio <= 0.18 ? 'Critical' : ratio <= 0.35 ? 'Low Stock' : 'Adequate';
        const updated: EmergencyResource = {
          ...res,
          availableQuantity: nextAvail,
          allocatedQuantity: nextAlloc,
          status,
          lastUpdated: new Date().toISOString(),
        };
        putInStore('resources', updated).catch(() => {});
        return updated;
      })
    );
  }, []);

  const restockResource = useCallback(async (resourceId: string, amount: number) => {
    setResources((prev) =>
      prev.map((res) => {
        if (res.id !== resourceId || amount <= 0) return res;
        const nextAvail = res.availableQuantity + amount;
        const total = nextAvail + res.allocatedQuantity;
        const ratio = total > 0 ? nextAvail / total : 1;
        const status: EmergencyResource['status'] =
          ratio <= 0.18 ? 'Critical' : ratio <= 0.35 ? 'Low Stock' : 'Adequate';
        const updated: EmergencyResource = {
          ...res,
          availableQuantity: nextAvail,
          status,
          lastUpdated: new Date().toISOString(),
        };
        putInStore('resources', updated).catch(() => {});
        return updated;
      })
    );
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        const updated = { ...a, acknowledged: true };
        putInStore('alerts', updated).catch(() => {});
        return updated;
      })
    );
  }, []);

  const createAlert = useCallback(
    async (input: NewAlertInput) => {
      const alert: DisasterAlert = {
        id: `ALT-${Math.floor(1000 + Math.random() * 8999)}`,
        title: input.title.trim(),
        message: input.message.trim(),
        severity: input.severity,
        category: input.category,
        location: input.location.trim(),
        timestamp: new Date().toISOString(),
        acknowledged: false,
        source: settings.operatorName,
      };
      setAlerts((prev) => [alert, ...prev]);
      await putInStore('alerts', alert).catch(() => {});
    },
    [settings.operatorName]
  );

  const updateSettings = useCallback(async (partial: Partial<HubSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      putInStore('settings', { id: 'primary', ...next }).catch(() => {});
      return next;
    });
  }, []);

  const resetDemoData = useCallback(async () => {
    const data = await resetDatabaseToDemo();
    setSosRequests(data.sosRequests);
    setMessages(data.messages);
    setRescueTeams(data.rescueTeams);
    setIotSensors(data.iotSensors);
    setResources(data.resources);
    setAlerts(data.alerts);
    setMeshNodes(data.meshNodes);
    setMapSites(data.mapSites);
    setSyncQueue(data.syncQueue);
    setSettings(data.settings);
  }, []);

  const value = useMemo<HubContextValue>(
    () => ({
      activeSection,
      setActiveSection,
      mapFocusTarget,
      focusOnMap,
      isHydrated,
      isOnline,
      browserOnline,
      simulatedOffline,
      setSimulatedOffline,
      isSyncing,
      syncNow,
      sosModalOpen,
      setSosModalOpen,
      sosRequests,
      messages,
      rescueTeams,
      iotSensors,
      resources,
      alerts,
      meshNodes,
      mapSites,
      syncQueue,
      settings,
      submitSosRequest,
      assignTeamToSos,
      updateSosStatus,
      sendMessage,
      removeQueuedItem,
      registerRescueTeam,
      updateTeamAvailability,
      assignMissionToTeam,
      toggleMeshNodeStatus,
      triggerSensorAnomaly,
      resetSensorReadings,
      allocateResource,
      restockResource,
      acknowledgeAlert,
      createAlert,
      updateSettings,
      resetDemoData,
    }),
    [
      activeSection,
      mapFocusTarget,
      focusOnMap,
      isHydrated,
      isOnline,
      browserOnline,
      simulatedOffline,
      isSyncing,
      syncNow,
      sosModalOpen,
      sosRequests,
      messages,
      rescueTeams,
      iotSensors,
      resources,
      alerts,
      meshNodes,
      mapSites,
      syncQueue,
      settings,
      submitSosRequest,
      assignTeamToSos,
      updateSosStatus,
      sendMessage,
      removeQueuedItem,
      registerRescueTeam,
      updateTeamAvailability,
      assignMissionToTeam,
      toggleMeshNodeStatus,
      triggerSensorAnomaly,
      resetSensorReadings,
      allocateResource,
      restockResource,
      acknowledgeAlert,
      createAlert,
      updateSettings,
      resetDemoData,
    ]
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
};

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}
