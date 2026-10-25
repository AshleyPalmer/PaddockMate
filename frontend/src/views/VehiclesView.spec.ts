import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import VehiclesView from "./VehiclesView.vue";
import { useVehicleStore } from "../stores/vehicleStore";
import { PaddockMateDB } from "../db/paddockMateDb";

describe("VehiclesView", () => {
  let testDb: PaddockMateDB;
  let router: ReturnType<typeof createRouter>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    testDb = new PaddockMateDB(`VehiclesViewTest-${Date.now()}-${Math.random()}`);
    await testDb.open();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/vehicles", component: VehiclesView },
        { path: "/track-days/new", component: { template: "<div>Track Day Setup</div>" } },
      ],
    });
    await router.push("/vehicles");
    await router.isReady();
  });

  it("renders header with British English and ubiquitous language", async () => {
    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    expect(wrapper.text()).toContain("01 / PREPARE YOUR CAR");
    expect(wrapper.text()).toContain("YOUR GARAGE");
    expect(wrapper.text()).toContain("Choose the vehicle you're taking out today.");
  });

  it("shows empty state when no vehicles exist", async () => {
    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain("No vehicles in your garage yet.");
    expect(wrapper.find("button:disabled").text()).toContain("Select a vehicle to continue →");
  });

  it("renders vehicles from store and selects active vehicle", async () => {
    const store = useVehicleStore(testDb);
    await store.createVehicle({
      make: "BMW",
      model: "330i",
      year: 2007,
      nickname: "330i · Track",
      drivetrain: "RWD",
      chassis: "E90",
      fuel: "Petrol",
      tyreModel: "Michelin Pilot Sport 5",
      frontTyreSize: "225/40 R18",
      rearTyreSize: "255/35 R18",
      suspension: "Öhlins Road & Track",
      pressureUnit: "PSI",
    });

    const vehicle2 = await store.createVehicle({
      make: "Porsche",
      model: "Cayman GT4",
      nickname: "Track Cayman",
      drivetrain: "RWD",
    });

    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain("330I · TRACK");
    expect(wrapper.text()).toContain("TRACK CAYMAN");

    // By default, first created vehicle is active
    expect(wrapper.text()).toContain("Continue with 330i · Track →");

    // Click vehicle 2 card to select it
    const cards = wrapper.findAllComponents({ name: "VehicleCard" });
    expect(cards).toHaveLength(2);
    await cards[1].trigger("click");

    expect(store.activeVehicleId).toBe(vehicle2.id);
    expect(wrapper.text()).toContain("Continue with Track Cayman →");
  });

  it("navigates to /track-days/new when continue button is clicked", async () => {
    const store = useVehicleStore(testDb);
    await store.createVehicle({
      make: "BMW",
      model: "330i",
      nickname: "Track BMW",
    });

    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const continueBtn = wrapper.find("footer button");
    expect(continueBtn.text()).toContain("Continue with Track BMW →");

    await continueBtn.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/track-days/new");
  });

  it("opens modal and creates a new vehicle", async () => {
    const store = useVehicleStore(testDb);
    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    // Modal is initially closed
    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);

    // Click Add vehicle +
    const addBtn = wrapper.find("header button");
    expect(addBtn.text()).toContain("Add vehicle +");
    expect(addBtn.classes()).toContain("min-h-[48px]");
    await addBtn.trigger("click");

    expect(wrapper.find('div[role="dialog"]').exists()).toBe(true);

    // Fill in form and submit
    await wrapper.find('input[placeholder="e.g. BMW"]').setValue("Mazda");
    await wrapper.find('input[placeholder="e.g. 330i"]').setValue("MX-5");
    await wrapper.find('input[placeholder="e.g. 330i · Track"]').setValue("Track MX-5");

    const form = wrapper.find("form");
    await form.trigger("submit");

    await new Promise((r) => setTimeout(r, 50));

    // Modal closes
    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);

    // Vehicle exists in store and view
    expect(store.vehicles.some((v) => v.model === "MX-5")).toBe(true);
    expect(wrapper.text()).toContain("TRACK MX-5");
  });

  it("opens modal with vehicle data and updates existing vehicle when Edit vehicle is clicked", async () => {
    const store = useVehicleStore(testDb);
    const vehicle = await store.createVehicle({
      make: "BMW",
      model: "330i",
      nickname: "Original Name",
    });

    const wrapper = mount(VehiclesView, {
      global: {
        plugins: [router],
        provide: { db: testDb },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const editBtn = wrapper.find("button.underline");
    expect(editBtn.exists()).toBe(true);
    await editBtn.trigger("click");

    expect(wrapper.find('div[role="dialog"]').exists()).toBe(true);

    const nicknameInput = wrapper.find('input[placeholder="e.g. 330i · Track"]');
    await nicknameInput.setValue("Updated Nickname");

    const form = wrapper.find("form");
    await form.trigger("submit");

    await new Promise((r) => setTimeout(r, 50));

    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);
    const updated = await testDb.vehicles.get(vehicle.id);
    expect(updated?.nickname).toBe("Updated Nickname");
    expect(wrapper.text()).toContain("UPDATED NICKNAME");
  });
});
