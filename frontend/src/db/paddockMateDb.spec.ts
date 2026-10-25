import { beforeEach, describe, expect, it } from "vitest";
import { PaddockMateDB, seedUkTracksIfEmpty } from "./paddockMateDb";

describe("PaddockMateDB and UK Track Seeding", () => {
  let db: PaddockMateDB;

  beforeEach(async () => {
    // Unique database name per test to isolate IndexedDB storage
    const testDbName = `PaddockMateDB-test-${Date.now()}-${Math.random()}`;
    db = new PaddockMateDB(testDbName);
    await db.open();
  });

  it("initialises database with required tables", () => {
    expect(db.name).toContain("PaddockMateDB-test");
    expect(db.vehicles).toBeDefined();
    expect(db.tracks).toBeDefined();
    expect(db.layouts).toBeDefined();
    expect(db.trackDays).toBeDefined();
    expect(db.sessions).toBeDefined();
    expect(db.tyreReadings).toBeDefined();
    expect(db.syncQueue).toBeDefined();
  });

  it("pre-seeds UK tracks and layouts when empty", async () => {
    await seedUkTracksIfEmpty(db);

    const tracks = await db.tracks.toArray();
    const layouts = await db.layouts.toArray();

    expect(tracks.length).toBeGreaterThanOrEqual(13);
    const trackNames = tracks.map((t) => t.name);
    expect(trackNames).toContain("Anglesey Circuit");
    expect(trackNames).toContain("Bedford Autodrome");
    expect(trackNames).toContain("Brands Hatch");
    expect(trackNames).toContain("Cadwell Park");
    expect(trackNames).toContain("Castle Combe");
    expect(trackNames).toContain("Croft");
    expect(trackNames).toContain("Donington Park");
    expect(trackNames).toContain("Goodwood");
    expect(trackNames).toContain("Knockhill");
    expect(trackNames).toContain("Oulton Park");
    expect(trackNames).toContain("Silverstone");
    expect(trackNames).toContain("Snetterton");
    expect(trackNames).toContain("Thruxton");

    for (const track of tracks) {
      expect(track.country).toBe("United Kingdom");
      expect(track.isCustom).toBe(false);
    }

    // Verify Brands Hatch layouts
    const brandsHatch = tracks.find((t) => t.name === "Brands Hatch")!;
    const brandsLayouts = await db.layouts.where("trackId").equals(brandsHatch.id).toArray();
    const brandsLayoutNames = brandsLayouts.map((l) => l.name);
    expect(brandsLayoutNames).toContain("Grand Prix");
    expect(brandsLayoutNames).toContain("Indy");

    // Verify Silverstone layouts
    const silverstone = tracks.find((t) => t.name === "Silverstone")!;
    const silverstoneLayouts = await db.layouts.where("trackId").equals(silverstone.id).toArray();
    const silverstoneLayoutNames = silverstoneLayouts.map((l) => l.name);
    expect(silverstoneLayoutNames).toContain("Grand Prix");
    expect(silverstoneLayoutNames).toContain("National");
    expect(silverstoneLayoutNames).toContain("International");

    expect(layouts.length).toBeGreaterThanOrEqual(15);
  });

  it("is idempotent and does not duplicate tracks if already populated", async () => {
    await seedUkTracksIfEmpty(db);
    const initialTrackCount = await db.tracks.count();
    const initialLayoutCount = await db.layouts.count();

    // Run seeding again
    await seedUkTracksIfEmpty(db);

    expect(await db.tracks.count()).toBe(initialTrackCount);
    expect(await db.layouts.count()).toBe(initialLayoutCount);
  });

  it("persists and retrieves a vehicle entity with drivetrain, tyre specs, and pressure unit", async () => {
    const vehicleId = "11111111-2222-7333-8444-555555555555";
    const now = new Date().toISOString();

    await db.vehicles.add({
      id: vehicleId,
      make: "Porsche",
      model: "911 GT3",
      year: 2022,
      nickname: "GT3 Track",
      drivetrain: "RWD",
      tyreModel: "Michelin Pilot Sport Cup 2 R",
      frontTyreSize: "255/35 R20",
      rearTyreSize: "315/30 R21",
      suspension: "Adaptive Sport",
      pressureUnit: "BAR",
      defaultColdPressureFl: 1.8,
      defaultColdPressureFr: 1.8,
      defaultColdPressureRl: 1.9,
      defaultColdPressureRr: 1.9,
      createdAt: now,
      updatedAt: now,
      syncStatus: "synced",
    });

    const retrieved = await db.vehicles.get(vehicleId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.drivetrain).toBe("RWD");
    expect(retrieved?.tyreModel).toBe("Michelin Pilot Sport Cup 2 R");
    expect(retrieved?.frontTyreSize).toBe("255/35 R20");
    expect(retrieved?.rearTyreSize).toBe("315/30 R21");
    expect(retrieved?.suspension).toBe("Adaptive Sport");
    expect(retrieved?.pressureUnit).toBe("BAR");
  });
});
