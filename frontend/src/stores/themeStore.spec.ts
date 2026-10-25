import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useThemeStore } from "./themeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("initialises with dark theme by default", () => {
    const store = useThemeStore();
    expect(store.theme).toBe("dark");
    expect(store.isDark).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("initialises with stored sunlight theme if present in localStorage", () => {
    localStorage.setItem("paddockmate_theme", "sunlight");
    const store = useThemeStore();
    expect(store.theme).toBe("sunlight");
    expect(store.isDark).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("sunlight");
  });

  it("toggles theme to sunlight and updates localStorage and DOM attribute", () => {
    const store = useThemeStore();
    store.toggleTheme();
    expect(store.theme).toBe("sunlight");
    expect(store.isDark).toBe(false);
    expect(localStorage.getItem("paddockmate_theme")).toBe("sunlight");
    expect(document.documentElement.getAttribute("data-theme")).toBe("sunlight");

    store.toggleTheme();
    expect(store.theme).toBe("dark");
    expect(store.isDark).toBe(true);
    expect(localStorage.getItem("paddockmate_theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets theme explicitly via setTheme", () => {
    const store = useThemeStore();
    store.setTheme("sunlight");
    expect(store.theme).toBe("sunlight");
    expect(store.isDark).toBe(false);
    expect(localStorage.getItem("paddockmate_theme")).toBe("sunlight");

    store.setTheme("dark");
    expect(store.theme).toBe("dark");
    expect(store.isDark).toBe(true);
    expect(localStorage.getItem("paddockmate_theme")).toBe("dark");
  });
});
