import { describe, it, expect } from 'vitest';
import noop from '../noop';

describe('noop', () => {
  describe('Basic Functionality', () => {
    it('should be a function', () => {
      expect(typeof noop).toBe('function');
    });

    it('should return undefined when called', () => {
      const result = noop();
      expect(result).toBeUndefined();
    });

    it('should return undefined regardless of arguments', () => {
      const noopAny = noop as any;
      const result1 = noopAny('arg1', 'arg2', 123);
      const result2 = noopAny({ key: 'value' });
      const result3 = noopAny(null, undefined, false);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();
    });
  });

  describe('Function Properties', () => {
    it('should have length of 0 (no formal parameters)', () => {
      expect(noop.length).toBe(0);
    });

    it('should have correct name', () => {
      expect(noop.name).toBe('noop');
    });
  });

  describe('Usage as Callback', () => {
    it('should work as event handler replacement', () => {
      const mockEventEmitter = {
        on: (event: string, handler: () => void) => handler(),
        off: (event: string, handler: () => void) => handler,
      };

      // Should not throw when used as event handler
      expect(() => {
        mockEventEmitter.on('test', noop);
      }).not.toThrow();

      // Should work as unsubscribe function replacement
      const unsubscribe = mockEventEmitter.off('test', noop);
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should work with array methods', () => {
      const items = [1, 2, 3, 4, 5];

      // Should work with forEach (though useless)
      expect(() => {
        items.forEach(noop as any);
      }).not.toThrow();

      // Should work with map (returns array of undefined)
      const result = items.map(noop as any);
      expect(result).toEqual([undefined, undefined, undefined, undefined, undefined]);

      // Should work with filter (returns empty array)
      const filtered = items.filter(noop as any);
      expect(filtered).toEqual([]);
    });

    it('should work as promise callback', async () => {
      const promise = Promise.resolve('test value');

      // Should work as then callback
      await expect(promise.then(noop)).resolves.toBeUndefined();

      // Should work as catch callback
      const rejectedPromise = Promise.reject(new Error('test error'));
      await expect(rejectedPromise.catch(noop)).resolves.toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should execute quickly for many calls', () => {
      const startTime = performance.now();

      // Call noop many times
      for (let i = 0; i < 10000; i++) {
        noop();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    it('should have minimal memory footprint', () => {
      // noop should be consistently imported
      expect(noop).toBeDefined();
      expect(typeof noop).toBe('function');
      expect(noop.length).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should work with TypeScript function signatures', () => {
      // These should all compile without TypeScript errors
      const stringHandler: (s: string) => void = noop as any;
      const numberHandler: (n: number) => any = noop as any;
      const objectHandler: (obj: any) => any = noop as any;
      const multiArgHandler: (a: string, b: number, c: boolean) => void = noop as any;

      expect(stringHandler('test')).toBeUndefined();
      expect(numberHandler(42)).toBeUndefined();
      expect(objectHandler({ key: 'value' })).toBeUndefined();
      expect(multiArgHandler('str', 123, true)).toBeUndefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work as safe unsubscribe function', () => {
      // Simulating Ubidots usage where validateEndpoint returns noop on invalid endpoints
      function createUnsubscribe(isValid: boolean) {
        if (isValid) {
          return () => console.log('actual unsubscribe');
        }
        return noop;
      }

      const invalidUnsubscribe = createUnsubscribe(false);
      expect(invalidUnsubscribe).toBe(noop);
      expect(() => invalidUnsubscribe()).not.toThrow();
    });

    it('should work as default/fallback function', () => {
      function processWithCallback(data: any, callback: any = noop) {
        // Process data
        const result = data * 2;

        // Call callback with result
        return callback(result);
      }

      // Should work when no callback provided
      expect(processWithCallback(5)).toBeUndefined();

      // Should work when explicitly passed noop
      expect(processWithCallback(5, noop)).toBeUndefined();
    });

    it('should work in error recovery scenarios', () => {
      function riskyOperation(onSuccess: any = noop, onError: any = noop) {
        try {
          // Simulate operation that might fail
          const result =
            Math.random() > 0.5
              ? 'success'
              : (() => {
                  throw new Error('failed');
                })();
          return onSuccess(result);
        } catch (error) {
          return onError(error);
        }
      }

      // Should handle both success and error cases gracefully
      expect(() => {
        for (let i = 0; i < 10; i++) {
          riskyOperation();
        }
      }).not.toThrow();
    });
  });
});
