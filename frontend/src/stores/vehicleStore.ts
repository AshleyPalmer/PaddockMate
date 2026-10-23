import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { db, type PaddockMateDB, type VehicleEntity } from '../db/paddockMateDb'
import { generateUuid } from '../utils/uuid'

export type CreateVehicleInput = Omit<VehicleEntity, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>
export type UpdateVehicleInput = Partial<Omit<VehicleEntity, 'id' | 'createdAt'>>

export const useBaseVehicleStore = defineStore('vehicle', () => {
  const database = shallowRef<PaddockMateDB>(db)
  const vehicles = ref<VehicleEntity[]>([])
  const activeVehicleId = ref<string | null>(null)

  const activeVehicle = computed<VehicleEntity | null>(() => {
    if (!activeVehicleId.value) return null
    return vehicles.value.find((v) => v.id === activeVehicleId.value) ?? null
  })

  function setDatabase(customDb: PaddockMateDB): void {
    database.value = customDb
  }

  async function fetchVehicles(): Promise<VehicleEntity[]> {
    const list = await database.value.vehicles.orderBy('createdAt').toArray()
    vehicles.value = list
    if (activeVehicleId.value && !list.some((v) => v.id === activeVehicleId.value)) {
      activeVehicleId.value = null
    }
    return list
  }

  async function createVehicle(input: CreateVehicleInput): Promise<VehicleEntity> {
    const now = new Date().toISOString()
    const id = generateUuid()
    const vehicle: VehicleEntity = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    }

    await database.value.transaction('rw', [database.value.vehicles, database.value.syncQueue], async () => {
      await database.value.vehicles.add(vehicle)
      await database.value.syncQueue.add({
        entityType: 'vehicle',
        entityId: id,
        operation: 'INSERT',
        payload: JSON.stringify(vehicle),
        timestamp: Date.now(),
        retryCount: 0,
      })
    })

    vehicles.value.push(vehicle)
    if (!activeVehicleId.value) {
      activeVehicleId.value = id
    }
    return vehicle
  }

  async function updateVehicle(id: string, updates: UpdateVehicleInput): Promise<VehicleEntity | null> {
    const existing = await database.value.vehicles.get(id)
    if (!existing) {
      return null
    }

    const now = new Date().toISOString()
    const updated: VehicleEntity = {
      ...existing,
      ...updates,
      updatedAt: now,
      syncStatus: 'pending',
    }

    await database.value.transaction('rw', [database.value.vehicles, database.value.syncQueue], async () => {
      await database.value.vehicles.put(updated)
      await database.value.syncQueue.add({
        entityType: 'vehicle',
        entityId: id,
        operation: 'UPDATE',
        payload: JSON.stringify(updated),
        timestamp: Date.now(),
        retryCount: 0,
      })
    })

    const index = vehicles.value.findIndex((v) => v.id === id)
    if (index !== -1) {
      vehicles.value[index] = updated
    }
    return updated
  }

  async function deleteVehicle(id: string): Promise<void> {
    await database.value.transaction('rw', [database.value.vehicles, database.value.syncQueue], async () => {
      await database.value.vehicles.delete(id)
      await database.value.syncQueue.add({
        entityType: 'vehicle',
        entityId: id,
        operation: 'DELETE',
        payload: JSON.stringify({ id }),
        timestamp: Date.now(),
        retryCount: 0,
      })
    })

    vehicles.value = vehicles.value.filter((v) => v.id !== id)
    if (activeVehicleId.value === id) {
      activeVehicleId.value = null
    }
  }

  function setActiveVehicle(id: string | null): void {
    activeVehicleId.value = id
  }

  return {
    vehicles,
    activeVehicleId,
    activeVehicle,
    setDatabase,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    setActiveVehicle,
  }
})

export function useVehicleStore(customDb?: PaddockMateDB) {
  const store = useBaseVehicleStore()
  if (customDb) {
    store.setDatabase(customDb)
  }
  return store
}
