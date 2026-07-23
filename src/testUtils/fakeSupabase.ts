// Client Supabase minimal en mémoire, pour le test d'intégration du parcours
// principal (connexion -> planifier -> logger -> voir la progression). Ce
// n'est pas un mock générique : il ne couvre que les enchaînements
// (.select/.eq/.order/.insert/.update/.delete/.single/.maybeSingle/.returns)
// et les relations (embeds) réellement utilisés par les hooks exercés dans ce
// test. Un vrai e2e sur device (Detox/Maestro) n'est pas possible dans ce
// bac à sable ; ceci vérifie honnêtement l'intégration entre AuthContext, les
// hooks React Query et la logique métier pure, sans réseau ni Supabase réel.

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

// Relations point-à-point utilisées par les selects imbriqués de l'app
// (ex. calendar_entries -> program_sessions -> programs).
const FK_MAP: Record<string, Record<string, string>> = {
  calendar_entries: { program_sessions: 'program_session_id' },
  program_sessions: { programs: 'program_id' },
  exercise_logs: { workout_logs: 'workout_log_id' },
};

function extractEmbeds(selectStr: string): { name: string; subSelect: string }[] {
  const cleaned = selectStr.replace(/!inner/g, '');
  const embeds: { name: string; subSelect: string }[] = [];
  const regex = /(\w+)\(((?:[^()]|\([^()]*\))*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned))) {
    embeds.push({ name: match[1], subSelect: match[2] });
  }
  return embeds;
}

function embedRow(db: Tables, table: string, row: Row, selectStr: string): Row {
  const embeds = extractEmbeds(selectStr);
  const result = { ...row };
  for (const { name, subSelect } of embeds) {
    const fk = FK_MAP[table]?.[name];
    if (!fk) continue;
    const related = (db[name] ?? []).find((r) => r.id === row[fk]) ?? null;
    result[name] = related ? embedRow(db, name, related, subSelect) : null;
  }
  return result;
}

type Filter = (row: Row) => boolean;

class FakeQueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private filters: Filter[] = [];
  private selectCols: string | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private orderRefTable: string | null = null;
  private limitN: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private singleFlag = false;
  private maybeSingleFlag = false;

  constructor(
    private db: Tables,
    private table: string
  ) {}

  select(cols = '*') {
    this.selectCols = cols;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.mode = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.mode = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  is(col: string, val: unknown) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  gte(col: string, val: string | number) {
    this.filters.push((row) => row[col] >= val);
    return this;
  }

  lte(col: string, val: string | number) {
    this.filters.push((row) => row[col] <= val);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; referencedTable?: string }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    this.orderRefTable = opts?.referencedTable ?? null;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.singleFlag = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleFlag = true;
    return this;
  }

  returns<_T>() {
    return this as unknown as this;
  }

  private rowsForTable() {
    return this.db[this.table] ?? (this.db[this.table] = []);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    if (this.mode === 'insert') {
      const inputRows = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const now = new Date().toISOString();
      const inserted = inputRows.map((r) => ({
        id: r.id ?? nextId(this.table),
        created_at: now,
        updated_at: now,
        ...r,
      }));
      this.rowsForTable().push(...inserted);
      const result = this.selectCols ? inserted.map((r) => embedRow(this.db, this.table, r, this.selectCols!)) : inserted;
      return this.finish(result);
    }

    if (this.mode === 'update') {
      const matched = this.rowsForTable().filter((row) => this.filters.every((f) => f(row)));
      matched.forEach((row) => Object.assign(row, this.payload, { updated_at: new Date().toISOString() }));
      return this.finish(matched);
    }

    if (this.mode === 'delete') {
      const rows = this.rowsForTable();
      const removed: Row[] = [];
      const remaining: Row[] = [];
      for (const row of rows) {
        (this.filters.every((f) => f(row)) ? removed : remaining).push(row);
      }
      this.db[this.table] = remaining;
      return this.finish(removed);
    }

    let rows = this.rowsForTable().filter((row) => this.filters.every((f) => f(row)));
    if (this.orderCol && !this.orderRefTable) {
      const col = this.orderCol;
      rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (this.orderAsc ? 1 : -1));
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);

    let result = rows.map((row) => embedRow(this.db, this.table, row, this.selectCols ?? '*'));

    if (this.orderRefTable && this.orderCol) {
      const refTable = this.orderRefTable;
      const col = this.orderCol;
      result = [...result].sort((a, b) => {
        const av = a[refTable]?.[col];
        const bv = b[refTable]?.[col];
        return (av > bv ? 1 : av < bv ? -1 : 0) * (this.orderAsc ? 1 : -1);
      });
    }

    return this.finish(result);
  }

  private finish(result: Row[]): { data: any; error: any } {
    if (this.singleFlag) {
      return result[0] ? { data: result[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } };
    }
    if (this.maybeSingleFlag) {
      return { data: result[0] ?? null, error: null };
    }
    return { data: result, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export type FakeUser = { id: string; email: string };

export function createFakeSupabase(seed: Tables = {}) {
  const db: Tables = { ...seed };
  let currentUser: FakeUser | null = null;
  let authListener: ((event: string, session: any) => void) | null = null;

  function sessionFor(user: FakeUser | null) {
    return user ? { user, access_token: `token_${user.id}`, refresh_token: `refresh_${user.id}` } : null;
  }

  const auth = {
    getSession: async () => ({ data: { session: sessionFor(currentUser) } }),
    onAuthStateChange: (cb: (event: string, session: any) => void) => {
      authListener = cb;
      return { data: { subscription: { unsubscribe: () => (authListener = null) } } };
    },
    signInWithPassword: async ({ email }: { email: string; password: string }) => {
      currentUser = { id: nextId('user'), email };
      authListener?.('SIGNED_IN', sessionFor(currentUser));
      return { error: null };
    },
    signUp: async ({ email }: { email: string; password: string }) => {
      currentUser = { id: nextId('user'), email };
      authListener?.('SIGNED_IN', sessionFor(currentUser));
      return { error: null };
    },
    signOut: async () => {
      currentUser = null;
      authListener?.('SIGNED_OUT', null);
      return { error: null };
    },
    signInWithOtp: async () => ({ error: null }),
    setSession: async () => ({ error: null }),
    exchangeCodeForSession: async () => ({ error: null }),
  };

  return {
    auth,
    from: (table: string) => new FakeQueryBuilder(db, table),
    _db: db,
  };
}
