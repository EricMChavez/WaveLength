/** Unique identifier for a node instance */
export type NodeId = string;

/** Unique identifier for a gameboard */
export type GameboardId = string;

/** 2D position vector */
export interface Vec2 {
  x: number;
  y: number;
}

/** Reference to a specific port on a node */
export interface PortRef {
  nodeId: NodeId;
  portIndex: number;
  side: 'input' | 'output';
}

/** A signal value in transit on a wire */
export interface Signal {
  value: number;
  ticksRemaining: number;
}

/** A wire connecting two ports, carrying signal state */
export interface Wire {
  id: string;
  from: PortRef;
  to: PortRef;
  /** WTS delay in subdivisions (0-16) */
  wtsDelay: number;
  /** In-flight signals (wire state doubles as animation state) */
  signals: Signal[];
}

/** The type of a fundamental node */
export type FundamentalNodeType =
  | 'multiply'
  | 'mix'
  | 'invert'
  | 'threshold'
  | 'delay';

/** State of a single node on a gameboard */
export interface NodeState {
  id: NodeId;
  type: string;
  position: Vec2;
  params: Record<string, number | string>;
  /** Number of input ports */
  inputCount: number;
  /** Number of output ports */
  outputCount: number;
}

/** Complete state of a gameboard */
export interface GameboardState {
  id: GameboardId;
  nodes: Map<NodeId, NodeState>;
  wires: Wire[];
}
