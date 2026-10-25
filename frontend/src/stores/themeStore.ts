import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type AppTheme = "dark" | "sunlight";

export const useThemeStore = defineStore("theme", () => {
  const stored = localStorage.getItem("paddockmate_theme") as AppTheme | null;
  const theme = ref<AppTheme>(stored === "sunlight" ? "sunlight" : "dark");

  const isDark = computed(() => theme.value === "dark");

  function applyTheme(newTheme: AppTheme) {
    theme.value = newTheme;
    localStorage.setItem("paddockmate_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  function toggleTheme() {
    applyTheme(theme.value === "dark" ? "sunlight" : "dark");
  }

  function setTheme(newTheme: AppTheme) {
    applyTheme(newTheme);
  }

  // Initialise DOM attribute on store creation
  applyTheme(theme.value);

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };
});
