"use client";

import { useEffect, useCallback } from "react";

type HotkeyCallback = (event: KeyboardEvent) => void;

export const useHotkeys = (hotkeys: [string, HotkeyCallback][]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      hotkeys.forEach(([hotkey, callback]) => {
        const keys = hotkey.split("+");
        const requiredKeys = keys.slice(0, -1);
        const mainKey = keys[keys.length - 1];

        const isModifierPressed = requiredKeys.every((key) => {
          if (key === "Cmd" || key === "Ctrl")
            return event.metaKey || event.ctrlKey;
          if (key === "Shift") return event.shiftKey;
          if (key === "Alt") return event.altKey;
          return false;
        });

        if (requiredKeys.length > 0) {
          if (
            isModifierPressed &&
            event.key.toLowerCase() === mainKey.toLowerCase()
          ) {
            event.preventDefault();
            callback(event);
          }
        } else {
          if (event.key.toLowerCase() === mainKey.toLowerCase()) {
            event.preventDefault();
            callback(event);
          }
        }
      });
    },
    [hotkeys]
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};
