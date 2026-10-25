import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import VehicleModal from "./VehicleModal.vue";
import type { VehicleEntity } from "../../db/paddockMateDb";

describe("VehicleModal", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("validates required make and model and displays error", async () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: true },
    });

    const saveBtn = wrapper.find('button[type="submit"]');
    await saveBtn.trigger("submit");

    expect(wrapper.text()).toContain("Make is required");
    expect(wrapper.text()).toContain("Model is required");
  });

  it("emits save event with vehicle details when valid", async () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: true },
    });

    await wrapper.find('input[placeholder="e.g. BMW"]').setValue("BMW");
    await wrapper.find('input[placeholder="e.g. 330i"]').setValue("330i");

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(wrapper.emitted("save")).toBeTruthy();
    const emitted = wrapper.emitted("save")?.[0][0] as Record<string, unknown>;
    expect(emitted.make).toBe("BMW");
    expect(emitted.model).toBe("330i");
    expect(emitted.drivetrain).toBe("RWD");
    expect(emitted.pressureUnit).toBe("PSI");
  });

  it("pre-populates existing vehicle details when editing", async () => {
    const existingVehicle: VehicleEntity = {
      id: "v-edit-1",
      make: "Porsche",
      model: "Cayman GT4",
      year: 2021,
      nickname: "Track Cayman",
      drivetrain: "RWD",
      tyreModel: "Michelin Pilot Sport Cup 2",
      frontTyreSize: "245/35 R20",
      rearTyreSize: "295/30 R20",
      suspension: "PASM Sport",
      pressureUnit: "BAR",
      defaultColdPressureFl: 2.0,
      defaultColdPressureFr: 2.0,
      defaultColdPressureRl: 2.1,
      defaultColdPressureRr: 2.1,
      defaultTargetPressureFl: 2.2,
      defaultTargetPressureFr: 2.2,
      defaultTargetPressureRl: 2.3,
      defaultTargetPressureRr: 2.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "synced",
    };

    const wrapper = mount(VehicleModal, {
      props: {
        isOpen: true,
        vehicle: existingVehicle,
      },
    });

    expect(wrapper.text()).toContain("EDIT VEHICLE");
    expect((wrapper.find('input[placeholder="e.g. BMW"]').element as HTMLInputElement).value).toBe(
      "Porsche"
    );
    expect((wrapper.find('input[placeholder="e.g. 330i"]').element as HTMLInputElement).value).toBe(
      "Cayman GT4"
    );
    expect(
      (wrapper.find('input[placeholder="e.g. 330i · Track"]').element as HTMLInputElement).value
    ).toBe("Track Cayman");

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(wrapper.emitted("save")).toBeTruthy();
    const emitted = wrapper.emitted("save")?.[0][0] as Record<string, unknown>;
    expect(emitted.id).toBe("v-edit-1");
    expect(emitted.make).toBe("Porsche");
    expect(emitted.model).toBe("Cayman GT4");
  });

  it("emits close event when Cancel button is clicked", async () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: true },
    });

    const cancelBtn = wrapper.findAll("button").find((b) => b.text() === "Cancel");
    expect(cancelBtn).toBeDefined();
    await cancelBtn!.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("does not render modal contents when isOpen is false", () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: false },
    });

    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);
  });
});
