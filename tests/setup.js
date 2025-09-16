// Vitest setup file
import { vi } from 'vitest';

// Mock window.widgetId for tests
global.window.widgetId = 'test-widget-id';

// Mock window._pluginWidgetSettings
global.window._pluginWidgetSettings = {};

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});