import { describe, it, expect, afterEach, vi } from 'vitest';
import { Widget } from '../src/Widget';

describe('Widget Tests', () => {
  const lastWindow = window;
  const setUp = () => {
    const widget = new Widget();
    return widget;
  };

  afterEach(() => {
    global.window = lastWindow;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('The widget should receive the widget settings through a specific variable in the window and get accessed through the interface', () => {
    window._pluginWidgetSettings = {
      keyTest: 'Test',
    };
    const widget = setUp();
    const settings = widget.getSettings();

    expect(settings.keyTest).toBe('Test');
  });

  it('The widget should receive the widget id through the constructor and get accessed through the interface', () => {
    const widget = new Widget('testId');
    const id = widget.getId();

    expect(id).toBe('testId');
  });

  it('should handle undefined widget settings gracefully', () => {
    delete window._pluginWidgetSettings;
    const widget = setUp();
    const settings = widget.getSettings();

    expect(settings).toEqual({});
  });

  it('should return undefined id when not provided', () => {
    const widget = setUp();
    const id = widget.getId();

    expect(id).toBeUndefined();
  });
});