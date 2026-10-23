import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { PaddockMateDB } from '../db/paddockMateDb'
import { useTyreReadingStore } from './tyreReadingStore'

describe('useTyreReadingStore', () => {
  let testDb: PaddockMateDB
  const sampleSessionId = '018f0000-0000-7000-8000-000000000010'

  beforeEach(async () => {
    setActivePinia(createPinia())
    const testDbName = `TyreReadingStoreTest-${Date.now()}-${Math.random()}`
    testDb = new PaddockMateDB(testDbName)
    await testDb.open()
  })

  it('initialises with null readings for all four corners', () => {
    const store = useTyreReadingStore(testDb)
    expect(store.readings.FL).toBeNull()
    expect(store.readings.FR).toBeNull()
    expect(store.readings.RL).toBeNull()
    expect(store.readings.RR).toBeNull()
    expect(store.allCornersLogged).toBe(false)
  })

  it('saves an individual corner reading and logs INSERT to syncQueue', async () => {
    const store = useTyreReadingStore(testDb)

    const reading = await store.saveReading({
      sessionId: sampleSessionId,
      corner: 'FL',
      coldPressure: 26.0,
      hotPressure: 33.5,
      targetPressure: 30.0,
      adjustedPressure: 30.0,
      temperature: 65,
    })

    expect(reading.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(reading.corner).toBe('FL')
    expect(reading.syncStatus).toBe('pending')
    expect(store.readings.FL?.hotPressure).toBe(33.5)

    // Verify IndexedDB
    const dbRecord = await testDb.tyreReadings.get(reading.id)
    expect(dbRecord).toBeDefined()
    expect(dbRecord?.coldPressure).toBe(26.0)

    // Verify sync queue
    const syncRecords = await testDb.syncQueue.toArray()
    expect(syncRecords).toHaveLength(1)
    expect(syncRecords[0].entityType).toBe('tyre_reading')
    expect(syncRecords[0].operation).toBe('INSERT')
  })

  it('updates existing corner reading without creating duplicate record', async () => {
    const store = useTyreReadingStore(testDb)

    const initial = await store.saveReading({
      sessionId: sampleSessionId,
      corner: 'FR',
      coldPressure: 26.0,
      targetPressure: 30.0,
    })

    const updated = await store.saveReading({
      sessionId: sampleSessionId,
      corner: 'FR',
      hotPressure: 34.2,
      adjustedPressure: 30.0,
      temperature: 70,
    })

    expect(updated.id).toBe(initial.id)
    expect(updated.coldPressure).toBe(26.0) // Retains previous cold pressure
    expect(updated.hotPressure).toBe(34.2)
    expect(store.readings.FR?.hotPressure).toBe(34.2)

    const count = await testDb.tyreReadings.where('sessionId').equals(sampleSessionId).count()
    expect(count).toBe(1)

    const syncRecords = await testDb.syncQueue.toArray()
    expect(syncRecords).toHaveLength(2)
    expect(syncRecords[1].operation).toBe('UPDATE')
  })

  it('batch-saves all four corners for a session and verifies allCornersLogged', async () => {
    const store = useTyreReadingStore(testDb)

    await store.batchSaveReadings(sampleSessionId, {
      FL: { coldPressure: 26.0, hotPressure: 34.0, targetPressure: 30.0, adjustedPressure: 30.0, temperature: 68 },
      FR: { coldPressure: 26.0, hotPressure: 34.5, targetPressure: 30.0, adjustedPressure: 30.0, temperature: 72 },
      RL: { coldPressure: 25.0, hotPressure: 31.0, targetPressure: 28.0, adjustedPressure: 28.0, temperature: 62 },
      RR: { coldPressure: 25.0, hotPressure: 31.5, targetPressure: 28.0, adjustedPressure: 28.0, temperature: 64 },
    })

    expect(store.allCornersLogged).toBe(true)
    expect(store.readings.FL?.hotPressure).toBe(34.0)
    expect(store.readings.FR?.hotPressure).toBe(34.5)
    expect(store.readings.RL?.hotPressure).toBe(31.0)
    expect(store.readings.RR?.hotPressure).toBe(31.5)

    const dbReadings = await testDb.tyreReadings.where('sessionId').equals(sampleSessionId).toArray()
    expect(dbReadings).toHaveLength(4)

    const syncRecords = await testDb.syncQueue.toArray()
    expect(syncRecords).toHaveLength(4)
  })

  it('fetches existing tyre readings for a session and populates reactive state', async () => {
    const store = useTyreReadingStore(testDb)

    // Pre-insert via batch
    await store.batchSaveReadings(sampleSessionId, {
      FL: { coldPressure: 25.5, targetPressure: 29.5 },
      FR: { coldPressure: 25.5, targetPressure: 29.5 },
    })

    // Reset store state
    const freshStore = useTyreReadingStore(testDb)
    await freshStore.fetchReadingsForSession(sampleSessionId)

    expect(freshStore.readings.FL?.targetPressure).toBe(29.5)
    expect(freshStore.readings.FR?.targetPressure).toBe(29.5)
    expect(freshStore.readings.RL).toBeNull()
    expect(freshStore.readings.RR).toBeNull()
    expect(freshStore.allCornersLogged).toBe(false)
  })
})
