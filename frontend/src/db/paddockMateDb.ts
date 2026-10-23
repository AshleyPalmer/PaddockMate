import Dexie, { type Table } from 'dexie'
import { generateUuid } from '../utils/uuid'
import { UK_TRACK_SEEDS } from './seeds/ukTracks'

export interface VehicleEntity {
  id: string
  make: string
  model: string
  year?: number
  nickname?: string
  defaultColdPressureFl?: number
  defaultColdPressureFr?: number
  defaultColdPressureRl?: number
  defaultColdPressureRr?: number
  defaultTargetPressureFl?: number
  defaultTargetPressureFr?: number
  defaultTargetPressureRl?: number
  defaultTargetPressureRr?: number
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface TrackEntity {
  id: string
  name: string
  country: string
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface LayoutEntity {
  id: string
  trackId: string
  name: string
  lengthMetres?: number
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackDayEntity {
  id: string
  vehicleId: string
  trackId: string
  layoutId: string
  date: string // YYYY-MM-DD
  ambientTemperature?: number
  weatherCondition?: string
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface SessionEntity {
  id: string
  trackDayId: string
  sessionNumber: number
  timeOfDay?: string
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface TyreReadingEntity {
  id: string
  sessionId: string
  corner: 'FL' | 'FR' | 'RL' | 'RR'
  coldPressure?: number
  hotPressure?: number
  targetPressure?: number
  adjustedPressure?: number
  temperature?: number
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface SyncQueueEntity {
  id?: number
  entityType: 'vehicle' | 'track_day' | 'session' | 'tyre_reading'
  entityId: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: string
  timestamp: number
  retryCount: number
}

export class PaddockMateDB extends Dexie {
  vehicles!: Table<VehicleEntity, string>
  tracks!: Table<TrackEntity, string>
  layouts!: Table<LayoutEntity, string>
  trackDays!: Table<TrackDayEntity, string>
  sessions!: Table<SessionEntity, string>
  tyreReadings!: Table<TyreReadingEntity, string>
  syncQueue!: Table<SyncQueueEntity, number>

  constructor(databaseName = 'PaddockMateDB') {
    super(databaseName)

    this.version(1).stores({
      vehicles: 'id, make, model, syncStatus, createdAt',
      tracks: 'id, name, country, isCustom',
      layouts: 'id, trackId, name, isCustom',
      trackDays: 'id, vehicleId, trackId, layoutId, date, syncStatus',
      sessions: 'id, trackDayId, sessionNumber, syncStatus, [trackDayId+sessionNumber]',
      tyreReadings: 'id, sessionId, corner, syncStatus, [sessionId+corner]',
      syncQueue: '++id, entityType, entityId, timestamp',
    })

    this.on('populate', () => {
      return seedUkTracksIfEmpty(this)
    })
  }
}

/**
 * Pre-populates common UK tracks and their layouts if the tracks table is empty.
 */
export async function seedUkTracksIfEmpty(db: PaddockMateDB): Promise<void> {
  const existingCount = await db.tracks.count()
  if (existingCount > 0) {
    return
  }

  const now = new Date().toISOString()
  const tracksToInsert: TrackEntity[] = []
  const layoutsToInsert: LayoutEntity[] = []

  for (const seed of UK_TRACK_SEEDS) {
    const trackId = generateUuid()
    tracksToInsert.push({
      id: trackId,
      name: seed.name,
      country: seed.country,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
    })

    for (const layout of seed.layouts) {
      layoutsToInsert.push({
        id: generateUuid(),
        trackId,
        name: layout.name,
        lengthMetres: layout.lengthMetres,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  await db.tracks.bulkAdd(tracksToInsert)
  await db.layouts.bulkAdd(layoutsToInsert)
}

// Singleton database instance for application runtime
export const db = new PaddockMateDB()
