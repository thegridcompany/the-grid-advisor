/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useHotkeys, HotkeyProvider } from './useHotkeys';
import type { Hotkey, HotkeyOptions } from './useHotkeys';

// A simple component to test the hook
const TestComponent: React.FC<{ hotkeys: Hotkey[]; options?: HotkeyOptions }> = ({ hotkeys, options }) => {
  useHotkeys(hotkeys, options);
  return <div>Test Component</div>;
};

describe('useHotkeys hook', () => {
  test('should call callback when hotkey is pressed', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['a', mockCallback]];
    render(<TestComponent hotkeys={hotkeys} />);

    fireEvent.keyDown(window, { key: 'a' });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should not call callback when a different key is pressed', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['a', mockCallback]];
    render(<TestComponent hotkeys={hotkeys} />);

    fireEvent.keyDown(window, { key: 'b' });
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('should handle modifier keys (Shift)', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['Shift+a', mockCallback]];
    render(<TestComponent hotkeys={hotkeys} />);

    fireEvent.keyDown(window, { key: 'A', shiftKey: true });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should not call callback if modifier is required but not pressed', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['Shift+a', mockCallback]];
    render(<TestComponent hotkeys={hotkeys} />);

    fireEvent.keyDown(window, { key: 'a', shiftKey: false });
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('should not call callback if hotkey is disabled', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['a', mockCallback]];
    render(<TestComponent hotkeys={hotkeys} options={{ enabled: false }} />);

    fireEvent.keyDown(window, { key: 'a' });
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('should not call callback when typing in an input field', () => {
    const mockCallback = jest.fn();
    const hotkeys: Hotkey[] = [['a', mockCallback]];
    render(
      <>
        <TestComponent hotkeys={hotkeys} />
        <input type="text" />
      </>
    );

    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'a' });

    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  describe('with HotkeyProvider', () => {
    test('should respect priority', () => {
      const lowPriorityCallback = jest.fn();
      const highPriorityCallback = jest.fn();

      const LowPriorityComponent = () => {
        useHotkeys([['a', lowPriorityCallback]], { priority: 1 });
        return null;
      };

      const HighPriorityComponent = () => {
        useHotkeys([['a', highPriorityCallback]], { priority: 10 });
        return null;
      };

      render(
        <HotkeyProvider>
          <LowPriorityComponent />
          <HighPriorityComponent />
        </HotkeyProvider>
      );

      fireEvent.keyDown(window, { key: 'a' });

      expect(highPriorityCallback).toHaveBeenCalledTimes(1);
      expect(lowPriorityCallback).not.toHaveBeenCalled();
    });
  });
}); 