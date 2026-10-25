import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "./App.vue";
import { createPaddockRouter } from "./router";

describe("App Shell", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders header bar with PADDOCKMATE logo and theme toggle", () => {
    const router = createPaddockRouter(true);
    const wrapper = mount(App, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("PADDOCKMATE");
    expect(wrapper.find('[data-testid="header-logo-link"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="sync-status-pill"]').exists()).toBe(true);
  });

  it("renders router-view container for matched route", async () => {
    const router = createPaddockRouter(true);
    await router.push("/login");
    await router.isReady();

    const wrapper = mount(App, {
      global: { plugins: [router] },
    });

    expect(wrapper.find("main").exists()).toBe(true);
    expect(wrapper.text()).toContain("BUILT FOR THE PIT LANE");
  });
});
