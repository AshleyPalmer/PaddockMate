import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { PaddockMateDB } from '../db/paddockMateDb'
import { useTrackStore } from './trackStore'

describe('useTrackStore', () => {
  let testDb: PaddockMateDB

  beforeEach(async () => {
    setActivePinia(createPinia())
    const testDbName = `TrackStoreTest-${Date.now()}-${Math.random()}`
    testDb = new PaddockMateDB(testDbName)
    await testDb.open()
  })

  it('fetches tracks and automatically initialises pre-seeded UK catalog', async () => {
    const store = useTrackStore(testDb)
    await store.fetchTracks()

    expect(store.tracks.length).toBe(7)
    const trackNames = store.tracks.map((t) => t.name)
    expect(trackNames).toContain('Brands Hatch')
    expect(trackNames).toContain('Silverstone')
  })

  it('fetches layouts for all tracks or a specific track', async () => {
    const store = useTrackStore(testDb)
    await store.fetchTracks()
    await store.fetchLayouts()

    expect(store.layouts.length).toBeGreaterThanOrEqual(15)

    const brandsHatch = store.tracks.find((t) => t.name === 'Brands Hatch')!
    const brandsLayouts = store.getLayoutsForTrack(brandsHatch.id)
    expect(brandsLayouts.map((l) => l.name)).toEqual(expect.arrayContaining(['Indy', 'Grand Prix']))
  })

  it('adds a custom track and persists it to IndexedDB', async () => {
    const store = useTrackStore(testDb)
    await store.fetchTracks()

    const customTrack = await store.addTrack({
      name: 'Anglesey Circuit',
      country: 'United Kingdom',
    })

    expect(customTrack.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(customTrack.isCustom).toBe(true)
    expect(customTrack.name).toBe('Anglesey Circuit')

    // Verify presence in store
    expect(store.tracks.some((t) => t.id === customTrack.id)).toBe(true)

    // Verify persistence in IndexedDB
    const dbTrack = await testDb.tracks.get(customTrack.id)
    expect(dbTrack).toBeDefined()
    expect(dbTrack?.name).toBe('Anglesey Circuit')
  })

  it('adds a custom layout to a track and persists it to IndexedDB', async () => {
    const store = useTrackStore(testDb)
    await store.fetchTracks()

    const cadwell = store.tracks.find((t) => t.name === 'Cadwell Park')!
    const customLayout = await store.addLayout({
      trackId: cadwell.id,
      name: 'Club Circuit',
      lengthMetres: 2376,
    })

    expect(customLayout.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(customLayout.isCustom).toBe(true)
    expect(customLayout.trackId).toBe(cadwell.id)
    expect(customLayout.name).toBe('Club Circuit')
    expect(customLayout.lengthMetres).toBe(2376)

    const cadwellLayouts = store.getLayoutsForTrack(cadwell.id)
    expect(cadwellLayouts.some((l) => l.id === customLayout.id)).toBe(true)

    const dbLayout = await testDb.layouts.get(customLayout.id)
    expect(dbLayout?.name).toBe('Club Circuit')
  })
})
