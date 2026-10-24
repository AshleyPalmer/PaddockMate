import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { PaddockMateDB } from "../db/paddockMateDb";
import { useVehicleStore } from "./vehicleStore";

describe("useVehicleStore", () => {
  let testDb: PaddockMateDB;

  beforeEach(async () => {
    setActivePinia(createPinia());
    const testDbName = `VehicleStoreTest-${Date.now()}-${Math.random()}`;
    testDb = new PaddockMateDB(testDbName);
    await testDb.open();
  });

  it("initialises with an empty vehicle list and null active vehicle", async () => {
    const store = useVehicleStore(testDb);
    await store.fetchVehicles();
    expect(store.vehicles).toEqual([]);
    expect(store.activeVehicle).toBeNull();
    expect(store.activeVehicleId).toBeNull();
  });

  it("creates a vehicle, persists to IndexedDB, registers syncQueue item, and sets as active", async () => {
    const store = useVehicleStore(testDb);

    const vehicle = await store.createVehicle({
      make: "Porsche",
      model: "Cayman GT4",
      year: 2021,
      nickname: "Track Cayman",
      defaultColdPressureFl: 26.0,
      defaultColdPressureFr: 26.0,
      defaultColdPressureRl: 25.0,
      defaultColdPressureRr: 25.0,
      defaultTargetPressureFl: 30.0,
      defaultTargetPressureFr: 30.0,
      defaultTargetPressureRl: 28.0,
      defaultTargetPressureRr: 28.0,
    });

    expect(vehicle.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(vehicle.syncStatus).toBe("pending");
    expect(store.vehicles).toHaveLength(1);
    expect(store.activeVehicleId).toBe(vehicle.id);
    expect(store.activeVehicle?.make).toBe("Porsche");

    // Verify IndexedDB table
    const storedVehicle = await testDb.vehicles.get(vehicle.id);
    expect(storedVehicle).toBeDefined();
    expect(storedVehicle?.model).toBe("Cayman GT4");

    // Verify syncQueue entry
    const syncItems = await testDb.syncQueue.toArray();
    expect(syncItems).toHaveLength(1);
    expect(syncItems[0].entityType).toBe("vehicle");
    expect(syncItems[0].entityId).toBe(vehicle.id);
    expect(syncItems[0].operation).toBe("INSERT");
  });

  it("updates an existing vehicle and appends update to syncQueue", async () => {
    const store = useVehicleStore(testDb);

    const vehicle = await store.createVehicle({
      make: "BMW",
      model: "M3",
      year: 2004,
    });

    await store.updateVehicle(vehicle.id, {
      nickname: "E46 Track Car",
      defaultTargetPressureFl: 31.0,
    });

    expect(store.activeVehicle?.nickname).toBe("E46 Track Car");
    expect(store.activeVehicle?.defaultTargetPressureFl).toBe(31.0);

    const storedVehicle = await testDb.vehicles.get(vehicle.id);
    expect(storedVehicle?.nickname).toBe("E46 Track Car");

    const syncItems = await testDb.syncQueue.toArray();
    expect(syncItems).toHaveLength(2);
    expect(syncItems[1].operation).toBe("UPDATE");
  });

  it("deletes a vehicle and resets active vehicle if matching", async () => {
    const store = useVehicleStore(testDb);

    const vehicle = await store.createVehicle({
      make: "Caterham",
      model: "Seven 310R",
    });

    expect(store.activeVehicleId).toBe(vehicle.id);

    await store.deleteVehicle(vehicle.id);

    expect(store.vehicles).toHaveLength(0);
    expect(store.activeVehicleId).toBeNull();
    expect(store.activeVehicle).toBeNull();

    const storedVehicle = await testDb.vehicles.get(vehicle.id);
    expect(storedVehicle).toBeUndefined();

    const syncItems = await testDb.syncQueue.toArray();
    expect(syncItems[syncItems.length - 1].operation).toBe("DELETE");
    expect(syncItems[syncItems.length - 1].entityId).toBe(vehicle.id);
  });

  it("allows switching active vehicle", async () => {
    const store = useVehicleStore(testDb);

    const car1 = await store.createVehicle({ make: "Honda", model: "Civic Type R" });
    const car2 = await store.createVehicle({ make: "Lotus", model: "Exige" });

    store.setActiveVehicle(car1.id);
    expect(store.activeVehicleId).toBe(car1.id);
    expect(store.activeVehicle?.model).toBe("Civic Type R");

    store.setActiveVehicle(car2.id);
    expect(store.activeVehicleId).toBe(car2.id);
    expect(store.activeVehicle?.make).toBe("Lotus");
    expect(store.activeVehicle?.model).toBe("Exige");
  });
});
