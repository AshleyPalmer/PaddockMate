import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createPaddockRouter } from "./index";
import { useBaseTrackDayStore } from "../stores/trackDayStore";

describe("PaddockMate Router", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("declares all required routes", () => {
    const router = createPaddockRouter();
    const routeNames = router.getRoutes().map((r) => r.path);

    expect(routeNames).toContain("/");
    expect(routeNames).toContain("/login");
    expect(routeNames).toContain("/vehicles");
    expect(routeNames).toContain("/track-days/new");
    expect(routeNames).toContain("/track-days/:id/session/:sessionNumber");
  });

  it("redirects / to /track-days/new when no active track day exists", async () => {
    const router = createPaddockRouter(true);
    await router.push("/");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/track-days/new");
  });

  it("redirects / to active track day and session when active session is present", async () => {
    const trackDayStore = useBaseTrackDayStore();
    trackDayStore.activeTrackDayId = "td-1";
    trackDayStore.activeSessionId = "s-1";
    trackDayStore.sessions = [
      {
        id: "s-1",
        trackDayId: "td-1",
        sessionNumber: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: "synced",
      },
    ];

    const router = createPaddockRouter(true);
    await router.push("/");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/track-days/td-1/session/3");
  });

  it("defaults to session 1 if active session record is missing in sessions array", async () => {
    const trackDayStore = useBaseTrackDayStore();
    trackDayStore.activeTrackDayId = "td-2";
    trackDayStore.activeSessionId = "s-missing";
    trackDayStore.sessions = [];

    const router = createPaddockRouter(true);
    await router.push("/");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/track-days/td-2/session/1");
  });
});
