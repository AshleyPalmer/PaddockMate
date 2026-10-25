import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import VehicleCard from "./VehicleCard.vue";
import type { VehicleEntity } from "../../db/paddockMateDb";

describe("VehicleCard", () => {
  const sampleVehicle: VehicleEntity = {
    id: "v-1",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: "synced",
  };

  it("renders nickname and badges correctly", () => {
    const wrapper = mount(VehicleCard, {
      props: {
        vehicle: sampleVehicle,
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("330I · TRACK");
    expect(wrapper.text()).toContain("E90");
    expect(wrapper.text()).toContain("RWD");
    expect(wrapper.text()).toContain("PETROL");
    expect(wrapper.text()).toContain("FITTED TYRES");
    expect(wrapper.text()).toContain("Michelin Pilot Sport 5");
    expect(wrapper.text()).toContain("F 225/40 R18 / R 255/35 R18");
  });

  it("falls back to make and model when nickname is absent", () => {
    const wrapper = mount(VehicleCard, {
      props: {
        vehicle: {
          ...sampleVehicle,
          nickname: undefined,
        },
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("BMW 330I");
  });

  it("shows checkmark when selected", () => {
    const wrapper = mount(VehicleCard, {
      props: {
        vehicle: sampleVehicle,
        selected: true,
      },
    });

    const indicator = wrapper.find('[aria-label="Selection indicator"]');
    expect(indicator.classes()).toContain("bg-[#d4f933]");
    expect(indicator.classes()).toContain("text-black");
    expect(indicator.text()).toBe("✓");
  });

  it("emits select event when card is clicked", async () => {
    const wrapper = mount(VehicleCard, {
      props: {
        vehicle: sampleVehicle,
        selected: false,
      },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")?.[0]).toEqual([sampleVehicle]);
  });

  it("emits edit event when 'Edit vehicle' button is clicked without triggering select", async () => {
    const wrapper = mount(VehicleCard, {
      props: {
        vehicle: sampleVehicle,
        selected: false,
      },
    });

    const editBtn = wrapper.find("button");
    expect(editBtn.text()).toBe("Edit vehicle");
    expect(editBtn.classes()).toContain("min-h-[48px]");
    await editBtn.trigger("click");

    expect(wrapper.emitted("edit")).toBeTruthy();
    expect(wrapper.emitted("edit")?.[0]).toEqual([sampleVehicle]);
    expect(wrapper.emitted("select")).toBeFalsy();
  });
});
