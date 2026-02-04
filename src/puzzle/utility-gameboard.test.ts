import { describe, it, expect } from 'vitest';
import { createUtilityGameboard } from './utility-gameboard.ts';
import { CONNECTION_POINT_CONFIG } from '../shared/constants/index.ts';
import { isConnectionInputNode, isConnectionOutputNode } from './connection-point-nodes.ts';

describe('createUtilityGameboard', () => {
  it('creates gameboard with 3 input + 3 output CP nodes', () => {
    const board = createUtilityGameboard('test-id');

    const inputCPs = Array.from(board.nodes.values()).filter((n) =>
      isConnectionInputNode(n.id),
    );
    const outputCPs = Array.from(board.nodes.values()).filter((n) =>
      isConnectionOutputNode(n.id),
    );

    expect(inputCPs).toHaveLength(CONNECTION_POINT_CONFIG.INPUT_COUNT);
    expect(outputCPs).toHaveLength(CONNECTION_POINT_CONFIG.OUTPUT_COUNT);
    expect(board.nodes.size).toBe(
      CONNECTION_POINT_CONFIG.INPUT_COUNT + CONNECTION_POINT_CONFIG.OUTPUT_COUNT,
    );
  });

  it('gameboard ID contains utilityId', () => {
    const board = createUtilityGameboard('my-util');
    expect(board.id).toBe('utility-my-util');
  });

  it('has no wires in initial gameboard', () => {
    const board = createUtilityGameboard('test-id');
    expect(board.wires).toEqual([]);
  });

  it('input CPs have 0 inputs and 1 output', () => {
    const board = createUtilityGameboard('test-id');
    const inputCPs = Array.from(board.nodes.values()).filter((n) =>
      isConnectionInputNode(n.id),
    );
    for (const cp of inputCPs) {
      expect(cp.inputCount).toBe(0);
      expect(cp.outputCount).toBe(1);
      expect(cp.type).toBe('connection-input');
    }
  });

  it('output CPs have 1 input and 0 outputs', () => {
    const board = createUtilityGameboard('test-id');
    const outputCPs = Array.from(board.nodes.values()).filter((n) =>
      isConnectionOutputNode(n.id),
    );
    for (const cp of outputCPs) {
      expect(cp.inputCount).toBe(1);
      expect(cp.outputCount).toBe(0);
      expect(cp.type).toBe('connection-output');
    }
  });
});
