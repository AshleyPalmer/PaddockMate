import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CustomTrackModal from "./CustomTrackModal.vue";
import { useTrackStore } from "../../stores/trackStore";
import { PaddockMateDB } from "../../db/paddockMateDb";
import "fake-indexeddb/auto";

describe("CustomTrackModal", () => {
  let testDb: PaddockMateDB;

  beforeEach(async () => {
    setActivePinia(createPinia());
    testDb = new PaddockMateDB("test_custom_track_modal_" + Date.now());
    const store = useTrackStore(testDb);
    await store.fetchTracks();
    await store.fetchLayouts();
  });

  it("does not render when isOpen is false", () => {
    const wrapper = mount(CustomTrackModal, {
      props: { isOpen: false },
      global: { provide: { db: testDb } },
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("renders when isOpen is true and emits close on Cancel or ✕", async () => {
    const wrapper = mount(CustomTrackModal, {
      props: { isOpen: true },
      global: { provide: { db: testDb } },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    // Click ✕ button
    const closeBtn = wrapper.find('button[aria-label="Close modal"]');
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();

    // Click Cancel button
    const cancelBtn = wrapper.findAll("button").find((b) => b.text() === "Cancel")!;
    await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")!.length).toBe(2);
  });

  it("validates required fields for new track mode", async () => {
    const wrapper = mount(CustomTrackModal, {
      props: { isOpen: true },
      global: { provide: { db: testDb } },
    });

    // Try submitting without values
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Track name is required");
    expect(wrapper.text()).toContain("Layout name is required");
    expect(wrapper.emitted("created")).toBeFalsy();
  });

  it("creates custom track and layout, then emits created and close", async () => {
    const wrapper = mount(CustomTrackModal, {
      props: { isOpen: true },
      global: { provide: { db: testDb } },
    });

    await wrapper.find("input#custom-track-name").setValue("Donington Park Custom");
    await wrapper.find("input#custom-track-country").setValue("United Kingdom");
    await wrapper.find("input#custom-layout-name").setValue("Historic Loop");
    await wrapper.find("input#custom-layout-length").setValue("2500");

    await wrapper.find("form").trigger("submit.prevent");
    await new Promise((r) => setTimeout(r, 50));

    expect(wrapper.emitted("created")).toBeTruthy();
    const payload = wrapper.emitted("created")![0][0] as { trackId: string; layoutId: string };
    expect(payload.trackId).toBeTruthy();
    expect(payload.layoutId).toBeTruthy();
    expect(wrapper.emitted("close")).toBeTruthy();

    // Check store
    const store = useTrackStore(testDb);
    const addedTrack = store.getTrackById(payload.trackId);
    expect(addedTrack).toBeDefined();
    expect(addedTrack?.name).toBe("Donington Park Custom");

    const addedLayout = store.getLayoutById(payload.layoutId);
    expect(addedLayout).toBeDefined();
    expect(addedLayout?.name).toBe("Historic Loop");
    expect(addedLayout?.lengthMetres).toBe(2500);
  });

  it("supports adding a layout to an existing track", async () => {
    const store = useTrackStore(testDb);
    const silverstone = store.tracks.find((t) => t.name === "Silverstone")!;

    const wrapper = mount(CustomTrackModal, {
      props: {
        isOpen: true,
        defaultTrackId: silverstone.id,
      },
      global: { provide: { db: testDb } },
    });

    // When defaultTrackId is provided, mode switches to existing-track
    const select = wrapper.find("select#custom-track-select");
    expect(select.exists()).toBe(true);
    expect((select.element as HTMLSelectElement).value).toBe(silverstone.id);

    await wrapper.find("input#custom-layout-name").setValue("Stowe Circuit");
    await wrapper.find("input#custom-layout-length").setValue("1738");

    await wrapper.find("form").trigger("submit.prevent");
    await new Promise((r) => setTimeout(r, 50));

    expect(wrapper.emitted("created")).toBeTruthy();
    const payload = wrapper.emitted("created")![0][0] as { trackId: string; layoutId: string };
    expect(payload.trackId).toBe(silverstone.id);

    const layouts = store.getLayoutsForTrack(silverstone.id);
    expect(layouts.some((l) => l.name === "Stowe Circuit")).toBe(true);
  });

  it("enforces minimum 48px touch targets on modal controls", () => {
    const wrapper = mount(CustomTrackModal, {
      props: { isOpen: true },
      global: { provide: { db: testDb } },
    });

    // Close button
    const closeBtn = wrapper.find('button[aria-label="Close modal"]');
    expect(closeBtn.classes()).toContain("min-h-[48px]");
    expect(closeBtn.classes()).toContain("min-w-[48px]");

    // Mode tabs
    const modeTabs = wrapper
      .findAll("button")
      .filter((b) => ["New Track", "Existing Track"].includes(b.text()));
    modeTabs.forEach((tab) => {
      expect(tab.classes()).toContain("min-h-[48px]");
    });

    // Inputs
    const trackNameInput = wrapper.find("input#custom-track-name");
    expect(trackNameInput.classes()).toContain("min-h-[48px]");

    // Action buttons
    const actionBtns = wrapper
      .findAll("button")
      .filter((b) => b.text().includes("Cancel") || b.text().includes("Save Track"));
    actionBtns.forEach((btn) => {
      expect(btn.classes()).toContain("min-h-[48px]");
    });
  });
});
