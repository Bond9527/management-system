import { useState, useEffect } from "react";
import { useTheme } from "@heroui/use-theme";

export type ThemeMode = "light" | "dark" | "system";

export function useThemeManager() {
  const { theme, setTheme } = useTheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // 从localStorage获取保存的主题偏好
    const saved = localStorage.getItem("themeMode");

    return (saved as ThemeMode) || "system";
  });

  // 检测系统主题
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    return "light";
  };

  // 应用主题
  const applyTheme = (mode: ThemeMode) => {
    let actualTheme: "light" | "dark";

    if (mode === "system") {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = mode;
    }

    // 使用HeroUI的setTheme来应用主题
    setTheme(actualTheme);

    // 同时更新HTML元素的类名
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
  };

  // 设置主题模式
  const setThemeModeAndSave = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode);
  };

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (themeMode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // 初始应用主题
    applyTheme(themeMode);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [themeMode]);

  return {
    themeMode,
    currentTheme: theme,
    setThemeMode: setThemeModeAndSave,
    systemTheme: getSystemTheme(),
  };
}
