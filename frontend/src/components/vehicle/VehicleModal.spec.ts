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

  it("enforces minimum 48px touch targets on interactive controls", () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: true },
    });

    const closeBtn = wrapper.find('button[aria-label="Close modal"]');
    expect(closeBtn.classes()).toContain("min-h-[48px]");
    expect(closeBtn.classes()).toContain("min-w-[48px]");

    const drivetrainBtns = wrapper
      .findAll("button")
      .filter((b) => ["RWD", "FWD", "AWD"].includes(b.text()));
    expect(drivetrainBtns).toHaveLength(3);
    for (const btn of drivetrainBtns) {
      expect(btn.classes()).toContain("min-h-[48px]");
    }

    const unitBtns = wrapper
      .findAll("button")
      .filter((b) => ["PSI", "BAR", "KPA"].includes(b.text()));
    expect(unitBtns).toHaveLength(3);
    for (const btn of unitBtns) {
      expect(btn.classes()).toContain("min-h-[48px]");
    }
  });

  it("configures PSI steppers with 0.1 step", () => {
    const wrapper = mount(VehicleModal, {
      props: { isOpen: true },
    });

    const steppers = wrapper.findAllComponents({ name: "PmStepper" });
    expect(steppers.length).toBeGreaterThan(0);
    for (const stepper of steppers) {
      expect(stepper.props("step")).toBe(0.1);
      expect(stepper.props("unit")).toBe("PSI");
    }
  });

  it("supports KPA default pressures and unit switching", async () => {
    const kpaVehicle: VehicleEntity = {
      id: "v-kpa-1",
      make: "Toyota",
      model: "Supra",
      drivetrain: "RWD",
      pressureUnit: "KPA",
      defaultColdPressureFl: 190,
      defaultColdPressureFr: 190,
      defaultColdPressureRl: 180,
      defaultColdPressureRr: 180,
      defaultTargetPressureFl: 220,
      defaultTargetPressureFr: 220,
      defaultTargetPressureRl: 210,
      defaultTargetPressureRr: 210,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "synced",
    };

    const wrapper = mount(VehicleModal, {
      props: {
        isOpen: true,
        vehicle: kpaVehicle,
      },
    });

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(wrapper.emitted("save")).toBeTruthy();
    const emitted = wrapper.emitted("save")?.[0][0] as Record<string, unknown>;
    expect(emitted.pressureUnit).toBe("KPA");
    expect(emitted.defaultColdPressureFl).toBe(190);
    expect(emitted.defaultTargetPressureFl).toBe(220);
  });
});
