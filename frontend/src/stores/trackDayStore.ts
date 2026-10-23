import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { db, type PaddockMateDB, type SessionEntity, type TrackDayEntity } from '../db/paddockMateDb'
import { generateUuid } from '../utils/uuid'

export type CreateTrackDayInput = Omit<TrackDayEntity, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>

export interface CreateSessionInput {
  trackDayId?: string
  sessionNumber?: number
  timeOfDay?: string
  notes?: string
}

export const useBaseTrackDayStore = defineStore('trackDay', () => {
  const database = shallowRef<PaddockMateDB>(db)
  const trackDays = ref<TrackDayEntity[]>([])
  const activeTrackDayId = ref<string | null>(null)
  const sessions = ref<SessionEntity[]>([])
  const activeSessionId = ref<string | null>(null)

  const activeTrackDay = computed<TrackDayEntity | null>(() => {
    if (!activeTrackDayId.value) return null
    return trackDays.value.find((td) => td.id === activeTrackDayId.value) ?? null
  })

  const activeSession = computed<SessionEntity | null>(() => {
    if (!activeSessionId.value) return null
    return sessions.value.find((s) => s.id === activeSessionId.value) ?? null
  })

  function setDatabase(customDb: PaddockMateDB): void {
    database.value = customDb
  }

  async function fetchTrackDays(): Promise<TrackDayEntity[]> {
    const list = await database.value.trackDays.orderBy('date').reverse().toArray()
    trackDays.value = list
    return list
  }

  async function createTrackDay(input: CreateTrackDayInput): Promise<TrackDayEntity> {
    const now = new Date().toISOString()
    const id = generateUuid()
    const trackDay: TrackDayEntity = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }

    await database.value.transaction('rw', [database.value.trackDays, database.value.syncQueue], async () => {
      await database.value.trackDays.add(trackDay)
      await database.value.syncQueue.add({
        entityType: 'track_day',
        entityId: id,
        operation: 'INSERT',
        payload: JSON.stringify(trackDay),
        timestamp: Date.now(),
        retryCount: 0,
      })
    })

    trackDays.value.unshift(trackDay)
    activeTrackDayId.value = id
    sessions.value = []
    activeSessionId.value = null
    return trackDay
  }

  async function loadTrackDay(id: string): Promise<TrackDayEntity | null> {
    let trackDay = trackDays.value.find((td) => td.id === id)
    if (!trackDay) {
      const dbRecord = await database.value.trackDays.get(id)
      if (dbRecord) {
        trackDay = dbRecord
        trackDays.value.push(dbRecord)
      }
    }

    activeTrackDayId.value = id
    const loadedSessions = await database.value.sessions
      .where('trackDayId')
      .equals(id)
      .sortBy('sessionNumber')

    sessions.value = loadedSessions
    if (loadedSessions.length > 0) {
      activeSessionId.value = loadedSessions[loadedSessions.length - 1].id
    } else {
      activeSessionId.value = null
    }

    return trackDay ?? null
  }

  async function createSession(input: CreateSessionInput = {}): Promise<SessionEntity> {
    const targetTrackDayId = input.trackDayId ?? activeTrackDayId.value
    if (!targetTrackDayId) {
      throw new Error('An active track day must be selected to create a session')
    }

    const calculatedNumber =
      input.sessionNumber ??
      (sessions.value.length > 0
        ? Math.max(...sessions.value.map((s) => s.sessionNumber)) + 1
        : 1)

    const now = new Date().toISOString()
    const id = generateUuid()
    const session: SessionEntity = {
      id,
      trackDayId: targetTrackDayId,
      sessionNumber: calculatedNumber,
      timeOfDay: input.timeOfDay,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }

    await database.value.transaction('rw', [database.value.sessions, database.value.syncQueue], async () => {
      await database.value.sessions.add(session)
      await database.value.syncQueue.add({
        entityType: 'session',
        entityId: id,
        operation: 'INSERT',
        payload: JSON.stringify(session),
        timestamp: Date.now(),
        retryCount: 0,
      })
    })

    sessions.value.push(session)
    activeSessionId.value = id
    return session
  }

  function setActiveSession(id: string | null): void {
    activeSessionId.value = id
  }

  return {
    trackDays,
    activeTrackDayId,
    activeTrackDay,
    sessions,
    activeSessionId,
    activeSession,
    setDatabase,
    fetchTrackDays,
    createTrackDay,
    loadTrackDay,
    createSession,
    setActiveSession,
  }
})

export function useTrackDayStore(customDb?: PaddockMateDB) {
  const store = useBaseTrackDayStore()
  if (customDb) {
    store.setDatabase(customDb)
  }
  return store
}
