/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Pool, type PoolClient } from "pg";
import { getPool } from "./pool";

export interface PostgrestLikeResponse<T = any> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
  count: number | null;
}

interface FilterCondition {
  type: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "is" | "or";
  column?: string;
  value?: any;
  rawOr?: string;
}

interface OrderCondition {
  column: string;
  ascending: boolean;
}

export class QueryBuilder<T = any> implements PromiseLike<PostgrestLikeResponse<T[]>> {
  private tableName: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private selectedColumns: string = "*";
  private countOption: "exact" | "planned" | "estimated" | null = null;
  private isHead: boolean = false;
  private insertData: any = null;
  private updateData: any = null;
  private upsertConflict: string | null = null;
  private filters: FilterCondition[] = [];
  private orderings: OrderCondition[] = [];
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private poolOrClient: Pool | PoolClient | null = null;

  constructor(table: string, poolOrClient?: Pool | PoolClient) {
    this.tableName = table;
    this.poolOrClient = poolOrClient || null;
  }

  select(
    columns: string = "*",
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ): this {
    this.action = "select";
    this.selectedColumns = columns;
    this.countOption = options?.count ?? null;
    this.isHead = Boolean(options?.head);
    return this;
  }

  insert(data: Record<string, any> | Record<string, any>[]): this {
    this.action = "insert";
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(patch: Record<string, any>): this {
    this.action = "update";
    this.updateData = patch;
    return this;
  }

  upsert(
    data: Record<string, any> | Record<string, any>[],
    options?: { onConflict?: string },
  ): this {
    this.action = "upsert";
    this.insertData = Array.isArray(data) ? data : [data];
    this.upsertConflict = options?.onConflict || null;
    return this;
  }

  delete(): this {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push({ type: "neq", column, value });
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push({ type: "lt", column, value });
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push({ type: "gt", column, value });
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }

  is(column: string, value: any): this {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  or(filterString: string): this {
    this.filters.push({ type: "or", rawOr: filterString });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderings.push({
      column,
      ascending: options?.ascending !== false,
    });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): Promise<PostgrestLikeResponse<T>> {
    this.isSingle = true;
    return this.execute() as unknown as Promise<PostgrestLikeResponse<T>>;
  }

  maybeSingle(): Promise<PostgrestLikeResponse<T>> {
    this.isMaybeSingle = true;
    return this.execute() as unknown as Promise<PostgrestLikeResponse<T>>;
  }

  then<TResult1 = PostgrestLikeResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: PostgrestLikeResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private buildWhereClause(
    paramOffset: number = 0,
    hasJoin: boolean = false,
  ): { sql: string; values: any[] } {
    if (this.filters.length === 0) return { sql: "", values: [] };

    const clauses: string[] = [];
    const values: any[] = [];
    let idx = paramOffset + 1;

    for (const filter of this.filters) {
      if (filter.type === "or" && filter.rawOr) {
        // e.g. "username.eq.user1,email.eq.user1"
        const parts = filter.rawOr.split(",");
        const subClauses: string[] = [];
        for (const part of parts) {
          const match = part.trim().match(/^([a-zA-Z0-9_.]+)\.([a-zA-Z_]+)\.(.*)$/);
          if (match) {
            const rawCol = match[1];
            const op = match[2];
            const val = match[3];
            const col = formatColumnName(rawCol, hasJoin ? this.tableName : undefined);

            if (op === "eq") {
              if (val === "null") {
                subClauses.push(`${col} IS NULL`);
              } else {
                subClauses.push(`${col} = $${idx++}`);
                values.push(val);
              }
            } else if (op === "neq") {
              if (val === "null") {
                subClauses.push(`${col} IS NOT NULL`);
              } else {
                subClauses.push(`${col} != $${idx++}`);
                values.push(val);
              }
            } else if (op === "is") {
              subClauses.push(`${col} IS ${val.toUpperCase()}`);
            }
          }
        }
        if (subClauses.length > 0) {
          clauses.push(`(${subClauses.join(" OR ")})`);
        }
        continue;
      }

      if (!filter.column) continue;
      const col = formatColumnName(filter.column, hasJoin ? this.tableName : undefined);

      if (filter.type === "eq") {
        if (filter.value === null) {
          clauses.push(`${col} IS NULL`);
        } else {
          clauses.push(`${col} = $${idx++}`);
          values.push(filter.value);
        }
      } else if (filter.type === "neq") {
        if (filter.value === null) {
          clauses.push(`${col} IS NOT NULL`);
        } else {
          clauses.push(`${col} != $${idx++}`);
          values.push(filter.value);
        }
      } else if (filter.type === "lt") {
        clauses.push(`${col} < $${idx++}`);
        values.push(filter.value);
      } else if (filter.type === "lte") {
        clauses.push(`${col} <= $${idx++}`);
        values.push(filter.value);
      } else if (filter.type === "gt") {
        clauses.push(`${col} > $${idx++}`);
        values.push(filter.value);
      } else if (filter.type === "gte") {
        clauses.push(`${col} >= $${idx++}`);
        values.push(filter.value);
      } else if (filter.type === "is") {
        if (filter.value === null) {
          clauses.push(`${col} IS NULL`);
        } else if (filter.value === true) {
          clauses.push(`${col} IS TRUE`);
        } else if (filter.value === false) {
          clauses.push(`${col} IS FALSE`);
        }
      } else if (filter.type === "in") {
        if (!Array.isArray(filter.value) || filter.value.length === 0) {
          clauses.push("FALSE");
        } else {
          clauses.push(`${col} = ANY($${idx++})`);
          values.push(filter.value);
        }
      }
    }

    return {
      sql: clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "",
      values,
    };
  }

  async execute(): Promise<PostgrestLikeResponse<any>> {
    const executor = this.poolOrClient || getPool();

    try {
      let sql = "";
      let values: any[] = [];
      let totalCount: number | null = null;

      if (this.action === "select") {
        const hasBillingCyclesInner = /billing_cycles!inner\(([^)]+)\)/.test(this.selectedColumns);
        const hasBillingCyclesLeft =
          /billing_cycles\(([^)]+)\)/.test(this.selectedColumns) && !hasBillingCyclesInner;
        const hasJoin = hasBillingCyclesInner || hasBillingCyclesLeft;

        let joinSql = "";
        if (hasBillingCyclesInner) {
          joinSql = ` INNER JOIN "billing_cycles" ON "billing_cycles"."id" = ${sanitizeIdentifier(this.tableName)}."billing_cycle_id"`;
        } else if (hasBillingCyclesLeft) {
          joinSql = ` LEFT JOIN "billing_cycles" ON "billing_cycles"."id" = ${sanitizeIdentifier(this.tableName)}."billing_cycle_id"`;
        }

        const where = this.buildWhereClause(0, hasJoin);
        values = where.values;

        // If head: true, only query the count
        if (this.isHead) {
          const countSql = `SELECT COUNT(*)::int AS count FROM ${sanitizeIdentifier(this.tableName)}${joinSql}${where.sql}`;
          const res = await executor.query(countSql, values);
          const count = parseInt(res.rows[0]?.count ?? "0", 10);
          return { data: [], error: null, count };
        }

        // If count option requested and limit is applied, fetch total count first
        if (this.countOption === "exact") {
          const countSql = `SELECT COUNT(*)::int AS count FROM ${sanitizeIdentifier(this.tableName)}${joinSql}${where.sql}`;
          const countRes = await executor.query(countSql, values);
          totalCount = parseInt(countRes.rows[0]?.count ?? "0", 10);
        }

        const columns = parseSelectedColumns(this.selectedColumns, this.tableName, hasJoin);
        sql = `SELECT ${columns} FROM ${sanitizeIdentifier(this.tableName)}${joinSql}${where.sql}`;

        if (this.orderings.length > 0) {
          const orderClauses = this.orderings.map((o) => {
            const col = formatColumnName(o.column, hasJoin ? this.tableName : undefined);
            return `${col} ${o.ascending ? "ASC" : "DESC"}`;
          });
          sql += ` ORDER BY ${orderClauses.join(", ")}`;
        }

        if (this.limitCount !== null) {
          sql += ` LIMIT ${Math.max(0, Math.floor(this.limitCount))}`;
        }
      } else if (this.action === "insert") {
        if (!this.insertData || this.insertData.length === 0) {
          return { data: [], error: null, count: 0 };
        }
        const keys = Object.keys(this.insertData[0]);
        const cols = keys.map(sanitizeIdentifier).join(", ");
        const rowPlaceholders: string[] = [];
        let idx = 1;

        for (const row of this.insertData) {
          const ph: string[] = [];
          for (const key of keys) {
            ph.push(`$${idx++}`);
            values.push(row[key]);
          }
          rowPlaceholders.push(`(${ph.join(", ")})`);
        }

        sql = `INSERT INTO ${sanitizeIdentifier(this.tableName)} (${cols}) VALUES ${rowPlaceholders.join(", ")} RETURNING *`;
      } else if (this.action === "update") {
        if (!this.updateData || Object.keys(this.updateData).length === 0) {
          return { data: [], error: null, count: 0 };
        }
        const keys = Object.keys(this.updateData);
        const setClauses: string[] = [];
        let idx = 1;

        for (const key of keys) {
          setClauses.push(`${sanitizeIdentifier(key)} = $${idx++}`);
          values.push(this.updateData[key]);
        }

        const where = this.buildWhereClause(values.length, false);
        values.push(...where.values);

        sql = `UPDATE ${sanitizeIdentifier(this.tableName)} SET ${setClauses.join(", ")}${where.sql} RETURNING *`;
      } else if (this.action === "upsert") {
        if (!this.insertData || this.insertData.length === 0) {
          return { data: [], error: null, count: 0 };
        }
        const keys = Object.keys(this.insertData[0]);
        const cols = keys.map(sanitizeIdentifier).join(", ");
        const rowPlaceholders: string[] = [];
        let idx = 1;

        for (const row of this.insertData) {
          const ph: string[] = [];
          for (const key of keys) {
            ph.push(`$${idx++}`);
            values.push(row[key]);
          }
          rowPlaceholders.push(`(${ph.join(", ")})`);
        }

        const TABLE_PRIMARY_KEYS: Record<string, string> = {
          system_settings: "key",
          system_admins: "user_id",
          property_settings: "property_id",
          platform_permissions: "code",
          platform_role_permissions: "role_id,permission_code",
          platform_role_menu_actions: "role_id,menu_id,action_code",
          platform_user_menu_actions: "organization_id,user_id,menu_id,action_code",
          auth_login_aliases: "username",
          meter_readings: "meter_id,read_at",
          billing_cycles: "property_id,period_month",
        };

        const rawConflict = this.upsertConflict || TABLE_PRIMARY_KEYS[this.tableName] || "id";
        const conflictClause = rawConflict
          .split(",")
          .map((col) => sanitizeIdentifier(col.trim()))
          .join(", ");
        const conflictCols = new Set(rawConflict.split(",").map((c) => c.trim()));

        const updateSet = keys
          .filter((k) => !conflictCols.has(k))
          .map((k) => `${sanitizeIdentifier(k)} = EXCLUDED.${sanitizeIdentifier(k)}`)
          .join(", ");

        const onConflictClause = updateSet
          ? `ON CONFLICT (${conflictClause}) DO UPDATE SET ${updateSet}`
          : `ON CONFLICT (${conflictClause}) DO NOTHING`;

        sql = `INSERT INTO ${sanitizeIdentifier(this.tableName)} (${cols}) VALUES ${rowPlaceholders.join(", ")} ${onConflictClause} RETURNING *`;
      } else if (this.action === "delete") {
        const where = this.buildWhereClause(0, false);
        values = where.values;
        sql = `DELETE FROM ${sanitizeIdentifier(this.tableName)}${where.sql} RETURNING *`;
      }

      const res = await executor.query(sql, values);
      const rows = res.rows;
      const count = totalCount !== null ? totalCount : this.countOption ? rows.length : null;

      if (this.isSingle) {
        if (rows.length === 0) {
          return {
            data: null,
            error: {
              message: "JSON object requested, multiple (or no) rows returned",
              code: "PGRST116",
            },
            count: 0,
          };
        }
        return { data: rows[0], error: null, count: 1 };
      }

      if (this.isMaybeSingle) {
        return { data: rows.length > 0 ? rows[0] : null, error: null, count: rows.length };
      }

      return { data: rows, error: null, count };
    } catch (err: any) {
      return {
        data: null,
        error: {
          message: err.message || "Database query error",
          code: err.code,
          details: err.detail,
        },
        count: null,
      };
    }
  }
}

function sanitizeIdentifier(name: string): string {
  if (name.includes(".")) {
    return name.split(".").map(sanitizeIdentifier).join(".");
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

function formatColumnName(col: string, defaultTableName?: string): string {
  if (col.includes(".")) {
    return sanitizeIdentifier(col);
  }
  if (defaultTableName) {
    return `${sanitizeIdentifier(defaultTableName)}.${sanitizeIdentifier(col)}`;
  }
  return sanitizeIdentifier(col);
}

function parseSelectedColumns(cols: string, defaultTableName?: string, hasJoin: boolean = false): string {
  if (!cols || cols.trim() === "*") {
    return hasJoin && defaultTableName ? `${sanitizeIdentifier(defaultTableName)}.*` : "*";
  }

  // Split balanced commas
  const parts: string[] = [];
  let cur = "";
  let depth = 0;
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (c === "," && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.trim()) parts.push(cur.trim());

  const sanitized = parts.map((part) => {
    // Relational select: billing_cycles!inner(period_month) or billing_cycles(period_month)
    const bcMatch = part.match(/^billing_cycles(?:!inner)?\((.*)\)$/);
    if (bcMatch) {
      const innerCols = bcMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      const jsonArgs = innerCols
        .map((c) => `'${c}', "billing_cycles".${sanitizeIdentifier(c)}`)
        .join(", ");
      return `json_build_object(${jsonArgs}) AS "billing_cycles"`;
    }

    // Check for alias: "col as alias" or "col alias"
    const aliasMatch = part.match(/^([a-zA-Z0-9_]+)\s+(?:as\s+)?([a-zA-Z0-9_]+)$/i);
    if (aliasMatch) {
      const colPrefix = hasJoin && defaultTableName ? `${sanitizeIdentifier(defaultTableName)}.` : "";
      return `${colPrefix}${sanitizeIdentifier(aliasMatch[1])} AS ${sanitizeIdentifier(aliasMatch[2])}`;
    }

    // Check for count(*) or count(col)
    if (/^count\(\*\)$/i.test(part)) return "COUNT(*)";
    const countMatch = part.match(/^count\(([a-zA-Z0-9_]+)\)$/i);
    if (countMatch) {
      const colPrefix = hasJoin && defaultTableName ? `${sanitizeIdentifier(defaultTableName)}.` : "";
      return `COUNT(${colPrefix}${sanitizeIdentifier(countMatch[1])})`;
    }

    const colPrefix = hasJoin && defaultTableName ? `${sanitizeIdentifier(defaultTableName)}.` : "";
    return `${colPrefix}${sanitizeIdentifier(part)}`;
  });

  return sanitized.join(", ");
}

export async function executeRpc(
  functionName: string,
  params: Record<string, any> = {},
  poolOrClient?: Pool | PoolClient,
): Promise<PostgrestLikeResponse<any>> {
  const executor = poolOrClient || getPool();
  try {
    const fn = sanitizeIdentifier(functionName);
    const keys = Object.keys(params);

    if (keys.length === 0) {
      const res = await executor.query(`SELECT * FROM ${fn}()`);
      return { data: res.rows, error: null, count: res.rows.length };
    }

    const namedArgs: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const key of keys) {
      namedArgs.push(`${sanitizeIdentifier(key)} := $${idx++}`);
      values.push(params[key]);
    }

    const res = await executor.query(
      `SELECT * FROM ${fn}(${namedArgs.join(", ")})`,
      values,
    );
    return { data: res.rows, error: null, count: res.rows.length };
  } catch (err: any) {
    return {
      data: null,
      error: {
        message: err.message || "Database RPC error",
        code: err.code,
        details: err.detail,
      },
      count: null,
    };
  }
}
