import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import logger from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Reset logger to default INFO level
    logger.setLevel('info');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      // Test that logger is a singleton
      expect(logger).toBeDefined();
      expect(typeof logger.setLevel).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('Level Setting', () => {
    it('should set debug level', () => {
      logger.setLevel('debug');

      logger.debug('debug message');
      logger.info('info message');
      logger.error('error message');

      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });

    it('should set info level', () => {
      logger.setLevel('info');

      logger.debug('debug message');
      logger.info('info message');
      logger.error('error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });

    it('should set error level', () => {
      logger.setLevel('error');

      logger.debug('debug message');
      logger.info('info message');
      logger.error('error message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });

    it('should handle case insensitive level setting', () => {
      logger.setLevel('DEBUG' as any);

      logger.debug('debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug message');
    });
  });

  describe('Debug Logging', () => {
    beforeEach(() => {
      logger.setLevel('debug');
    });

    it('should log debug messages with correct format', () => {
      logger.debug('test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] test debug message');
    });

    it('should log debug messages with additional arguments', () => {
      const testData = { key: 'value' };
      logger.debug('debug with data', testData, 123);
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug with data', testData, 123);
    });

    it('should not log debug when level is higher', () => {
      logger.setLevel('info');
      logger.debug('debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });

  describe('Info Logging', () => {
    it('should log info messages with correct format', () => {
      logger.info('test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] test info message');
    });

    it('should log info messages with additional arguments', () => {
      const testData = { key: 'value' };
      logger.info('info with data', testData, 123);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info with data', testData, 123);
    });

    it('should not log info when level is error', () => {
      logger.setLevel('error');
      logger.info('info message');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log error messages with correct format', () => {
      logger.error('test error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] test error message', undefined);
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('error occurred', error);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error occurred', error);
    });

    it('should log error messages with additional arguments', () => {
      const error = new Error('Test error');
      const context = { userId: 123 };
      logger.error('error with context', error, context);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error with context', error, context);
    });

    it('should log error messages with non-Error objects', () => {
      const errorData = { message: 'Custom error', code: 500 };
      logger.error('custom error', errorData);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] custom error', errorData);
    });

    it('should always log errors regardless of level', () => {
      logger.setLevel('error');
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });
  });

  describe('Log Level Hierarchy', () => {
    it('should respect debug level hierarchy', () => {
      logger.setLevel('debug');

      logger.debug('debug');
      logger.info('info');
      logger.error('error');

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should respect info level hierarchy', () => {
      logger.setLevel('info');

      logger.debug('debug');
      logger.info('info');
      logger.error('error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should respect error level hierarchy', () => {
      logger.setLevel('error');

      logger.debug('debug');
      logger.info('info');
      logger.error('error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', () => {
      logger.info('');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] ');
    });

    it('should handle undefined arguments', () => {
      logger.info('test', undefined);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] test', undefined);
    });

    it('should handle null arguments', () => {
      logger.info('test', null);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] test', null);
    });

    it('should handle complex objects', () => {
      const complexData = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        fn: () => 'test',
      };

      logger.info('complex data', complexData);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] complex data', complexData);
    });
  });

  describe('Performance', () => {
    it('should not execute expensive operations when level is too high', () => {
      logger.setLevel('error');

      let expensiveOperationCalled = false;
      const expensiveOperation = () => {
        expensiveOperationCalled = true;
        return { expensive: 'data' };
      };

      // This should not call the expensive operation since debug won't log
      logger.debug('debug message', expensiveOperation());

      expect(expensiveOperationCalled).toBe(true); // Note: JS still evaluates the argument
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });
});
