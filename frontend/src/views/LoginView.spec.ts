import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import LoginView from "./LoginView.vue";

describe("LoginView", () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/login", component: LoginView },
        { path: "/track-days/new", component: { template: "<div>Track Day Setup</div>" } },
      ],
    });
    await router.push("/login");
    await router.isReady();
  });

  it("renders hero copy and offline guest button", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain("BUILT FOR THE PIT LANE");
    expect(wrapper.text()).toContain("Continue offline");
  });

  it("renders full hero banner messaging per Figma Frame 1", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain("BUILT FOR THE PIT LANE");
    expect(wrapper.text()).toContain("LESS GUESSWORK. MORE GOOD LAPS.");
    expect(wrapper.text()).toContain("Pressures. Geometry. Every session.");
  });

  it("renders Returning Driver card with Ashley Palmer and offline synchronisation note", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain("RETURNING DRIVER");
    expect(wrapper.text()).toContain("Ashley Palmer · saved on this device");
    expect(wrapper.text()).toContain("Continue offline as Ashley →");
    expect(wrapper.text()).toContain(
      "Log instantly without signal. Changes sync automatically when you're back online."
    );
  });

  it("navigates to /track-days/new when clicking 'Continue offline as Ashley →'", async () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    const offlineBtn = wrapper.find('[data-testid="btn-continue-offline"]');
    expect(offlineBtn.exists()).toBe(true);
    await offlineBtn.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/track-days/new");
  });

  it("renders driver sign-in form with email, password, and trust this device checkbox", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("DRIVER SIGN IN");
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const checkbox = wrapper.find('input[type="checkbox"]');
    const submitBtn = wrapper.find('[data-testid="btn-sign-in"]');

    expect(emailInput.exists()).toBe(true);
    expect(passwordInput.exists()).toBe(true);
    expect(checkbox.exists()).toBe(true);
    expect(wrapper.text()).toContain("Trust this device");
    expect(submitBtn.exists()).toBe(true);
    expect(submitBtn.text()).toContain("Sign in →");
  });

  it("validates form inputs and submits credentials navigating to /track-days/new", async () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    const submitBtn = wrapper.find('[data-testid="btn-sign-in"]');
    await submitBtn.trigger("click");

    expect(wrapper.text()).toContain("Email is required");
    expect(wrapper.text()).toContain("Password is required");

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');

    await emailInput.setValue("driver@paddockmate.app");
    await passwordInput.setValue("SuperSecretLapTime123!");

    await submitBtn.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/track-days/new");
  });

  it("submits form when pressing Enter via form submit event", async () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');

    await emailInput.setValue("driver2@paddockmate.app");
    await passwordInput.setValue("FastLap2026!");

    const form = wrapper.find("form");
    await form.trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/track-days/new");
  });

  it("renders disabled social sign-in buttons with Phase 2 badge", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    const googleBtn = wrapper.find('[data-testid="btn-social-google"]');
    const appleBtn = wrapper.find('[data-testid="btn-social-apple"]');

    expect(googleBtn.exists()).toBe(true);
    expect(appleBtn.exists()).toBe(true);
    expect((googleBtn.element as HTMLButtonElement).disabled).toBe(true);
    expect((appleBtn.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.text()).toContain("Cloud synchronisation · Phase 2");
  });

  it("ensures all interactive elements have minimum 48px touch targets", () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [router] },
    });

    // Offline guest button
    const offlineBtn = wrapper.find('[data-testid="btn-continue-offline"]');
    expect(offlineBtn.classes().some((c) => c.includes("min-h-[48px]") || c.includes("h-12"))).toBe(
      true
    );

    // Sign in button
    const signInBtn = wrapper.find('[data-testid="btn-sign-in"]');
    expect(signInBtn.classes().some((c) => c.includes("min-h-[48px]") || c.includes("h-12"))).toBe(
      true
    );

    // Trust device checkbox wrapper touch target
    const checkboxContainer = wrapper.find('[data-testid="checkbox-trust-device-container"]');
    expect(
      checkboxContainer.classes().some((c) => c.includes("min-h-[48px]") || c.includes("h-12"))
    ).toBe(true);
  });
});
