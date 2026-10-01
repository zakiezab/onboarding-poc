// Simple top-down tree layout: no auto-layout library beyond @xyflow/react
// itself (which doesn't ship one) — this is a hand-rolled "leaf counting"
// layout, standard and sufficient for a strict tree with a few hundred
// nodes. Not as compact as Reingold–Tilford, but it never overlaps and is
// easy to reason about.

export type LayoutInput = {
  id: string;
  parentId: string | null;
};

export type LayoutResult = Record<string, { x: number; y: number; depth: number }>;

const NODE_WIDTH = 220;
const NODE_GAP = 32;
const ROW_HEIGHT = 170;

export function layoutTree(nodes: LayoutInput[], rootId: string): LayoutResult {
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parentId == null) continue;
    const list = children.get(n.parentId) ?? [];
    list.push(n.id);
    children.set(n.parentId, list);
  }

  const result: LayoutResult = {};
  let nextLeafX = 0;

  // Returns the x-center assigned to `id`.
  function place(id: string, depth: number): number {
    const kids = children.get(id) ?? [];
    let x: number;
    if (kids.length === 0) {
      x = nextLeafX;
      nextLeafX += NODE_WIDTH + NODE_GAP;
    } else {
      const childXs = kids.map((childId) => place(childId, depth + 1));
      x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    }
    result[id] = { x, y: depth * ROW_HEIGHT, depth };
    return x;
  }

  place(rootId, 0);
  return result;
}

export { NODE_WIDTH, NODE_GAP, ROW_HEIGHT };
