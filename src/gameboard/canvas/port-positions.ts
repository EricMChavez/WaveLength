import type { NodeState, Vec2 } from '../../shared/types/index.ts';
import { NODE_CONFIG, CONNECTION_POINT_CONFIG } from '../../shared/constants/index.ts';

/**
 * Compute the pixel position of a port on a node.
 * Input ports are on the left edge, output ports on the right edge.
 * Ports are spaced evenly along the node height.
 */
export function getNodePortPosition(
  node: NodeState,
  side: 'input' | 'output',
  portIndex: number,
): Vec2 {
  const count = side === 'input' ? node.inputCount : node.outputCount;
  const spacing = NODE_CONFIG.HEIGHT / (count + 1);
  const x = side === 'input'
    ? node.position.x
    : node.position.x + NODE_CONFIG.WIDTH;
  const y = node.position.y + spacing * (portIndex + 1);
  return { x, y };
}

/**
 * Compute the pixel position of a gameboard connection point.
 * Input connection points are on the left edge, outputs on the right edge.
 * Spaced evenly along the canvas height.
 */
export function getConnectionPointPosition(
  side: 'input' | 'output',
  index: number,
  canvasWidth: number,
  canvasHeight: number,
): Vec2 {
  const count = side === 'input'
    ? CONNECTION_POINT_CONFIG.INPUT_COUNT
    : CONNECTION_POINT_CONFIG.OUTPUT_COUNT;
  const spacing = canvasHeight / (count + 1);
  const x = side === 'input'
    ? CONNECTION_POINT_CONFIG.MARGIN_X
    : canvasWidth - CONNECTION_POINT_CONFIG.MARGIN_X;
  const y = spacing * (index + 1);
  return { x, y };
}
