import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { db, type PaddockMateDB, type TyreReadingEntity } from '../db/paddockMateDb'
import { generateUuid } from '../utils/uuid'

export type TyreReadingCorner = 'FL' | 'FR' | 'RL' | 'RR'

export interface SaveTyreReadingInput {
  sessionId: string
  corner: TyreReadingCorner
  coldPressure?: number
  hotPressure?: number
  targetPressure?: number
  adjustedPressure?: number
  temperature?: number
}

export type BatchTyreReadingInput = Partial<
  Record<TyreReadingCorner, Partial<Omit<SaveTyreReadingInput, 'sessionId' | 'corner'>>>
>

export const useBaseTyreReadingStore = defineStore('tyreReading', () => {
  const database = shallowRef<PaddockMateDB>(db)
  const currentSessionId = ref<string | null>(null)
  const readings = ref<Record<TyreReadingCorner, TyreReadingEntity | null>>({
    FL: null,
    FR: null,
    RL: null,
    RR: null,
  })

  const allCornersLogged = computed<boolean>(() => {
    const corners: TyreReadingCorner[] = ['FL', 'FR', 'RL', 'RR']
    return corners.every((c) => readings.value[c] !== null)
  })

  function setDatabase(customDb: PaddockMateDB): void {
    database.value = customDb
  }

  async function fetchReadingsForSession(
    sessionId: string
  ): Promise<Record<TyreReadingCorner, TyreReadingEntity | null>> {
    currentSessionId.value = sessionId
    const list = await database.value.tyreReadings.where('sessionId').equals(sessionId).toArray()

    const newMap: Record<TyreReadingCorner, TyreReadingEntity | null> = {
      FL: null,
      FR: null,
      RL: null,
      RR: null,
    }

    for (const item of list) {
      newMap[item.corner] = item
    }

    readings.value = newMap
    return newMap
  }

  async function saveReading(input: SaveTyreReadingInput): Promise<TyreReadingEntity> {
    if (currentSessionId.value !== input.sessionId) {
      await fetchReadingsForSession(input.sessionId)
    }

    const now = new Date().toISOString()
    const existing = await database.value.tyreReadings
      .where('[sessionId+corner]')
      .equals([input.sessionId, input.corner])
      .first()

    let resultEntity: TyreReadingEntity

    if (existing) {
      resultEntity = {
        ...existing,
        ...input,
        updatedAt: now,
        syncStatus: 'pending',
      }

      await database.value.transaction('rw', [database.value.tyreReadings, database.value.syncQueue], async () => {
        await database.value.tyreReadings.put(resultEntity)
        await database.value.syncQueue.add({
          entityType: 'tyre_reading',
          entityId: resultEntity.id,
          operation: 'UPDATE',
          payload: JSON.stringify(resultEntity),
          timestamp: Date.now(),
          retryCount: 0,
        })
      })
    } else {
      resultEntity = {
        ...input,
        id: generateUuid(),
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      }

      await database.value.transaction('rw', [database.value.tyreReadings, database.value.syncQueue], async () => {
        await database.value.tyreReadings.add(resultEntity)
        await database.value.syncQueue.add({
          entityType: 'tyre_reading',
          entityId: resultEntity.id,
          operation: 'INSERT',
          payload: JSON.stringify(resultEntity),
          timestamp: Date.now(),
          retryCount: 0,
        })
      })
    }

    if (currentSessionId.value === input.sessionId || !currentSessionId.value) {
      currentSessionId.value = input.sessionId
      readings.value[input.corner] = resultEntity
    }

    return resultEntity
  }

  async function batchSaveReadings(
    sessionId: string,
    cornerInputs: BatchTyreReadingInput
  ): Promise<Record<TyreReadingCorner, TyreReadingEntity | null>> {
    if (currentSessionId.value !== sessionId) {
      await fetchReadingsForSession(sessionId)
    }

    const now = new Date().toISOString()
    const corners: TyreReadingCorner[] = ['FL', 'FR', 'RL', 'RR']

    await database.value.transaction('rw', [database.value.tyreReadings, database.value.syncQueue], async () => {
      const existingList = await database.value.tyreReadings
        .where('sessionId')
        .equals(sessionId)
        .toArray()

      const existingMap = new Map<TyreReadingCorner, TyreReadingEntity>()
      for (const item of existingList) {
        existingMap.set(item.corner, item)
      }

      for (const corner of corners) {
        const cornerData = cornerInputs[corner]
        if (!cornerData) continue

        const existing = existingMap.get(corner)
        if (existing) {
          const updated: TyreReadingEntity = {
            ...existing,
            ...cornerData,
            updatedAt: now,
            syncStatus: 'pending',
          }
          await database.value.tyreReadings.put(updated)
          await database.value.syncQueue.add({
            entityType: 'tyre_reading',
            entityId: updated.id,
            operation: 'UPDATE',
            payload: JSON.stringify(updated),
            timestamp: Date.now(),
            retryCount: 0,
          })
          readings.value[corner] = updated
        } else {
          const created: TyreReadingEntity = {
            ...cornerData,
            sessionId,
            corner,
            id: generateUuid(),
            createdAt: now,
            updatedAt: now,
            syncStatus: 'pending',
          }
          await database.value.tyreReadings.add(created)
          await database.value.syncQueue.add({
            entityType: 'tyre_reading',
            entityId: created.id,
            operation: 'INSERT',
            payload: JSON.stringify(created),
            timestamp: Date.now(),
            retryCount: 0,
          })
          readings.value[corner] = created
        }
      }
    })

    currentSessionId.value = sessionId
    return readings.value
  }

  return {
    currentSessionId,
    readings,
    allCornersLogged,
    setDatabase,
    fetchReadingsForSession,
    saveReading,
    batchSaveReadings,
  }
})

export function useTyreReadingStore(customDb?: PaddockMateDB) {
  const store = useBaseTyreReadingStore()
  if (customDb) {
    store.setDatabase(customDb)
  }
  return store
}
