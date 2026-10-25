import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import SessionTyreView from "./SessionTyreView.vue";
import { PaddockMateDB } from "../db/paddockMateDb";
import { useTyreReadingStore } from "../stores/tyreReadingStore";
import { useThemeStore } from "../stores/themeStore";

describe("SessionTyreView", () => {
  let testDb: PaddockMateDB;
  let router: ReturnType<typeof createRouter>;
  const sampleTrackDayId = "018f0000-0000-7000-8000-000000000001";
  const sampleSessionId = "018f0000-0000-7000-8000-000000000002";
  const sampleVehicleId = "018f0000-0000-7000-8000-000000000003";

  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");

    const testDbName = `SessionTyreViewTest-${Date.now()}-${Math.random()}`;
    testDb = new PaddockMateDB(testDbName);
    await testDb.open();

    // Seed test track day & session & vehicle
    await testDb.vehicles.add({
      id: sampleVehicleId,
      make: "Porsche",
      model: "911 GT3",
      year: 2023,
      nickname: "Track Weapon",
      pressureUnit: "PSI",
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await testDb.trackDays.add({
      id: sampleTrackDayId,
      vehicleId: sampleVehicleId,
      trackId: "brands-hatch",
      layoutId: "brands-hatch-indy",
      date: "2026-10-25",
      ambientTemperature: 18,
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await testDb.sessions.add({
      id: sampleSessionId,
      trackDayId: sampleTrackDayId,
      sessionNumber: 1,
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed initial readings
    await testDb.tyreReadings.bulkAdd([
      {
        id: "tr-fl",
        sessionId: sampleSessionId,
        corner: "FL",
        coldPressure: 26.0,
        hotPressure: 33.5,
        targetPressure: 30.0,
        temperature: 68,
        syncStatus: "synced",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tr-fr",
        sessionId: sampleSessionId,
        corner: "FR",
        coldPressure: 26.0,
        hotPressure: 34.5,
        targetPressure: 30.0,
        temperature: 74,
        syncStatus: "synced",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tr-rl",
        sessionId: sampleSessionId,
        corner: "RL",
        coldPressure: 25.0,
        hotPressure: 27.0,
        targetPressure: 28.0,
        temperature: 58,
        syncStatus: "synced",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tr-rr",
        sessionId: sampleSessionId,
        corner: "RR",
        coldPressure: 25.0,
        hotPressure: 28.0,
        targetPressure: 28.0,
        temperature: 64,
        syncStatus: "synced",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/vehicles",
          name: "vehicles",
          component: { template: "<div>Vehicles</div>" },
        },
        {
          path: "/track-days/:id/session/:sessionNumber",
          name: "session-tyres",
          component: SessionTyreView,
        },
      ],
    });

    await router.push(`/track-days/${sampleTrackDayId}/session/1`);
    await router.isReady();
  });

  function createWrapper() {
    return mount(SessionTyreView, {
      global: {
        plugins: [router],
        provide: {
          db: testDb,
        },
      },
    });
  }

  it("renders pit-lane tyre pressure logger with 4 corner cards and silhouette", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="session-tyre-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="corner-card-FL"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="corner-card-FR"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="corner-card-RL"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="corner-card-RR"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chassis-silhouette"]').exists()).toBe(true);
  });

  it("populates corner cards with live data from tyreReadingStore", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    // FL: hot 33.5, target 30.0 -> bleed 3.5
    const flCard = wrapper.find('[data-testid="corner-card-FL"]');
    expect(flCard.text()).toContain("FL");
    expect(flCard.text()).toContain("33.5");
    expect(flCard.text()).toContain("68°C");
    expect(flCard.text()).toContain("BLEED 3.5");

    // RL: hot 27.0, target 28.0 -> inflate 1.0
    const rlCard = wrapper.find('[data-testid="corner-card-RL"]');
    expect(rlCard.text()).toContain("RL");
    expect(rlCard.text()).toContain("27.0");
    expect(rlCard.text()).toContain("INFLATE 1.0");

    // RR: hot 28.0, target 28.0 -> on target
    const rrCard = wrapper.find('[data-testid="corner-card-RR"]');
    expect(rrCard.text()).toContain("RR");
    expect(rrCard.text()).toContain("28.0");
    expect(rrCard.text()).toContain("ON TARGET");
  });

  it("allows switching active corner and updates the control panel", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    // Initially FL is active
    expect(wrapper.find('[data-testid="active-corner-title"]').text()).toContain("Front Left");
    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("33.5");

    // Click FR
    await wrapper.find('[data-testid="corner-card-FR"]').trigger("click");
    expect(wrapper.find('[data-testid="active-corner-title"]').text()).toContain("Front Right");
    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("34.5");
  });

  it("adjusts hot pressure using coarse steppers and persists to store", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const tyreStore = useTyreReadingStore(testDb);

    // Initial FL is 33.5. Click -1.0
    const btnMinus1 = wrapper.find('[data-testid="btn-hot-minus-1"]');
    await btnMinus1.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("32.5");
    expect(tyreStore.readings.FL?.hotPressure).toBe(32.5);

    // Click +0.5
    const btnPlus05 = wrapper.find('[data-testid="btn-hot-plus-05"]');
    await btnPlus05.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("33.0");
    expect(tyreStore.readings.FL?.hotPressure).toBe(33.0);
  });

  it("adjusts hot pressure using fine steppers", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const tyreStore = useTyreReadingStore(testDb);

    const btnFineInc = wrapper.find('[data-testid="btn-hot-fine-inc"]');
    await btnFineInc.trigger("pointerdown");
    await btnFineInc.trigger("pointerup");
    await new Promise((r) => setTimeout(r, 60));

    // 33.5 + 0.1 = 33.6
    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("33.6");
    expect(tyreStore.readings.FL?.hotPressure).toBe(33.6);
  });

  it("sets hot pressure to target pressure with 1-tap match button", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const tyreStore = useTyreReadingStore(testDb);

    // FL target is 30.0. Current hot is 33.5.
    const btnSetTarget = wrapper.find('[data-testid="btn-set-to-target"]');
    expect(btnSetTarget.text()).toContain("30.0");

    await btnSetTarget.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("30.0");
    expect(tyreStore.readings.FL?.hotPressure).toBe(30.0);
    expect(wrapper.find('[data-testid="active-bleed-status"]').text()).toContain("ON TARGET");
  });

  it("adjusts target hot pressure and tyre temperature", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const tyreStore = useTyreReadingStore(testDb);

    // Adjust target pressure +
    const btnTargetInc = wrapper.find('[data-testid="btn-target-inc"]');
    await btnTargetInc.trigger("pointerdown");
    await btnTargetInc.trigger("pointerup");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="target-pressure-readout"]').text()).toContain("30.1");
    expect(tyreStore.readings.FL?.targetPressure).toBe(30.1);

    // Adjust temperature +
    const btnTempInc = wrapper.find('[data-testid="btn-temp-inc"]');
    await btnTempInc.trigger("pointerdown");
    await btnTempInc.trigger("pointerup");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="temp-readout"]').text()).toContain("69°C");
    expect(tyreStore.readings.FL?.temperature).toBe(69);
  });

  it("clamps hot pressure and target pressure between 10.0 and 50.0 PSI bounds", async () => {
    // Seed initial reading near 50.0 PSI for corner RR
    await testDb.tyreReadings.where("[sessionId+corner]").equals([sampleSessionId, "RR"]).modify({
      hotPressure: 49.5,
      targetPressure: 49.5,
    });

    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    // Select RR
    await wrapper.find('[data-testid="corner-card-RR"]').trigger("click");
    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("49.5");

    // Click +1.0 coarse button -> should clamp to 50.0, not 50.5
    const btnPlus1 = wrapper.find('[data-testid="btn-hot-plus-1"]');
    await btnPlus1.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="hot-pressure-readout"]').text()).toContain("50.0");

    // Increase target pressure past 50.0 -> should clamp at 50.0
    const btnTargetInc = wrapper.find('[data-testid="btn-target-inc"]');
    for (let i = 0; i < 6; i++) {
      await btnTargetInc.trigger("pointerdown");
      await btnTargetInc.trigger("pointerup");
    }
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.find('[data-testid="target-pressure-readout"]').text()).toContain("50.0");
  });

  it("displays summary badge counts across all corners", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    // FL (bleed 3.5), FR (bleed 4.5), RL (inflate 1.0), RR (on target 0.0)
    // bleed: 2, inflate: 1, done: 1
    const summary = wrapper.find('[data-testid="tyre-status-summary"]');
    expect(summary.text()).toContain("2 TO BLEED");
    expect(summary.text()).toContain("1 TO INFLATE");
    expect(summary.text()).toContain("1 DONE");
  });

  it("ensures all stepper and action buttons have minimum 48px touch targets", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const btnMinus1 = wrapper.find('[data-testid="btn-hot-minus-1"]');
    expect(
      btnMinus1
        .classes()
        .some((c) => c.includes("min-h-[48px]") || c.includes("h-12") || c.includes("h-14"))
    ).toBe(true);

    const btnSetTarget = wrapper.find('[data-testid="btn-set-to-target"]');
    expect(
      btnSetTarget
        .classes()
        .some((c) => c.includes("min-h-[48px]") || c.includes("h-12") || c.includes("h-14"))
    ).toBe(true);
  });

  it("navigates to garage when clicking Garage button", async () => {
    const pushSpy = vi.spyOn(router, "push");
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const garageBtn = wrapper.find('[data-testid="btn-nav-garage"]');
    expect(garageBtn.exists()).toBe(true);
    await garageBtn.trigger("click");

    expect(pushSpy).toHaveBeenCalledWith("/vehicles");
  });

  it("adapts styling dynamically when theme store changes to sunlight mode", async () => {
    const wrapper = createWrapper();
    await new Promise((r) => setTimeout(r, 60));

    const themeStore = useThemeStore();
    expect(themeStore.isDark).toBe(true);

    // Initial dark badge for FL (bleed)
    expect(wrapper.find('[data-testid="active-bleed-status"]').classes()).toContain(
      "bg-amber-500/20"
    );

    // Toggle to sunlight
    themeStore.toggleTheme();
    await flushPromises();

    // In sunlight mode, bleed badge switches to sunlight styling (bg-yellow-300)
    expect(wrapper.find('[data-testid="active-bleed-status"]').classes()).toContain(
      "bg-yellow-300"
    );
  });
});
