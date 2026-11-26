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
  ChatMessage,
  DisasterAlert,
  EmergencyResource,
  HubSettings,
  IotSensor,
  MapSite,
  MeshNode,
  RescueTeam,
  SosRequest,
  SyncQueueItem,
} from '../types/disaster';

const DB_NAME = 'disaster_comm_hub_db';
const DB_VERSION = 1;

export type StoreName =
  | 'sos_requests'
  | 'messages'
  | 'rescue_teams'
  | 'iot_sensors'
  | 'resources'
  | 'alerts'
  | 'mesh_nodes'
  | 'map_sites'
  | 'sync_queue'
  | 'settings';

const STORES: StoreName[] = [
  'sos_requests',
  'messages',
  'rescue_teams',
  'iot_sensors',
  'resources',
  'alerts',
  'mesh_nodes',
  'map_sites',
  'sync_queue',
  'settings',
];

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function putInStore<T extends { id: string }>(
  storeName: StoreName,
  item: T
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function putManyInStore<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface HydratedHubData {
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
}

export async function seedAndHydrateDatabase(): Promise<HydratedHubData> {
  const existingSettings = await getAllFromStore<HubSettings & { id: string }>('settings');

  if (existingSettings.length === 0) {
    await Promise.all([
      putManyInStore('sos_requests', INITIAL_SOS_REQUESTS),
      putManyInStore('messages', INITIAL_MESSAGES),
      putManyInStore('rescue_teams', INITIAL_RESCUE_TEAMS),
      putManyInStore('iot_sensors', INITIAL_IOT_SENSORS),
      putManyInStore('resources', INITIAL_RESOURCES),
      putManyInStore('alerts', INITIAL_ALERTS),
      putManyInStore('mesh_nodes', INITIAL_MESH_NODES),
      putManyInStore('map_sites', INITIAL_MAP_SITES),
      putInStore('settings', { id: 'primary', ...INITIAL_SETTINGS }),
    ]);
  }

  const [
    sosRequests,
    messages,
    rescueTeams,
    iotSensors,
    resources,
    alerts,
    meshNodes,
    mapSites,
    syncQueue,
    settingsList,
  ] = await Promise.all([
    getAllFromStore<SosRequest>('sos_requests'),
    getAllFromStore<ChatMessage>('messages'),
    getAllFromStore<RescueTeam>('rescue_teams'),
    getAllFromStore<IotSensor>('iot_sensors'),
    getAllFromStore<EmergencyResource>('resources'),
    getAllFromStore<DisasterAlert>('alerts'),
    getAllFromStore<MeshNode>('mesh_nodes'),
    getAllFromStore<MapSite>('map_sites'),
    getAllFromStore<SyncQueueItem>('sync_queue'),
    getAllFromStore<HubSettings & { id: string }>('settings'),
  ]);

  const rawSettings = settingsList[0] ?? { id: 'primary', ...INITIAL_SETTINGS };
  const { id: _ignored, ...settings } = rawSettings as HubSettings & { id?: string };

  return {
    sosRequests: sosRequests.sort(
      (a, b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime()
    ),
    messages: messages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    rescueTeams,
    iotSensors,
    resources,
    alerts: alerts.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    meshNodes,
    mapSites,
    syncQueue,
    settings,
  };
}

export async function resetDatabaseToDemo(): Promise<HydratedHubData> {
  await Promise.all(STORES.map((store) => clearStore(store)));
  return seedAndHydrateDatabase();
}
