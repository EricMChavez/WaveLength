import type { CycleResults } from '../engine/evaluation/index.ts';

/**
 * Format a number for source output — integers stay integers, floats get rounded.
 */
function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

/**
 * Convert a name string to a kebab-case id.
 */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract 256 output samples for a given output port index from cycle results.
 * Returns an array of 256 numbers (0 for missing data).
 */
export function extractOutputSamples(
  cycleResults: CycleResults,
  portIndex: number,
): number[] {
  const samples: number[] = [];
  for (let cycle = 0; cycle < 256; cycle++) {
    const cycleOutputs = cycleResults.outputValues[cycle];
    if (cycleOutputs && portIndex >= 0 && portIndex < cycleOutputs.length) {
      samples.push(cycleOutputs[portIndex]);
    } else {
      samples.push(0);
    }
  }
  return samples;
}

/**
 * Format a CustomWaveformEntry object literal, ready to paste into custom-waveforms.ts.
 */
export function formatCustomWaveformEntry(name: string, samples: number[]): string {
  const id = nameToId(name);
  const samplesStr = samples.map(formatNum).join(', ');
  return [
    `{`,
    `  id: '${id}',`,
    `  name: '${name.replace(/'/g, "\\'")}',`,
    `  samples: [${samplesStr}],`,
    `},`,
  ].join('\n');
}
