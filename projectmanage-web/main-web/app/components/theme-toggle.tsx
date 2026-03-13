"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "light";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-1 px-2 py-1 rounded-full"
    >

      <div className="relative w-10 h-5 bg-gray-300 dark:bg-gray-700 rounded-full">
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${
            isDark ? "translate-x-5" : ""
          }`}
        />
      </div>
    </button>
  );
}
