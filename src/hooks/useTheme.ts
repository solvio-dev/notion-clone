import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "../services/database";
import type { Theme } from "../types";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSetting("theme").then((value) => {
      const t = value === "dark" ? "dark" : "light";
      setThemeState(t);
      document.documentElement.classList.toggle("dark", t === "dark");
      setLoaded(true);
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setSetting("theme", t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, loaded };
}
