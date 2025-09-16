import { describe, it, expect, afterEach, vi } from 'vitest';
import { Widget } from '../src/Widget';
import type { WidgetSettings } from '../src/types';

describe('Widget Tests', () => {
  const lastWindow = window;
  const setUp = (id?: string): Widget => {
    return new Widget(id);
  };

  afterEach(() => {
    global.window = lastWindow;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should receive widget settings through window variable and access them through interface', () => {
    const testSettings: WidgetSettings = {
      keyTest: 'Test',
    };
    window._pluginWidgetSettings = testSettings;

    const widget = setUp();
    const settings = widget.getSettings();

    expect(settings.keyTest).toBe('Test');
  });

  it('should receive widget id through constructor and access it through interface', () => {
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

  it('should return undefined id when not provided and window.widgetId is undefined', () => {
    delete window.widgetId;
    const widget = setUp();
    const id = widget.getId();

    expect(id).toBeUndefined();
  });

  it('should use window.widgetId when no id provided in constructor', () => {
    window.widgetId = 'window-widget-id';
    const widget = setUp();

    expect(widget.getId()).toBe('window-widget-id');
  });

  describe('#updateSettings', () => {
    it('should merge new settings with existing ones', () => {
      window._pluginWidgetSettings = { existing: 'value' };
      const widget = setUp();

      widget.updateSettings({ new: 'setting' });
      const settings = widget.getSettings();

      expect(settings).toEqual({ existing: 'value', new: 'setting' });
    });

    it('should override existing settings', () => {
      window._pluginWidgetSettings = { key: 'old' };
      const widget = setUp();

      widget.updateSettings({ key: 'new' });
      const settings = widget.getSettings();

      expect(settings.key).toBe('new');
    });
  });

  describe('#getSetting', () => {
    it('should return specific setting value', () => {
      window._pluginWidgetSettings = { theme: 'dark', count: 42 };
      const widget = setUp();

      expect(widget.getSetting('theme')).toBe('dark');
      expect(widget.getSetting('count')).toBe(42);
      expect(widget.getSetting('nonexistent')).toBeUndefined();
    });

    it('should support type parameter', () => {
      window._pluginWidgetSettings = { count: 42 };
      const widget = setUp();

      const count = widget.getSetting<number>('count');
      expect(count).toBe(42);
    });
  });

  describe('#setSetting', () => {
    it('should set individual setting', () => {
      const widget = setUp();

      widget.setSetting('newKey', 'newValue');

      expect(widget.getSetting('newKey')).toBe('newValue');
    });
  });

  describe('#hasSetting', () => {
    it('should check if setting exists', () => {
      window._pluginWidgetSettings = { existing: 'value' };
      const widget = setUp();

      expect(widget.hasSetting('existing')).toBe(true);
      expect(widget.hasSetting('nonexistent')).toBe(false);
    });
  });

  describe('#removeSetting', () => {
    it('should remove setting', () => {
      window._pluginWidgetSettings = { toRemove: 'value', toKeep: 'value' };
      const widget = setUp();

      widget.removeSetting('toRemove');

      expect(widget.hasSetting('toRemove')).toBe(false);
      expect(widget.hasSetting('toKeep')).toBe(true);
    });
  });

  describe('#getSettingKeys', () => {
    it('should return all setting keys', () => {
      window._pluginWidgetSettings = { key1: 'value1', key2: 'value2' };
      const widget = setUp();

      const keys = widget.getSettingKeys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });
  });

  describe('#clearSettings', () => {
    it('should clear all settings', () => {
      window._pluginWidgetSettings = { key1: 'value1', key2: 'value2' };
      const widget = setUp();

      widget.clearSettings();
      const settings = widget.getSettings();

      expect(settings).toEqual({});
      expect(widget.getSettingKeys()).toHaveLength(0);
    });
  });

  describe('#toJSON', () => {
    it('should return serializable widget state', () => {
      window._pluginWidgetSettings = { config: 'test' };
      const widget = new Widget('test-id');

      const json = widget.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        settings: { config: 'test' }
      });
    });

    it('should return copy of settings not reference', () => {
      window._pluginWidgetSettings = { config: 'test' };
      const widget = setUp();

      const json = widget.toJSON();
      json.settings.newKey = 'newValue';

      expect(widget.getSetting('newKey')).toBeUndefined();
    });
  });
});