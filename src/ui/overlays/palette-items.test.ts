import { describe, it, expect } from 'vitest';
import { buildPaletteItems, filterPaletteItems } from './palette-items.ts';
import type { UtilityNodeEntry } from '../../store/slices/palette-slice.ts';
import { nodeRegistry } from '../../engine/nodes/registry.ts';

function makeUtilityEntry(utilityId: string, title: string): UtilityNodeEntry {
  return {
    utilityId,
    title,
    inputCount: 1,
    outputCount: 1,
    bakeMetadata: { topoOrder: [], nodeConfigs: [], edges: [], inputCount: 1, outputCount: 1 },
    board: { id: utilityId, nodes: new Map(), wires: [] },
    versionHash: 'v1',
  };
}

describe('buildPaletteItems', () => {
  const fundamentalCount = nodeRegistry.all.length;

  it('includes all fundamentals plus custom-blank when no allowedNodes', () => {
    const items = buildPaletteItems(null, new Map());
    // fundamentals + 1 custom-blank
    expect(items.length).toBe(fundamentalCount + 1);
    const fundamentals = items.filter((i) => i.section === 'fundamental');
    expect(fundamentals.length).toBe(fundamentalCount + 1);
    const customBlank = items.find((i) => i.id === 'custom-blank');
    expect(customBlank).toBeTruthy();
    expect(customBlank!.section).toBe('fundamental');
    expect(customBlank!.category).toBe('custom');
  });

  it('excludes custom-blank when custom is not in allowedNodes', () => {
    const items = buildPaletteItems(['inverter'], new Map());
    // 1 fundamental only (no custom-blank since 'custom' not in allowedNodes)
    expect(items.length).toBe(1);
    expect(items[0].nodeType).toBe('inverter');
    expect(items.find((i) => i.id === 'custom-blank')).toBeUndefined();
  });

  it('includes custom-blank and utility nodes when custom is in allowedNodes', () => {
    const utilities = new Map([['u1', makeUtilityEntry('u1', 'My Filter')]]);
    const items = buildPaletteItems(['inverter', 'custom'], utilities);
    // 1 fundamental + 1 custom-blank + 1 utility
    expect(items.length).toBe(3);
    expect(items[0].nodeType).toBe('inverter');
    expect(items[1].id).toBe('custom-blank');
    expect(items[2].section).toBe('utility');
  });

  it('excludes utility nodes when custom is not in allowedNodes', () => {
    const utilities = new Map([['u1', makeUtilityEntry('u1', 'My Filter')]]);
    const items = buildPaletteItems(['inverter'], utilities);
    const utilityItems = items.filter((i) => i.section === 'utility');
    expect(utilityItems.length).toBe(0);
  });

  it('returns empty when allowedNodes is empty array', () => {
    const utilities = new Map([['u1', makeUtilityEntry('u1', 'My Filter')]]);
    const items = buildPaletteItems([], utilities);
    // Nothing allowed
    expect(items.length).toBe(0);
  });

  it('does not include utility section when no named utility nodes exist', () => {
    const items = buildPaletteItems(null, new Map());
    const utilityItems = items.filter((i) => i.section === 'utility');
    expect(utilityItems.length).toBe(0);
  });
});

describe('filterPaletteItems', () => {
  const items = buildPaletteItems(null, new Map());

  it('returns all items when query is empty', () => {
    // fundamentals + custom-blank
    expect(filterPaletteItems(items, '').length).toBe(nodeRegistry.all.length + 1);
    expect(filterPaletteItems(items, '  ').length).toBe(nodeRegistry.all.length + 1);
  });

  it('filters by case-insensitive substring', () => {
    const filtered = filterPaletteItems(items, 'inv');
    expect(filtered.length).toBe(1);
    expect(filtered[0].label).toBe('Inverter');
  });

  it('returns no results for non-matching query', () => {
    expect(filterPaletteItems(items, 'zzz').length).toBe(0);
  });
});
