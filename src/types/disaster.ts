export type NavSection =
  | 'dashboard'
  | 'map'
  | 'communication'
  | 'mesh'
  | 'teams'
  | 'sos'
  | 'iot'
  | 'resources'
  | 'alerts'
  | 'analytics'
  | 'settings';

export type EmergencyCategory =
  | 'Medical Emergency'
  | 'Trapped Person'
  | 'Food and Water'
  | 'Missing Person'
  | 'Fire'
  | 'Flood'
  | 'Structural Collapse';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type SosStatus =
  | 'Pending'
  | 'Dispatched'
  | 'In Progress'
  | 'Rescued'
  | 'Cancelled';

export type SyncState = 'synced' | 'queued';

export interface SosRequest {
  id: string;
  personName: string;
  emergencyType: EmergencyCategory;
  location: string;
  coordinates: [number, number];
  peopleAffected: number;
  medicalRequirements: string;
  description: string;
  contactInfo: string;
  priority: PriorityLevel;
  requestTime: string;
  assignedTeamId: string | null;
  status: SosStatus;
  syncState: SyncState;
}

export type ChannelId =
  | 'rescue-team'
  | 'medical-emergency'
  | 'public-safety'
  | 'authority';

export type MessageDeliveryStatus = 'Delivered' | 'Sent' | 'Queued Offline';

export interface ChatMessage {
  id: string;
  channelId: ChannelId;
  senderName: string;
  senderRole: 'Authority' | 'Rescue Lead' | 'Medical Officer' | 'Field Volunteer' | 'Citizen SOS';
  content: string;
  timestamp: string;
  priority: 'Standard' | 'High' | 'Critical Broadcast';
  isBroadcast?: boolean;
  isSos?: boolean;
  deliveryStatus: MessageDeliveryStatus;
  transport: 'Internet Relay' | 'Simulated LoRa Mesh' | 'Local Cache Queue';
}

export type TeamAvailability = 'Available' | 'On Mission' | 'Standby' | 'Returning';

export interface RescueTeam {
  id: string;
  name: string;
  callsign: string;
  specialization: string;
  availability: TeamAvailability;
  locationName: string;
  coordinates: [number, number];
  assignedMissionId: string | null;
  missionSummary: string;
  members: string[];
  equipment: string[];
  radioChannel: ChannelId;
  completedRescues: number;
  avgResponseMinutes: number;
}

export type MeshProtocol = 'LoRa 915MHz' | 'Wi-Fi Direct' | 'Bluetooth Mesh';

export type MeshNodeStatus = 'Connected' | 'Degraded' | 'Offline';

export interface MeshNode {
  id: string;
  name: string;
  protocol: MeshProtocol;
  role: 'Gateway Hub' | 'Relay Repeater' | 'Field Team Node' | 'Sensor Bridge';
  status: MeshNodeStatus;
  signalStrengthDbm: number;
  batteryPercent: number;
  connectedPeers: string[];
  hopsToGateway: number;
  latencyMs: number;
  lastSeen: string;
  locationName: string;
  svgPos: { x: number; y: number };
}

export type SensorType =
  | 'Water Level'
  | 'Temperature'
  | 'Smoke Detector'
  | 'Gas Leakage'
  | 'Environmental'
  | 'GPS Tracker';

export type SensorHealth = 'Nominal' | 'Warning' | 'Critical' | 'Offline';

export interface IotSensor {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  coordinates: [number, number];
  readingValue: number;
  unit: string;
  thresholdWarning: number;
  thresholdCritical: number;
  health: SensorHealth;
  batteryPercent: number;
  signalDbm: number;
  lastUpdated: string;
  secondaryMetric?: string;
}

export type ResourceCategory =
  | 'Food Supplies'
  | 'Drinking Water'
  | 'Medical Kits'
  | 'Ambulances'
  | 'Rescue Vehicles'
  | 'Temporary Shelters'
  | 'Emergency Equipment';

export interface EmergencyResource {
  id: string;
  name: string;
  category: ResourceCategory;
  availableQuantity: number;
  allocatedQuantity: number;
  unit: string;
  depotLocation: string;
  status: 'Adequate' | 'Low Stock' | 'Critical';
  lastUpdated: string;
}

export type AlertSeverity = 'Critical' | 'Warning' | 'Info' | 'Resolved';

export type AlertCategory =
  | 'Critical Emergency'
  | 'Flood Warning'
  | 'Fire Warning'
  | 'Network Failure'
  | 'SOS Notification'
  | 'Rescue Update';

export interface DisasterAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  location: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

export type MapSiteKind =
  | 'disaster'
  | 'shelter'
  | 'hospital'
  | 'safe_zone'
  | 'danger_zone';

export interface MapSite {
  id: string;
  name: string;
  kind: MapSiteKind;
  coordinates: [number, number];
  radiusMeters?: number;
  status: string;
  severity?: PriorityLevel;
  description: string;
  resourcesSummary: string;
  capacity?: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'message' | 'sos' | 'alert' | 'team_update';
  entityId: string;
  summary: string;
  createdAt: string;
  attempts: number;
}

export interface HubSettings {
  operatorName: string;
  stationCallsign: string;
  autoSyncOnReconnect: boolean;
  liveTelemetrySimulation: boolean;
  gatewayEndpoint: string;
  meshBridgeMode: 'Simulated Hardware Bridge' | 'WebSerial LoRa Gateway (Pending Device)';
  backendProvider: 'Local IndexedDB Only' | 'Firebase (Optional)' | 'Supabase (Optional)';
  backendUrl: string;
  criticalAudioAlerts: boolean;
  lastSyncTime: string;
}
