import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TrackSelector from "./TrackSelector.vue";
import { useTrackStore } from "../../stores/trackStore";
import { PaddockMateDB } from "../../db/paddockMateDb";
import "fake-indexeddb/auto";

describe("TrackSelector", () => {
  let testDb: PaddockMateDB;

  beforeEach(async () => {
    setActivePinia(createPinia());
    testDb = new PaddockMateDB("test_track_selector_" + Date.now());
    const store = useTrackStore(testDb);
    await store.fetchTracks();
    await store.fetchLayouts();
  });

  it("renders pre-seeded UK tracks and filters on search", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(wrapper.text()).toContain("BRANDS HATCH");

    const searchInput = wrapper.find('input[type="search"]');
    await searchInput.setValue("Silverstone");
    expect(wrapper.text()).toContain("SILVERSTONE");
    expect(wrapper.text()).not.toContain("CADWELL PARK");
  });

  it("filters tracks by region and clears search query", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    const searchInput = wrapper.find('input[type="search"]');
    await searchInput.setValue("Northamptonshire");
    expect(wrapper.text()).toContain("SILVERSTONE");
    expect(wrapper.text()).not.toContain("BRANDS HATCH");

    // Clear search button should appear and reset search when clicked
    const clearButton = wrapper.find('button[aria-label="Clear search"]');
    expect(clearButton.exists()).toBe(true);
    await clearButton.trigger("click");

    expect(wrapper.text()).toContain("BRANDS HATCH");
    expect(wrapper.text()).toContain("SILVERSTONE");
  });

  it("displays empty state when no tracks match query", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    const searchInput = wrapper.find('input[type="search"]');
    await searchInput.setValue("NonExistentTrack123");

    expect(wrapper.text()).toContain('No tracks found matching "NonExistentTrack123"');
  });

  it("displays region, country, and formatted layout count", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    expect(wrapper.text()).toContain("GB / NORTHAMPTONSHIRE");
    expect(wrapper.text()).toContain("03 LAYOUTS"); // Silverstone has GP, National, International
    expect(wrapper.text()).toContain("GB / KENT");
    expect(wrapper.text()).toContain("02 LAYOUTS"); // Brands Hatch has GP, Indy
  });

  it("expands track layouts when clicked and collapses on second click", async () => {
    const store = useTrackStore(testDb);
    const brandsHatch = store.tracks.find((t) => t.name === "Brands Hatch")!;

    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Initially collapsed
    expect(
      wrapper.find(`[data-testid="track-card-${brandsHatch.id}"] [role="radiogroup"]`).exists()
    ).toBe(false);

    // Click track header to expand
    const trackButton = wrapper.find(`[data-testid="track-card-${brandsHatch.id}"] button`);
    await trackButton.trigger("click");

    const radiogroup = wrapper.find(
      `[data-testid="track-card-${brandsHatch.id}"] [role="radiogroup"]`
    );
    expect(radiogroup.exists()).toBe(true);
    expect(radiogroup.text()).toContain("Grand Prix");
    expect(radiogroup.text()).toContain("Indy");
    expect(radiogroup.text()).toContain("3.92 km · 9 turns");
    expect(radiogroup.text()).toContain("1.94 km · 6 turns");

    // Click again to collapse
    await trackButton.trigger("click");
    expect(
      wrapper.find(`[data-testid="track-card-${brandsHatch.id}"] [role="radiogroup"]`).exists()
    ).toBe(false);
  });

  it("emits select event when a layout is chosen", async () => {
    const store = useTrackStore(testDb);
    const silverstone = store.tracks.find((t) => t.name === "Silverstone")!;
    const layouts = store.getLayoutsForTrack(silverstone.id);
    const gpLayout = layouts.find((l) => l.name === "Grand Prix")!;

    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Expand Silverstone
    const trackButton = wrapper.find(`[data-testid="track-card-${silverstone.id}"] button`);
    await trackButton.trigger("click");

    // Select Grand Prix layout
    const layoutOption = wrapper.find(`[data-testid="layout-option-${gpLayout.id}"]`);
    expect(layoutOption.exists()).toBe(true);
    await layoutOption.trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual([silverstone.id, gpLayout.id]);
    expect(wrapper.emitted("update:selectedTrackId")![0]).toEqual([silverstone.id]);
    expect(wrapper.emitted("update:selectedLayoutId")![0]).toEqual([gpLayout.id]);
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([
      { trackId: silverstone.id, layoutId: gpLayout.id },
    ]);
  });

  it("pre-selects and expands track when selectedTrackId and selectedLayoutId props are passed", async () => {
    const store = useTrackStore(testDb);
    const oultonPark = store.tracks.find((t) => t.name === "Oulton Park")!;
    const islandLayout = store.getLayoutsForTrack(oultonPark.id).find((l) => l.name === "Island")!;

    const wrapper = mount(TrackSelector, {
      props: {
        selectedTrackId: oultonPark.id,
        selectedLayoutId: islandLayout.id,
      },
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Should be automatically expanded
    const radiogroup = wrapper.find(
      `[data-testid="track-card-${oultonPark.id}"] [role="radiogroup"]`
    );
    expect(radiogroup.exists()).toBe(true);

    const layoutOption = wrapper.find(`[data-testid="layout-option-${islandLayout.id}"]`);
    expect(layoutOption.attributes("aria-checked")).toBe("true");
  });

  it("opens CustomTrackModal and allows creating a new track and layout", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Click "+ Add Custom Track or Layout"
    const addBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add Custom Track or Layout"));
    expect(addBtn?.exists()).toBe(true);
    await addBtn!.trigger("click");

    // Custom track modal dialog should be visible
    const modal = wrapper.find('[role="dialog"]');
    expect(modal.exists()).toBe(true);
    expect(modal.text()).toContain("Add Custom Track");

    // Fill new track details
    const trackNameInput = modal.find("input#custom-track-name");
    await trackNameInput.setValue("Rockingham Motor Speedway");

    const layoutNameInput = modal.find("input#custom-layout-name");
    await layoutNameInput.setValue("International Super Sports Car");

    const lengthInput = modal.find("input#custom-layout-length");
    await lengthInput.setValue("3120");

    // Submit form
    await modal.find("form").trigger("submit.prevent");
    await new Promise((r) => setTimeout(r, 50));

    // Modal should close
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    // Track list should now include Rockingham Motor Speedway in uppercase
    expect(wrapper.text()).toContain("ROCKINGHAM MOTOR SPEEDWAY");

    // It should have emitted select with the new track and layout IDs
    expect(wrapper.emitted("select")).toBeTruthy();
    const selectEvents = wrapper.emitted("select")!;
    const lastSelect = selectEvents[selectEvents.length - 1];
    expect(lastSelect[0]).toBeTypeOf("string");
    expect(lastSelect[1]).toBeTypeOf("string");
  });

  it("clears search query upon custom track creation so new track is immediately visible", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Type a search query that yields zero results
    const searchInput = wrapper.find('input[type="search"]');
    await searchInput.setValue("UnknownTrackABC");
    expect(wrapper.text()).toContain('No tracks found matching "UnknownTrackABC"');

    // Click "+ Add Custom Track or Layout" from empty state
    const addBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add Custom Track or Layout"))!;
    await addBtn.trigger("click");

    const modal = wrapper.find('[role="dialog"]');
    await modal.find("input#custom-track-name").setValue("Mallory Park");
    await modal.find("input#custom-layout-name").setValue("Grand Prix");
    await modal.find("form").trigger("submit.prevent");
    await new Promise((r) => setTimeout(r, 50));

    // Search input should be cleared
    expect((wrapper.find('input[type="search"]').element as HTMLInputElement).value).toBe("");

    // Mallory Park should be visible and expanded in the list
    expect(wrapper.text()).toContain("MALLORY PARK");
    expect(wrapper.text()).toContain("Grand Prix");
  });

  it("enforces minimum 48px touch targets on interactive controls", async () => {
    const wrapper = mount(TrackSelector, {
      global: { provide: { db: testDb } },
    });
    await new Promise((r) => setTimeout(r, 50));

    // Search input
    const searchInput = wrapper.find('input[type="search"]');
    expect(searchInput.classes()).toContain("min-h-[48px]");

    // Add track button
    const addBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add Custom Track or Layout"));
    expect(addBtn?.classes()).toContain("min-h-[48px]");

    // Track card accordion button
    const trackButton = wrapper.find('[data-testid^="track-card-"] button');
    expect(trackButton.classes()).toContain("min-h-[48px]");

    // Expand to test layout button
    await trackButton.trigger("click");
    const layoutButton = wrapper.find('[data-testid^="layout-option-"]');
    expect(layoutButton.classes()).toContain("min-h-[48px]");
  });
});
