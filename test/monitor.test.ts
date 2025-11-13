import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockUrlFetchApp } from './mocks'; // Your global mock setup
import * as JulesApp from '../src/index';

describe('JulesApp Polling Logic', () => {
  // 1. Time Travel Setup
  let fakeNow = 0;
  const realDateNow = Date.now;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Time to "Epoch"
    fakeNow = 1000000;

    // Mock Date.now() to return our controllable time
    Date.now = vi.fn(() => fakeNow);

    // Mock Utilities.sleep to "advance" time instantly
    global.Utilities = {
      sleep: vi.fn((ms: number) => {
        fakeNow += ms;
      })
    } as any;

    JulesApp.setApiKey('test-key');
  });

  afterEach(() => {
    // Restore real Date.now so we don't break other tests
    Date.now = realDateNow;
  });

  /**
   * Helper to mock a sequence of API responses.
   * Call 1 returns [], Call 2 returns [Act1], etc.
   */
  function mockApiSequence(responses: any[]) {
    responses.forEach(res => {
      mockUrlFetchApp.fetch.mockReturnValueOnce({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(res)
      });
    });
  }

  describe('monitor()', () => {
    it('should trigger callback for new activities in order', () => {
      const act1 = { id: '1', createTime: new Date(1000000).toISOString(), description: 'First' };
      const act2 = { id: '2', createTime: new Date(1000005).toISOString(), description: 'Second' };

      // SIMULATION:
      // Poll 1: No activities
      // Poll 2: act1 appears
      // Poll 3: act1 and act2 are present
      mockApiSequence([
        { activities: [] },
        { activities: [act1] },
        { activities: [act1, act2] }
      ]);

      const callback = vi.fn();

      // Run monitor for a short "time" (simulated)
      JulesApp.monitor('sessions/123', (act) => {
        callback(act);
        // Stop after we see the second one
        if (act.id === '2') return true;
      }, { intervalMs: 1000, timeoutMs: 5000 });

      // Assertions
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, act1);
      expect(callback).toHaveBeenNthCalledWith(2, act2);

      // Verify we "slept" (advanced time) between calls
      expect(global.Utilities.sleep).toHaveBeenCalled();
    });

    it('should stop automatically if timeout is reached', () => {
      // Always return empty list
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({ activities: [] })
      });

      const consoleSpy = vi.spyOn(console, 'log');

      // Run with a 5000ms timeout, sleeping 1000ms each loop
      JulesApp.monitor('sessions/123', () => {}, { timeoutMs: 5000, intervalMs: 1000 });

      // Should have polled roughly 5 times then quit
      expect(global.Utilities.sleep).toHaveBeenCalledTimes(5); // 5 loops * 1000ms = 5000ms
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Monitor timed out'));
    });
  });

  describe('waitFor()', () => {
    it('should return the activity when predicate matches', () => {
      const targetAct = {
        id: '99',
        createTime: new Date(1000000).toISOString(),
        planGenerated: { plan: {} }
      };

      // Poll 1: Empty
      // Poll 2: Target appears
      mockApiSequence([
        { activities: [] },
        { activities: [targetAct] }
      ]);

      const result = JulesApp.waitFor('sessions/123', JulesApp.until.planGenerated);

      expect(result).toEqual(targetAct);
    });

    it('should throw an error if timeout is reached', () => {
      mockUrlFetchApp.fetch.mockReturnValue({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({ activities: [] })
      });

      expect(() => {
        JulesApp.waitFor('sessions/123', () => false, 3000);
      }).toThrow('Timed out waiting for condition');
    });
  });
});
