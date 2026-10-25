import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import "fake-indexeddb/auto";
import TrackDaySetupView from "./TrackDaySetupView.vue";
import { PaddockMateDB } from "../db/paddockMateDb";
import PmStepper from "../components/ui/PmStepper.vue";
import { useTrackDayStore } from "../stores/trackDayStore";
import { useTrackStore } from "../stores/trackStore";
import { useTyreReadingStore } from "../stores/tyreReadingStore";
import { useVehicleStore } from "../stores/vehicleStore";

describe("TrackDaySetupView", () => {
  let testDb: PaddockMateDB;
  let router: ReturnType<typeof createRouter>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    testDb = new PaddockMateDB("test_track_day_setup_" + Date.now() + "_" + Math.random());
    await testDb.open();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/vehicles", name: "vehicles", component: { template: "<div>Vehicles</div>" } },
        {
          path: "/track-days/new",
          name: "track-day-setup",
          component: TrackDaySetupView,
        },
        {
          path: "/track-days/:id/session/:sessionNumber",
          name: "session-tyres",
          component: { template: "<div>Session Tyres</div>" },
        },
      ],
    });
    await router.push("/track-days/new");

    const vehicleStore = useVehicleStore(testDb);
    await vehicleStore.createVehicle({
      make: "BMW",
      model: "330i",
      nickname: "Track E46",
      defaultColdPressureFl: 28.0,
      defaultColdPressureFr: 28.0,
      defaultColdPressureRl: 27.0,
      defaultColdPressureRr: 27.0,
      defaultTargetPressureFl: 32.0,
      defaultTargetPressureFr: 32.0,
      defaultTargetPressureRl: 31.0,
      defaultTargetPressureRr: 31.0,
    });

    const trackStore = useTrackStore(testDb);
    await trackStore.fetchTracks();
    await trackStore.fetchLayouts();
  });

  it("renders wizard steps and initialises Track Day with Session 1", async () => {
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));
    expect(wrapper.text()).toContain("READY FOR THE OUT LAP");
  });

  it("pre-populates 4 cold start and 2 axle target pressures from active vehicle", async () => {
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    // Vehicle information banner
    expect(wrapper.text()).toContain("Track E46");
    expect(wrapper.text()).toContain("BMW 330i");

    // Cold start steppers
    expect(wrapper.find('[data-testid="stepper-cold-fl"]').text()).toContain("28.0");
    expect(wrapper.find('[data-testid="stepper-cold-fr"]').text()).toContain("28.0");
    expect(wrapper.find('[data-testid="stepper-cold-rl"]').text()).toContain("27.0");
    expect(wrapper.find('[data-testid="stepper-cold-rr"]').text()).toContain("27.0");

    // Axle hot target steppers
    expect(wrapper.find('[data-testid="stepper-target-front"]').text()).toContain("32.0");
    expect(wrapper.find('[data-testid="stepper-target-rear"]').text()).toContain("31.0");

    // Auto-bleed delta calculations: 32.0 - 28.0 = +4.0 PSI, 31.0 - 27.0 = +4.0 PSI
    expect(wrapper.text()).toContain("+4.0 PSI");
  });

  it("allows switching to Step 2 TrackSelector and selecting a different layout", async () => {
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    // Initially in Step 3
    expect(wrapper.text()).toContain("03 TRACK DAY");
    expect(wrapper.find('[data-testid="track-selector"]').exists()).toBe(false);

    // Click step 2 button in wizard header or Change track button
    const step2Btn = wrapper.find('[data-testid="wizard-step-2"]');
    expect(step2Btn.exists()).toBe(true);
    await step2Btn.trigger("click");

    // Now in Step 2: TrackSelector is displayed
    expect(wrapper.find('[data-testid="track-selector"]').exists()).toBe(true);

    // Find Brands Hatch and select Indy layout
    const trackStore = useTrackStore(testDb);
    const brandsHatch = trackStore.tracks.find((t) => t.name === "Brands Hatch");
    expect(brandsHatch).toBeDefined();

    // Expand Brands Hatch
    const trackCard = wrapper.find(`[data-testid="track-card-${brandsHatch!.id}"] button`);
    await trackCard.trigger("click");

    const indyLayout = trackStore.layouts.find(
      (l) => l.trackId === brandsHatch!.id && l.name === "Indy"
    );
    expect(indyLayout).toBeDefined();

    const indyOption = wrapper.find(`[data-testid="layout-option-${indyLayout!.id}"]`);
    await indyOption.trigger("click");

    // Automatically advances back to Step 3
    expect(wrapper.find('[data-testid="track-selector"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("BRANDS HATCH");
    expect(wrapper.text()).toContain("Indy");
  });

  it("shows read-only geometry preview with Phase 2 notification note", async () => {
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.text()).toContain("RECALLED GEOMETRY");
    expect(wrapper.text()).toContain("Geometry adjustment coming in Phase 2");
  });

  it("allows fine adjustment of pressures and converts British date to ISO", async () => {
    const pushSpy = vi.spyOn(router, "push");
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    // Increase FL cold pressure by 0.1 PSI: 28.0 -> 28.1
    const flStepper = wrapper.find('[data-testid="stepper-cold-fl"]');
    const flPlusBtn = flStepper.findAll("button")[1];
    await flPlusBtn.trigger("pointerdown");
    expect(flStepper.text()).toContain("28.1");

    // Set custom British date
    const dateInput = wrapper.find('input[name="trackDayDate"]');
    await dateInput.setValue("15 / 08 / 2026");

    // Submit setup
    const startBtn = wrapper.find('[data-testid="btn-start-track-day"]');
    await startBtn.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    const trackDayStore = useTrackDayStore(testDb);
    await trackDayStore.fetchTrackDays();
    const createdTrackDay = trackDayStore.trackDays[0];
    expect(createdTrackDay.date).toBe("2026-08-15");

    const sessions = await testDb.sessions.where("trackDayId").equals(createdTrackDay.id).toArray();

    const tyreReadingStore = useTyreReadingStore(testDb);
    const readings = await tyreReadingStore.fetchReadingsForSession(sessions[0].id);
    expect(readings.FL?.coldPressure).toBe(28.1);
    expect(readings.FR?.coldPressure).toBe(28.0);
    expect(readings.RL?.coldPressure).toBe(27.0);
    expect(readings.RR?.coldPressure).toBe(27.0);

    expect(pushSpy).toHaveBeenCalledWith(`/track-days/${createdTrackDay.id}/session/1`);
  });

  it("renders dynamic stepper limits and values for BAR and KPA vehicles", async () => {
    const vehicleStore = useVehicleStore(testDb);
    const barVehicle = await vehicleStore.createVehicle({
      make: "Porsche",
      model: "911 GT3",
      nickname: "GT3",
      pressureUnit: "BAR",
      defaultColdPressureFl: 1.85,
      defaultColdPressureFr: 1.85,
      defaultColdPressureRl: 2.05,
      defaultColdPressureRr: 2.05,
      defaultTargetPressureFl: 2.15,
      defaultTargetPressureRl: 2.35,
    });
    vehicleStore.setActiveVehicle(barVehicle.id);

    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    const barSteppers = wrapper.findAllComponents(PmStepper);
    expect(barSteppers.length).toBe(6);

    for (const stepper of barSteppers) {
      expect(stepper.props("min")).toBe(0.5);
      expect(stepper.props("max")).toBe(4.0);
      expect(stepper.props("step")).toBe(0.05);
      expect(stepper.props("decimals")).toBe(2);
      expect(stepper.props("unit")).toBe("BAR");
    }

    expect(wrapper.find('[data-testid="stepper-cold-fl"]').text()).toContain("1.85");
    expect(wrapper.find('[data-testid="stepper-cold-fl"]').text()).toContain("BAR");

    // Switch to KPA vehicle
    const kpaVehicle = await vehicleStore.createVehicle({
      make: "Volkswagen",
      model: "Golf",
      nickname: "Track Golf",
      pressureUnit: "KPA",
      defaultColdPressureFl: 200,
      defaultColdPressureFr: 200,
      defaultColdPressureRl: 190,
      defaultColdPressureRr: 190,
      defaultTargetPressureFl: 220,
      defaultTargetPressureRl: 210,
    });
    vehicleStore.setActiveVehicle(kpaVehicle.id);
    await wrapper.vm.$nextTick();

    const kpaSteppers = wrapper.findAllComponents(PmStepper);
    for (const stepper of kpaSteppers) {
      expect(stepper.props("min")).toBe(50);
      expect(stepper.props("max")).toBe(400);
      expect(stepper.props("step")).toBe(5);
      expect(stepper.props("decimals")).toBe(0);
      expect(stepper.props("unit")).toBe("KPA");
    }

    expect(wrapper.find('[data-testid="stepper-cold-fl"]').text()).toContain("200");
    expect(wrapper.find('[data-testid="stepper-cold-fl"]').text()).toContain("KPA");
  });

  it("displays empty vehicle warning if no vehicle exists in garage", async () => {
    const emptyDb = new PaddockMateDB("empty_vehicle_test_" + Date.now());
    await emptyDb.open();
    const emptyVehicleStore = useVehicleStore(emptyDb);
    await emptyVehicleStore.fetchVehicles();

    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: emptyDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.text()).toContain("No active vehicle selected");
    const startBtn = wrapper.find('[data-testid="btn-start-track-day"]');
    expect((startBtn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("handles date already formatted as ISO YYYY-MM-DD without inverting", async () => {
    const wrapper = mount(TrackDaySetupView, {
      global: {
        provide: { db: testDb },
        plugins: [router],
      },
    });

    await new Promise((r) => setTimeout(r, 60));

    const dateInput = wrapper.find('input[name="trackDayDate"]');
    await dateInput.setValue("2026-09-20");

    const startBtn = wrapper.find('[data-testid="btn-start-track-day"]');
    await startBtn.trigger("click");
    await new Promise((r) => setTimeout(r, 60));

    const trackDayStore = useTrackDayStore(testDb);
    await trackDayStore.fetchTrackDays();
    const createdTrackDay = trackDayStore.trackDays[0];
    expect(createdTrackDay.date).toBe("2026-09-20");
  });
});
