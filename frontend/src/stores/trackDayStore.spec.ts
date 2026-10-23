import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { PaddockMateDB } from '../db/paddockMateDb'
import { useTrackDayStore } from './trackDayStore'

describe('useTrackDayStore', () => {
  let testDb: PaddockMateDB

  beforeEach(async () => {
    setActivePinia(createPinia())
    const testDbName = `TrackDayStoreTest-${Date.now()}-${Math.random()}`
    testDb = new PaddockMateDB(testDbName)
    await testDb.open()
  })

  it('initialises with empty state and null active track day', async () => {
    const store = useTrackDayStore(testDb)
    await store.fetchTrackDays()

    expect(store.trackDays).toEqual([])
    expect(store.activeTrackDay).toBeNull()
    expect(store.activeTrackDayId).toBeNull()
    expect(store.sessions).toEqual([])
  })

  it('creates a track day, persists to IndexedDB, adds to syncQueue, and marks active', async () => {
    const store = useTrackDayStore(testDb)

    const trackDay = await store.createTrackDay({
      vehicleId: '018f0000-0000-7000-8000-000000000001',
      trackId: '018f0000-0000-7000-8000-000000000002',
      layoutId: '018f0000-0000-7000-8000-000000000003',
      date: '2026-10-24',
      ambientTemperature: 15.5,
      weatherCondition: 'Dry',
      notes: 'Morning session slightly overcast',
    })

    expect(trackDay.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(trackDay.syncStatus).toBe('pending')
    expect(store.activeTrackDayId).toBe(trackDay.id)
    expect(store.activeTrackDay?.date).toBe('2026-10-24')
    expect(store.trackDays).toHaveLength(1)

    // Verify IndexedDB
    const dbRecord = await testDb.trackDays.get(trackDay.id)
    expect(dbRecord).toBeDefined()
    expect(dbRecord?.weatherCondition).toBe('Dry')

    // Verify sync queue
    const syncRecords = await testDb.syncQueue.toArray()
    expect(syncRecords.some((r) => r.entityType === 'track_day' && r.entityId === trackDay.id)).toBe(true)
  })

  it('creates sequential sessions for active track day and updates activeSession', async () => {
    const store = useTrackDayStore(testDb)

    const trackDay = await store.createTrackDay({
      vehicleId: '018f0000-0000-7000-8000-000000000001',
      trackId: '018f0000-0000-7000-8000-000000000002',
      layoutId: '018f0000-0000-7000-8000-000000000003',
      date: '2026-10-24',
    })

    const session1 = await store.createSession({
      timeOfDay: '09:30',
      notes: 'Sighting laps',
    })

    expect(session1.trackDayId).toBe(trackDay.id)
    expect(session1.sessionNumber).toBe(1)
    expect(session1.syncStatus).toBe('pending')
    expect(store.sessions).toHaveLength(1)
    expect(store.activeSessionId).toBe(session1.id)

    const session2 = await store.createSession({
      timeOfDay: '10:45',
      notes: 'First quick stint',
    })

    expect(session2.sessionNumber).toBe(2)
    expect(store.sessions).toHaveLength(2)
    expect(store.activeSessionId).toBe(session2.id)

    // Verify sync queue entries for sessions
    const syncRecords = await testDb.syncQueue.toArray()
    const sessionSyncs = syncRecords.filter((r) => r.entityType === 'session')
    expect(sessionSyncs).toHaveLength(2)
  })

  it('loads a specific track day and its corresponding sessions', async () => {
    const store = useTrackDayStore(testDb)

    const day1 = await store.createTrackDay({
      vehicleId: '018f0000-0000-7000-8000-000000000001',
      trackId: '018f0000-0000-7000-8000-000000000002',
      layoutId: '018f0000-0000-7000-8000-000000000003',
      date: '2026-10-20',
    })
    await store.createSession({ notes: 'Day 1 Session 1' })

    const day2 = await store.createTrackDay({
      vehicleId: '018f0000-0000-7000-8000-000000000001',
      trackId: '018f0000-0000-7000-8000-000000000002',
      layoutId: '018f0000-0000-7000-8000-000000000003',
      date: '2026-10-24',
    })
    await store.createSession({ notes: 'Day 2 Session 1' })
    await store.createSession({ notes: 'Day 2 Session 2' })

    // Switch back to Day 1
    await store.loadTrackDay(day1.id)
    expect(store.activeTrackDayId).toBe(day1.id)
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].notes).toBe('Day 1 Session 1')

    // Switch to Day 2
    await store.loadTrackDay(day2.id)
    expect(store.activeTrackDayId).toBe(day2.id)
    expect(store.sessions).toHaveLength(2)
  })
})
