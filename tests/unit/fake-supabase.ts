/**
 * A tiny in-memory stand-in for the supabase-js query builder: just the calls
 * lib/cover-photo.ts and the review actions make (select, eq, is, order, single, update,
 * insert). Records updates; inserted rows get an `id` and land in `tables`.
 */
type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

export interface FakeClient {
  tables: Tables;
  updates: { table: string; values: Row; filters: [string, unknown][] }[];
  from(table: string): Builder;
}

class Builder implements PromiseLike<{ data: unknown; error: null }> {
  private filters: [string, unknown][] = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private one = false;
  private updateValues: Row | null = null;
  private inserted: Row[] | null = null;

  constructor(
    private client: FakeClient,
    private table: string,
  ) {}

  select() {
    return this;
  }
  insert(values: Row | Row[]) {
    const rows = (Array.isArray(values) ? values : [values]).map((row) => ({
      id: `${this.table}-${(this.client.tables[this.table] ?? []).length + 1}`,
      ...row,
    }));
    (this.client.tables[this.table] ??= []).push(...rows);
    this.inserted = rows;
    return this;
  }
  update(values: Row) {
    this.updateValues = values;
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value]);
    return this;
  }
  is(col: string, value: null) {
    this.filters.push([col, value]);
    return this;
  }
  order(col: string, opts: { ascending: boolean }) {
    this.orderBy = { col, ascending: opts.ascending };
    return this;
  }
  single() {
    this.one = true;
    return this;
  }
  maybeSingle() {
    return this.single();
  }

  private matching(): Row[] {
    return (this.client.tables[this.table] ?? []).filter((row) =>
      this.filters.every(([col, value]) => (row[col] ?? null) === value),
    );
  }

  then<R1, R2>(
    onFulfilled?: ((v: { data: unknown; error: null }) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.run()).then(onFulfilled, onRejected);
  }

  private run(): { data: unknown; error: null } {
    if (this.inserted) return { data: this.one ? this.inserted[0] : this.inserted, error: null };
    const rows = this.matching();
    if (this.updateValues) {
      this.client.updates.push({ table: this.table, values: this.updateValues, filters: this.filters });
      for (const row of rows) Object.assign(row, this.updateValues);
      return { data: null, error: null };
    }
    const sorted = [...rows];
    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      sorted.sort((a, b) => String(a[col]).localeCompare(String(b[col])) * (ascending ? 1 : -1));
    }
    return { data: this.one ? (sorted[0] ?? null) : sorted, error: null };
  }
}

export function fakeClient(tables: Tables): FakeClient {
  const client: FakeClient = {
    tables,
    updates: [],
    from: (table) => new Builder(client, table),
  };
  return client;
}
