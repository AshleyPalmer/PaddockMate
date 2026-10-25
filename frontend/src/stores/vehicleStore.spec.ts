// cspell:words Öhlins Pirelli Trofeo
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

  it("creates a vehicle with full drivetrain, tyre specs, and pressure unit", async () => {
    const store = useVehicleStore(testDb);
    const vehicle = await store.createVehicle({
      make: "BMW",
      model: "330i",
      year: 2007,
      nickname: "330i · Track",
      drivetrain: "RWD",
      tyreModel: "Michelin Pilot Sport 5",
      frontTyreSize: "225/40 R18",
      rearTyreSize: "255/35 R18",
      suspension: "Öhlins Road & Track",
      pressureUnit: "PSI",
      defaultColdPressureFl: 28.0,
      defaultColdPressureFr: 28.0,
      defaultColdPressureRl: 27.0,
      defaultColdPressureRr: 27.0,
      defaultTargetPressureFl: 32.0,
      defaultTargetPressureFr: 32.0,
      defaultTargetPressureRl: 31.0,
      defaultTargetPressureRr: 31.0,
    });

    expect(vehicle.drivetrain).toBe("RWD");
    expect(vehicle.tyreModel).toBe("Michelin Pilot Sport 5");
    expect(vehicle.frontTyreSize).toBe("225/40 R18");
    expect(vehicle.rearTyreSize).toBe("255/35 R18");
    expect(vehicle.suspension).toBe("Öhlins Road & Track");
    expect(vehicle.pressureUnit).toBe("PSI");

    const stored = await testDb.vehicles.get(vehicle.id);
    expect(stored?.drivetrain).toBe("RWD");
    expect(stored?.tyreModel).toBe("Michelin Pilot Sport 5");
    expect(stored?.frontTyreSize).toBe("225/40 R18");
    expect(stored?.rearTyreSize).toBe("255/35 R18");
    expect(stored?.suspension).toBe("Öhlins Road & Track");
    expect(stored?.pressureUnit).toBe("PSI");
  });

  it("updates vehicle drivetrain, tyre specifications, and pressure unit", async () => {
    const store = useVehicleStore(testDb);
    const vehicle = await store.createVehicle({
      make: "Ford",
      model: "Focus RS",
      year: 2018,
    });

    await store.updateVehicle(vehicle.id, {
      drivetrain: "AWD",
      tyreModel: "Pirelli Trofeo R",
      frontTyreSize: "235/35 R19",
      rearTyreSize: "235/35 R19",
      pressureUnit: "BAR",
    });

    const updated = await testDb.vehicles.get(vehicle.id);
    expect(updated?.drivetrain).toBe("AWD");
    expect(updated?.tyreModel).toBe("Pirelli Trofeo R");
    expect(updated?.frontTyreSize).toBe("235/35 R19");
    expect(updated?.rearTyreSize).toBe("235/35 R19");
    expect(updated?.pressureUnit).toBe("BAR");
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
