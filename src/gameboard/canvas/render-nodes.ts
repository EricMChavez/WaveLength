import type { NodeState } from '../../shared/types/index.ts';
import { NODE_CONFIG, COLORS, NODE_TYPE_LABELS } from '../../shared/constants/index.ts';
import { getNodePortPosition } from './port-positions.ts';
import { isConnectionPointNode } from '../../puzzle/connection-point-nodes.ts';
import { useGameStore } from '../../store/index.ts';

/** Draw all nodes on the canvas. */
export function renderNodes(
  ctx: CanvasRenderingContext2D,
  nodes: ReadonlyMap<string, NodeState>,
): void {
  for (const node of nodes.values()) {
    // Virtual CP nodes are drawn as connection point circles, not node boxes
    if (isConnectionPointNode(node.id)) continue;
    drawNodeBody(ctx, node);
    drawNodePorts(ctx, node);
  }
}

function drawNodeBody(ctx: CanvasRenderingContext2D, node: NodeState): void {
  const { x, y } = node.position;
  const { WIDTH, HEIGHT, BORDER_RADIUS } = NODE_CONFIG;

  // Body
  ctx.fillStyle = COLORS.NODE_FILL;
  ctx.strokeStyle = COLORS.NODE_STROKE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, WIDTH, HEIGHT, BORDER_RADIUS);
  ctx.fill();
  ctx.stroke();

  // Label
  ctx.fillStyle = COLORS.NODE_LABEL;
  ctx.font = NODE_CONFIG.LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let label = NODE_TYPE_LABELS[node.type] ?? node.type;
  if (node.type.startsWith('puzzle:')) {
    const puzzleId = node.type.slice('puzzle:'.length);
    const entry = useGameStore.getState().puzzleNodes.get(puzzleId);
    if (entry) label = entry.title;
  } else if (node.type.startsWith('utility:')) {
    const utilityId = node.type.slice('utility:'.length);
    const entry = useGameStore.getState().utilityNodes.get(utilityId);
    if (entry) label = entry.title;
  }
  ctx.fillText(label, x + WIDTH / 2, y + HEIGHT / 2 - 7);

  // Parameter hint
  const paramText = getParamDisplay(node);
  if (paramText) {
    ctx.fillStyle = COLORS.NODE_PARAM;
    ctx.font = NODE_CONFIG.PARAM_FONT;
    ctx.fillText(paramText, x + WIDTH / 2, y + HEIGHT / 2 + 10);
  }

  // Modified indicator — orange dot at top-right when instance hash differs from library
  if (node.libraryVersionHash) {
    let currentHash: string | undefined;
    if (node.type.startsWith('puzzle:')) {
      const puzzleId = node.type.slice('puzzle:'.length);
      currentHash = useGameStore.getState().puzzleNodes.get(puzzleId)?.versionHash;
    } else if (node.type.startsWith('utility:')) {
      const utilityId = node.type.slice('utility:'.length);
      currentHash = useGameStore.getState().utilityNodes.get(utilityId)?.versionHash;
    }
    if (currentHash && currentHash !== node.libraryVersionHash) {
      ctx.fillStyle = '#e8a030';
      ctx.beginPath();
      ctx.arc(x + WIDTH - 4, y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawNodePorts(ctx: CanvasRenderingContext2D, node: NodeState): void {
  const { PORT_RADIUS } = NODE_CONFIG;

  for (let i = 0; i < node.inputCount; i++) {
    const pos = getNodePortPosition(node, 'input', i);
    drawPort(ctx, pos.x, pos.y, PORT_RADIUS);
  }

  for (let i = 0; i < node.outputCount; i++) {
    const pos = getNodePortPosition(node, 'output', i);
    drawPort(ctx, pos.x, pos.y, PORT_RADIUS);
  }
}

function drawPort(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.fillStyle = COLORS.PORT_FILL;
  ctx.strokeStyle = COLORS.PORT_STROKE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** Draw a selection highlight around a node. */
export function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  node: NodeState,
): void {
  const { x, y } = node.position;
  const { WIDTH, HEIGHT, BORDER_RADIUS } = NODE_CONFIG;
  const pad = 3;
  ctx.strokeStyle = '#5a9bf5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, WIDTH + pad * 2, HEIGHT + pad * 2, BORDER_RADIUS + pad);
  ctx.stroke();
}

function getParamDisplay(node: NodeState): string {
  switch (node.type) {
    case 'mix':
      return String(node.params['mode'] ?? 'Add');
    case 'threshold':
      return `thr: ${node.params['threshold'] ?? 0}`;
    case 'delay':
      return `del: ${node.params['subdivisions'] ?? 0}`;
    default:
      return '';
  }
}
