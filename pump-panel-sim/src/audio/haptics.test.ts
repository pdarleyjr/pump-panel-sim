import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { vibrate, vibrateClick, vibrateValve, rumble, rumbleClick, rumbleValve } from './haptics';

describe('vibrate', () => {
  beforeEach(() => {
    // Mock navigator.vibrate
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call navigator.vibrate with number parameter', () => {
    vibrate(100);
    expect(navigator.vibrate).toHaveBeenCalledWith(100);
  });

  it('should call navigator.vibrate with pattern array', () => {
    vibrate([50, 100, 50]);
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 100, 50]);
  });

  it('should not throw when navigator.vibrate is not supported', () => {
    vi.stubGlobal('navigator', {});
    expect(() => vibrate(100)).not.toThrow();
  });
});

describe('vibrateClick', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call vibrate with click pattern', () => {
    vibrateClick();
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 20, 10]);
  });
});

describe('vibrateValve', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call vibrate with valve pattern', () => {
    vibrateValve();
    expect(navigator.vibrate).toHaveBeenCalledWith([30, 50, 30]);
  });
});

describe('rumble', () => {
  beforeEach(() => {
    const mockActuator = {
      playEffect: vi.fn().mockResolvedValue(undefined),
    };
    const mockGamepad = {
      hapticActuators: [mockActuator],
    };
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => [mockGamepad]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call actuator.playEffect with default parameters', () => {
    rumble();
    const gamepad = navigator.getGamepads?.()[0];
    const actuator = (gamepad as any)?.hapticActuators?.[0];
    expect(actuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
      duration: 120,
      strongMagnitude: 0.8,
      weakMagnitude: 0.4
    });
  });

  it('should call actuator.playEffect with custom parameters', () => {
    rumble(0.5, 200);
    const gamepad = navigator.getGamepads?.()[0];
    const actuator = (gamepad as any)?.hapticActuators?.[0];
    expect(actuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
      duration: 200,
      strongMagnitude: 0.5,
      weakMagnitude: 0.25
    });
  });

  it('should not throw when gamepad is not available', () => {
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => [null]),
    });
    expect(() => rumble()).not.toThrow();
  });

  it('should not throw when getGamepads is not supported', () => {
    vi.stubGlobal('navigator', {});
    expect(() => rumble()).not.toThrow();
  });

  it('should not throw when hapticActuators is not available', () => {
    const mockGamepad = {};
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => [mockGamepad]),
    });
    expect(() => rumble()).not.toThrow();
  });
});

describe('rumbleClick', () => {
  beforeEach(() => {
    const mockActuator = {
      playEffect: vi.fn().mockResolvedValue(undefined),
    };
    const mockGamepad = {
      hapticActuators: [mockActuator],
    };
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => [mockGamepad]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call rumble with click parameters', () => {
    rumbleClick();
    const gamepad = navigator.getGamepads?.()[0];
    const actuator = (gamepad as any)?.hapticActuators?.[0];
    expect(actuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
      duration: 80,
      strongMagnitude: 0.4,
      weakMagnitude: 0.2
    });
  });
});

describe('rumbleValve', () => {
  beforeEach(() => {
    const mockActuator = {
      playEffect: vi.fn().mockResolvedValue(undefined),
    };
    const mockGamepad = {
      hapticActuators: [mockActuator],
    };
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => [mockGamepad]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call rumble with valve parameters', () => {
    rumbleValve();
    const gamepad = navigator.getGamepads?.()[0];
    const actuator = (gamepad as any)?.hapticActuators?.[0];
    expect(actuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
      duration: 150,
      strongMagnitude: 0.8,
      weakMagnitude: 0.4
    });
  });
});