"use client";

import React, {
  useEffect,
  useCallback,
  useContext,
  createContext,
  useRef,
  ReactNode,
} from "react";

type HotkeyCallback = (event: KeyboardEvent) => void;
export type Hotkey = [string, HotkeyCallback];

export interface HotkeyOptions {
  scope?: string;
  priority?: number;
  enabled?: boolean;
}

interface RegisteredHotkey {
  hotkey: Hotkey;
  options: HotkeyOptions;
}

interface HotkeyContextType {
  registerHotkeys: (hotkeys: Hotkey[], options?: HotkeyOptions) => void;
  unregisterHotkeys: (hotkeys: Hotkey[], options?: HotkeyOptions) => void;
}

const HotkeyContext = createContext<HotkeyContextType | null>(null);

type ScopedHotkeys = Map<string, RegisteredHotkey[]>;

export const HotkeyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const scopedHotkeysRef = useRef<ScopedHotkeys>(new Map());

  const registerHotkeys = useCallback(
    (hotkeys: Hotkey[], options: HotkeyOptions = {}) => {
      const scope = options.scope || "global";
      const currentHotkeys = scopedHotkeysRef.current.get(scope) || [];
      const newHotkeys = hotkeys.map((hotkey) => ({ hotkey, options }));
      scopedHotkeysRef.current.set(scope, [...currentHotkeys, ...newHotkeys]);
    },
    []
  );

  const unregisterHotkeys = useCallback(
    (hotkeys: Hotkey[], options: HotkeyOptions = {}) => {
      const scope = options.scope || "global";
      if (!scopedHotkeysRef.current.has(scope)) return;

      const currentHotkeys = scopedHotkeysRef.current.get(scope)!;
      const hotkeysToRemove = new Set(hotkeys.map((h) => h[0])); // Compare by string representation

      const remainingHotkeys = currentHotkeys.filter(
        (regHotkey) => !hotkeysToRemove.has(regHotkey.hotkey[0])
      );

      if (remainingHotkeys.length > 0) {
        scopedHotkeysRef.current.set(scope, remainingHotkeys);
      } else {
        scopedHotkeysRef.current.delete(scope);
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Get all registered hotkeys and sort by priority (higher priority first)
      const allHotkeys = Array.from(scopedHotkeysRef.current.values())
        .flat()
        .sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

      for (const {
        hotkey: [hotkeyStr, callback],
        options,
      } of allHotkeys) {
        // Respect the enabled flag
        if (options.enabled === false) {
          continue;
        }

        const keys = hotkeyStr.split("+");
        const mainKey = keys.pop()?.toLowerCase();
        if (!mainKey) continue;

        const requiredKeys = keys.map((k) => k.toLowerCase());

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        const modifiersMatch =
          requiredKeys.includes("ctrl") === ctrlPressed &&
          requiredKeys.includes("shift") === shiftPressed &&
          requiredKeys.includes("alt") === altPressed;

        if (event.key.toLowerCase() === mainKey && modifiersMatch) {
          event.preventDefault();
          callback(event);
          return; // Stop after first match - highest priority wins
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const contextValue = {
    registerHotkeys,
    unregisterHotkeys,
  };

  return (
    <HotkeyContext.Provider value={contextValue}>
      {children}
    </HotkeyContext.Provider>
  );
};

export const useHotkeys = (hotkeys: Hotkey[], options: HotkeyOptions = {}) => {
  const context = useContext(HotkeyContext);

  useEffect(() => {
    // Prefer the context provider if it exists
    if (context) {
      context.registerHotkeys(hotkeys, options);
      return () => {
        context.unregisterHotkeys(hotkeys, options);
      };
    }

    // Fallback to original implementation if not inside a provider
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      // If the hook is disabled, do nothing.
      if (options.enabled === false) {
        return;
      }
      hotkeys.forEach(([hotkeyStr, callback]) => {
        const keys = hotkeyStr.split("+");
        const mainKey = keys.pop()?.toLowerCase();
        if (!mainKey) return;

        const requiredKeys = keys.map((k) => k.toLowerCase());

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        const modifiersMatch =
          requiredKeys.includes("ctrl") === ctrlPressed &&
          requiredKeys.includes("cmd") === ctrlPressed &&
          requiredKeys.includes("shift") === shiftPressed &&
          requiredKeys.includes("alt") === altPressed;

        if (event.key.toLowerCase() === mainKey && modifiersMatch) {
          event.preventDefault();
          callback(event);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hotkeys, options, context]);
}; 