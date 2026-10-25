import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import AppHeader from "./AppHeader.vue";
import { useThemeStore } from "../../stores/themeStore";

describe("AppHeader", () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div>Home</div>" } },
        { path: "/vehicles", component: { template: "<div>Garage</div>" } },
        { path: "/track-days/new", component: { template: "<div>Track Day</div>" } },
        { path: "/login", component: { template: "<div>Login</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();
  });

  it("renders PADDOCKMATE logo mark and link to home", () => {
    const wrapper = mount(AppHeader, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("PADDOCKMATE");
    const logoLink = wrapper.find('[data-testid="header-logo-link"]');
    expect(logoLink.exists()).toBe(true);
    expect(logoLink.attributes("href")).toBe("/");
  });

  it("renders offline sync status pill", () => {
    const wrapper = mount(AppHeader, {
      global: { plugins: [router] },
    });

    const pill = wrapper.find('[data-testid="sync-status-pill"]');
    expect(pill.exists()).toBe(true);
    expect(pill.text()).toContain("OFFLINE READY");
    expect(pill.text()).toContain("0 CHANGES PENDING");
  });

  it("renders navigation links to Garage, Track Day, and Login", () => {
    const wrapper = mount(AppHeader, {
      global: { plugins: [router] },
    });

    const garageLink = wrapper.find('[data-testid="nav-link-garage"]');
    const trackDayLink = wrapper.find('[data-testid="nav-link-track-day"]');
    const loginLink = wrapper.find('[data-testid="nav-link-login"]');

    expect(garageLink.exists()).toBe(true);
    expect(garageLink.attributes("href")).toBe("/vehicles");

    expect(trackDayLink.exists()).toBe(true);
    expect(trackDayLink.attributes("href")).toBe("/track-days/new");

    expect(loginLink.exists()).toBe(true);
    expect(loginLink.attributes("href")).toBe("/login");
  });

  it("renders theme toggle and toggles theme state when clicked", async () => {
    const wrapper = mount(AppHeader, {
      global: { plugins: [router] },
    });
    const themeStore = useThemeStore();

    const toggleBtn = wrapper.find('[data-testid="theme-toggle"]');
    expect(toggleBtn.exists()).toBe(true);
    expect(themeStore.theme).toBe("dark");

    await toggleBtn.trigger("click");
    expect(themeStore.theme).toBe("sunlight");
    expect(document.documentElement.getAttribute("data-theme")).toBe("sunlight");

    await toggleBtn.trigger("click");
    expect(themeStore.theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ensures interactive elements have minimum 48px touch targets", () => {
    const wrapper = mount(AppHeader, {
      global: { plugins: [router] },
    });

    const toggleBtn = wrapper.find('[data-testid="theme-toggle"]');
    expect(toggleBtn.classes().some((c) => c.includes("min-h-[48px]") || c.includes("h-12"))).toBe(
      true
    );

    const garageLink = wrapper.find('[data-testid="nav-link-garage"]');
    expect(garageLink.classes().some((c) => c.includes("min-h-[48px]") || c.includes("h-12"))).toBe(
      true
    );
  });
});
