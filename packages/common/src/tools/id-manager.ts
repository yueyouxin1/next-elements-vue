/**
 * A production-ready ID manager for tree nodes.
 *
 * Features:
 * - Optional bucket by node type (typeKey) to keep independent ID sequences.
 * - Initialize from a node tree: collect existing IDs and assign missing ones.
 * - Fast allocation & reuse via per-bucket min-heap (available IDs) + maxId tracker.
 * - Safe release/remove subtree.
 *
 * Default ID rule: positive integers (1,2,3...). 0 is reserved internally.
 */

export interface IdManagerNode {
  children?: IdManagerNode[];
}

export type IdManagerDuplicatePolicy = 'throw' | 'keepFirst' | 'reassign';

export interface IdManagerOptions {
  /**
   * Node field name for bucket type. If omitted, all nodes use the "default" bucket.
   */
  typeKey?: string;
  /**
   * Node field name for id.
   */
  idKey?: string;
  /**
   * Validate whether an id is acceptable. Default: positive integer.
   */
  validateId?: (id: unknown) => boolean;
  /**
   * Duplicate handling policy.
   * - throw: error on duplicate ids
   * - keepFirst: keep the first seen, later duplicates treated as missing (reassigned if needed)
   * - reassign: reassign duplicates immediately during init()
   */
  onDuplicate?: IdManagerDuplicatePolicy;
}

export interface IdManagerInitOptions {
  /**
   * Whether to mutate original nodes. If false, will deep-clone nodes.
   */
  mutate?: boolean;
  /**
   * If true, invalid ids cause errors instead of being treated as missing.
   */
  strict?: boolean;
}

export interface IdManagerAssignTreeOptions {
  /**
   * If true, reassign even if node already has a valid id.
   */
  force?: boolean;
}

type AssignCallback = (id: number, node: IdManagerNode) => void;

class MinHeap {
  private data: number[];

  constructor() {
    this.data = [];
  }

  size(): number { return this.data.length; }

  peek(): number | undefined { return this.data[0]; }

  push(x: number): void {
    const a = this.data;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      const parent = a[p]!;
      const current = a[i]!;
      if (parent <= current) break;
      a[p] = current;
      a[i] = parent;
      i = p;
    }
  }

  pop(): number | undefined {
    const a = this.data;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0 && last !== undefined) {
      a[0] = last;
      // sift down
      let i = 0;
      while (true) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l]! < a[m]!) m = l;
        if (r < a.length && a[r]! < a[m]!) m = r;
        if (m === i) break;
        const current = a[i]!;
        const next = a[m]!;
        a[i] = next;
        a[m] = current;
        i = m;
      }
    }
    return top;
  }
}

export default class IdManager {
  private typeKey?: string;
  private idKey: string;
  private validateId: (id: unknown) => boolean;
  private onDuplicate: IdManagerDuplicatePolicy;
  private used: Map<string, Set<number>>;
  private free: Map<string, MinHeap>;
  private maxId: Map<string, number>;

  constructor(options: IdManagerOptions = {}) {
    const {
      typeKey,
      idKey = 'key',
      validateId = (id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0,
      onDuplicate = 'throw',
    } = options;

    this.typeKey = typeKey;
    this.idKey = idKey;
    this.validateId = validateId;
    this.onDuplicate = onDuplicate;

    this.used = new Map();
    this.free = new Map();
    this.maxId = new Map();

    this.reset();
  }
  
    /** Reset internal state. */
  reset(): void {
    this.used.clear();
    this.free.clear();
    this.maxId.clear();
    this._ensureBucket('default');
  }
  
    /** @private */
  _bucketOf(node: IdManagerNode): string {
    const typeKey = this.typeKey;
    if (!typeKey) return 'default';
    const t = (node as Record<string, unknown>)[typeKey];
    return (t === undefined || t === null || t === '') ? 'default' : String(t);
  }
  
    /** @private */
  _ensureBucket(bucket: string): void {
    if (!this.used.has(bucket)) this.used.set(bucket, new Set());
    if (!this.free.has(bucket)) this.free.set(bucket, new MinHeap());
    if (!this.maxId.has(bucket)) this.maxId.set(bucket, 0);
  }

  /** @private */
  _getUsedSet(bucket: string): Set<number> {
    this._ensureBucket(bucket);
    return this.used.get(bucket) as Set<number>;
  }

  /** @private */
  _getFreeHeap(bucket: string): MinHeap {
    this._ensureBucket(bucket);
    return this.free.get(bucket) as MinHeap;
  }

  /** @private */
  _getMaxId(bucket: string): number {
    this._ensureBucket(bucket);
    return this.maxId.get(bucket) ?? 0;
  }
  
    /**
     * Initialize from a tree, collecting existing ids and assigning missing ones.
     * @param {Array<any>} nodes
     * @param {Object} [opts]
     * @param {boolean} [opts.mutate=true] - Whether to mutate original nodes. If false, will deep-clone nodes.
     * @param {boolean} [opts.strict=false] - If true, invalid ids cause errors instead of being treated as missing.
     * @returns {Array<any>} - The initialized node tree (same reference if mutate=true).
     */
  init(nodes: IdManagerNode[], opts: IdManagerInitOptions = {}): IdManagerNode[] {
    const { mutate = true, strict = false } = opts;
    if (!Array.isArray(nodes)) throw new TypeError('init(nodes): nodes must be an array');

    const tree = mutate ? nodes : (structuredClone(nodes) as IdManagerNode[]);

    this.reset();

    // First pass: collect existing ids, resolve duplicates per policy
    this._collectExistingIds(tree, { strict });

    // Build free pools (missing ids within [1..maxId])
    this._buildFreePools();

    // Second pass: assign missing ids
    this._assignMissingIds(tree);

    return tree;
  }
  
    /** @private */
  _collectExistingIds(nodes: IdManagerNode[], { strict }: { strict: boolean }): void {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;

      const bucket = this._bucketOf(node);
      this._ensureBucket(bucket);

      const record = node as Record<string, unknown>;
      const rawId = record[this.idKey];

      if (rawId !== undefined && rawId !== null) {
        const ok = this.validateId(rawId);
        if (!ok) {
          if (strict) {
            throw new Error(`Invalid id "${rawId}" on node. key="${this.idKey}", bucket="${bucket}"`);
          }
          // treat as missing
          record[this.idKey] = null;
        } else {
          const id = Number(rawId);
          const usedSet = this._getUsedSet(bucket);

          if (usedSet.has(id)) {
            // duplicate
            if (this.onDuplicate === 'throw') {
              throw new Error(`Duplicate id "${id}" in bucket "${bucket}"`);
            }
            if (this.onDuplicate === 'keepFirst') {
              record[this.idKey] = null; // mark as missing; assign later
            }
            if (this.onDuplicate === 'reassign') {
              record[this.idKey] = null; // mark missing now, assign later
            }
          } else {
            usedSet.add(id);
            const curMax = this._getMaxId(bucket);
            if (id > curMax) this.maxId.set(bucket, id);
          }
        }
      }

      const children = node.children;
      if (Array.isArray(children) && children.length) {
        this._collectExistingIds(children, { strict });
      }
    }
  }
  
    /** @private */
  _buildFreePools(): void {
    for (const [bucket, usedSet] of this.used.entries()) {
      this._ensureBucket(bucket);

      // Clear heap by replacing
      this.free.set(bucket, new MinHeap());
      const freshHeap = this._getFreeHeap(bucket);

      const max = this._getMaxId(bucket);
      for (let i = 1; i <= max; i++) {
        if (!usedSet.has(i)) freshHeap.push(i);
      }
    }
  }
  
    /** @private */
  _assignMissingIds(nodes: IdManagerNode[]): void {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;

      const rawId = (node as Record<string, unknown>)[this.idKey];
      if (rawId === undefined || rawId === null) {
        this.assign(node);
      }

      const children = node.children;
      if (Array.isArray(children) && children.length) {
        this._assignMissingIds(children);
      }
    }
  }
  
    /**
     * Allocate a new id in a bucket.
     * @param {string} [bucket='default']
     * @returns {number}
     */
  allocate(bucket = 'default'): number {
    this._ensureBucket(bucket);

    const usedSet = this._getUsedSet(bucket);
    const heap = this._getFreeHeap(bucket);

    // Prefer smallest freed id
    if (heap.size() > 0) {
      const id = heap.pop();
      if (id === undefined) return this.allocate(bucket);
      usedSet.add(id);
      return id;
    }

    // Otherwise grow sequence
    const next = this._getMaxId(bucket) + 1;
    this.maxId.set(bucket, next);
    usedSet.add(next);
    return next;
  }
  
    /**
     * Release an id back to free pool (no-op if id not used).
     * @param {number} id
     * @param {string} [bucket='default']
     */
  release(id: number, bucket = 'default'): void {
    if (!this.validateId(id)) return;
    this._ensureBucket(bucket);

    const usedSet = this._getUsedSet(bucket);
    if (!usedSet.has(id)) return;

    usedSet.delete(id);
    this._getFreeHeap(bucket).push(id);
  }
  
    /**
     * Assign an id to a single node (non-recursive).
     * @param {any} node
     * @param {(id:number, node:any)=>void} [callback]
     * @returns {number}
     */
  assign(node: IdManagerNode, callback?: AssignCallback): number {
    if (!node || typeof node !== 'object') {
      throw new TypeError('assign(node): node must be an object');
    }
    const bucket = this._bucketOf(node);
    const id = this.allocate(bucket);
    (node as Record<string, unknown>)[this.idKey] = id;
    if (typeof callback === 'function') callback(id, node);
    return id;
  }
  
    /**
     * Recursively assign ids to node and its subtree (overwrites missing only by default).
     * @param {any} node
     * @param {Object} [opts]
     * @param {boolean} [opts.force=false] - If true, reassign even if node already has a valid id.
     * @param {(id:number, node:any)=>void} [callback]
     */
  assignTree(node: IdManagerNode, callback?: AssignCallback): void;
  assignTree(node: IdManagerNode, opts?: IdManagerAssignTreeOptions, callback?: AssignCallback): void;
  assignTree(
    node: IdManagerNode,
    opts: IdManagerAssignTreeOptions | AssignCallback = {},
    callback?: AssignCallback,
  ): void {
    const resolvedOpts = typeof opts === 'function' ? {} : opts;
    const resolvedCallback = typeof opts === 'function' ? opts : callback;
    const { force = false } = resolvedOpts;
    if (!node || typeof node !== 'object') return;

    const cur = (node as Record<string, unknown>)[this.idKey];
    const hasValid = (cur !== undefined && cur !== null && this.validateId(cur));

    if (force || !hasValid) {
      // If force and had valid id, release it first to avoid leak.
      if (force && hasValid) this.release(Number(cur), this._bucketOf(node));
      this.assign(node, resolvedCallback);
    }

    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        this.assignTree(child, resolvedOpts, resolvedCallback);
      }
    }
  }
  
    /**
     * Remove a subtree: release ids for node and all descendants.
     * (Does not modify parent references; you remove it from the tree yourself.)
     * @param {any} node
     */
  removeSubtree(node: IdManagerNode): void {
    if (!node || typeof node !== 'object') return;

    const bucket = this._bucketOf(node);
    const id = (node as Record<string, unknown>)[this.idKey];
    if (id !== undefined && id !== null && this.validateId(id)) {
      this.release(Number(id), bucket);
    }

    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) this.removeSubtree(child);
    }
  }
  
    /**
     * Check if an id is currently used in a bucket.
     * @param {number} id
     * @param {string} [bucket='default']
     */
  isUsed(id: number, bucket = 'default'): boolean {
    this._ensureBucket(bucket);
    return this._getUsedSet(bucket).has(id);
  }
}
