import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
  type Router,
  type RouteRecordRaw,
} from "vue-router";
import { useBaseTrackDayStore } from "../stores/trackDayStore";

// Placeholder views resolved in later tasks
const HomeRedirect = { template: "<div>Redirecting...</div>" };
const LoginView = () => import("../views/LoginView.vue");
const VehiclesView = () => import("../views/VehiclesView.vue");
const TrackDaySetupView = () => import("../views/TrackDaySetupView.vue");
const SessionTyreView = () => import("../views/SessionTyreView.vue");

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeRedirect,
    beforeEnter: async (_to, _from, next) => {
      const trackDayStore = useBaseTrackDayStore();
      await trackDayStore.fetchTrackDays();
      if (trackDayStore.activeTrackDayId && trackDayStore.activeSessionId) {
        next(
          `/track-days/${trackDayStore.activeTrackDayId}/session/${trackDayStore.activeSession?.sessionNumber ?? 1}`
        );
      } else {
        next("/track-days/new");
      }
    },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/vehicles",
    name: "vehicles",
    component: VehiclesView,
  },
  {
    path: "/track-days/new",
    name: "track-day-setup",
    component: TrackDaySetupView,
  },
  {
    path: "/track-days/:id/session/:sessionNumber",
    name: "session-tyres",
    component: SessionTyreView,
  },
];

export function createPaddockRouter(isTest = false): Router {
  return createRouter({
    history: isTest ? createMemoryHistory() : createWebHistory(),
    routes,
  });
}

export const router = createPaddockRouter();
