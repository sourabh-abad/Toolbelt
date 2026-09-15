/**
 * The SQL Guide catalog.
 *
 * One flat array of entries, each self-contained: a syntax skeleton, a runnable
 * example, why you would reach for it, the traps, and dialect notes only where
 * the syntax genuinely differs. The page (src/pages/SqlGuideTool.jsx) renders
 * and searches this and holds no SQL knowledge of its own, so adding an entry
 * here is the whole job.
 *
 * Entry shape:
 *   id        kebab-case and stable — it is the ?id= deep link
 *   title     what you would say out loud
 *   category  one of CATEGORIES[].id
 *   kind      'syntax' | 'recipe' | 'practice'
 *   summary   one line, shown in the list
 *   syntax    the skeleton, placeholders in lowercase
 *   example   a query that would run against SAMPLE_SCHEMA below
 *   explain   prose: what it does and when to reach for it
 *   notes     the gotchas you otherwise learn by being bitten
 *   dialects  [{ db, note, code? }] only where behaviour differs
 *   tags      extra search terms not already in the title or summary
 *   related   ids of neighbouring entries
 */

/** Every example targets this shape, so the entries read as one database. */
export const SAMPLE_SCHEMA = `users(id, email, name, country, status, created_at)
orders(id, user_id, total, status, placed_at)
order_items(id, order_id, product_id, qty, unit_price)
products(id, name, category, price, active)`

export const CATEGORIES = [
  { id: 'basics', label: 'Basics', desc: 'Reading rows: projection, ordering, limits, expressions.' },
  { id: 'filtering', label: 'Filtering', desc: 'WHERE and everything that narrows a result set.' },
  { id: 'joins', label: 'Joins', desc: 'Combining tables, and the join types people get wrong.' },
  { id: 'aggregation', label: 'Aggregation', desc: 'GROUP BY, HAVING and the aggregate functions.' },
  { id: 'windows', label: 'Window functions', desc: 'Per-row calculations over a group without collapsing it.' },
  { id: 'subqueries', label: 'Subqueries & CTEs', desc: 'Nested queries, WITH, and recursion.' },
  { id: 'sets', label: 'Set operations', desc: 'UNION, INTERSECT, EXCEPT.' },
  { id: 'dml', label: 'Data modification', desc: 'INSERT, UPDATE, DELETE, upserts and transactions.' },
  { id: 'ddl', label: 'DDL & constraints', desc: 'Tables, keys, constraints, views.' },
  { id: 'performance', label: 'Indexes & performance', desc: 'Indexes, EXPLAIN, and why a query went slow.' },
  { id: 'functions', label: 'Dates, strings & JSON', desc: 'The built-in functions you reach for daily.' },
  { id: 'recipes', label: 'Recipes', desc: 'Whole answers to the questions that keep coming back.' },
  { id: 'pitfalls', label: 'Pitfalls', desc: 'Queries that run fine and quietly return the wrong thing.' },
]

export const KINDS = [
  { id: 'syntax', label: 'Syntax', tone: 'sky' },
  { id: 'recipe', label: 'Recipe', tone: 'emerald' },
  { id: 'practice', label: 'Practice', tone: 'amber' },
]

export const ENTRIES = [
  // ---------------------------------------------------------------- basics
  {
    id: 'select',
    title: 'SELECT ... FROM',
    category: 'basics',
    kind: 'syntax',
    summary: 'Read specific columns from a table.',
    tags: ['projection', 'columns', 'query', 'read'],
    syntax: `SELECT column_a, column_b
FROM table_name;`,
    example: `SELECT id, email, created_at
FROM users;`,
    explain:
      'The projection: which columns come back, in which order, under which names. Everything else in a query narrows or reshapes rows; SELECT decides what each surviving row looks like.',
    notes: [
      'The engine evaluates FROM, then WHERE, GROUP BY, HAVING, SELECT, then ORDER BY. That is why a SELECT alias works in ORDER BY but not in WHERE.',
      'SELECT * is fine at a psql prompt and a liability in application code.',
    ],
    related: ['select-star', 'column-alias', 'order-by', 'where'],
  },
  {
    id: 'column-alias',
    title: 'Column and table aliases (AS)',
    category: 'basics',
    kind: 'syntax',
    summary: 'Rename a column in the output, or shorten a table name for the rest of the query.',
    tags: ['as', 'rename', 'label'],
    syntax: `SELECT expression AS output_name
FROM table_name AS t;`,
    example: `SELECT u.email      AS contact,
       u.created_at AS signed_up_at
FROM users AS u
WHERE u.status = 'active';`,
    explain:
      'An alias renames a column in the result, or gives a table a short handle to qualify columns with. Aliasing tables is what keeps a five-table join readable.',
    notes: [
      'AS is optional for both, but writing it makes a missing comma in the select list obvious instead of silently aliasing the previous column.',
      'Quote an alias that contains spaces or uppercase. Unquoted identifiers fold to lowercase in PostgreSQL and uppercase in Oracle.',
      'A column alias is not visible in WHERE or in other select-list expressions. Repeat the expression, or wrap the query in a derived table.',
    ],
    dialects: [
      { db: 'SQL Server', note: 'Also supports alias = expression, e.g. SELECT contact = u.email.' },
      { db: 'Oracle', note: 'AS is not allowed for table aliases: write FROM users u.' },
    ],
    related: ['select', 'derived-table', 'order-by'],
  },
  {
    id: 'select-star',
    title: 'SELECT *',
    category: 'basics',
    kind: 'syntax',
    summary: 'Every column of every table in the FROM clause.',
    tags: ['star', 'asterisk', 'all columns'],
    syntax: `SELECT * FROM table_name;
SELECT t.* FROM table_name t JOIN other o ON ...;`,
    example: `SELECT * FROM products WHERE active = TRUE;

-- only one side of a join
SELECT u.*
FROM users u
JOIN orders o ON o.user_id = u.id;`,
    explain:
      'Expands to every column, in the declared order of the table. Useful while exploring a table you do not know yet.',
    notes: [
      'In a join, a bare * returns both tables and both id columns, and most drivers hand you only one of them.',
      'The column set changes when someone runs a migration, so code that reads by position breaks silently.',
    ],
    related: ['select', 'no-select-star'],
  },
  {
    id: 'distinct',
    title: 'DISTINCT',
    category: 'basics',
    kind: 'syntax',
    summary: 'Collapse duplicate rows in the result.',
    tags: ['unique', 'dedupe', 'duplicates'],
    syntax: `SELECT DISTINCT column_a, column_b
FROM table_name;`,
    example: `SELECT DISTINCT country
FROM users
WHERE status = 'active'
ORDER BY country;`,
    explain:
      'Removes duplicate rows after the select list is computed. It applies to the whole row, not to the first column: SELECT DISTINCT a, b returns distinct pairs.',
    notes: [
      'DISTINCT usually costs a sort or a hash of the whole result. If it is papering over a join that fanned rows out, fix the join instead.',
      'Two NULLs count as the same value here, unlike in a comparison.',
    ],
    dialects: [
      {
        db: 'PostgreSQL',
        note: 'DISTINCT ON (expr) keeps the first row per group by ORDER BY: the neatest latest-row-per-key.',
        code: `SELECT DISTINCT ON (user_id) user_id, id, placed_at
FROM orders
ORDER BY user_id, placed_at DESC;`,
      },
    ],
    related: ['distinct-crutch', 'latest-per-group', 'count-distinct'],
  },
  {
    id: 'order-by',
    title: 'ORDER BY',
    category: 'basics',
    kind: 'syntax',
    summary: 'Sort the result. The only way to guarantee row order.',
    tags: ['sort', 'asc', 'desc', 'nulls first'],
    syntax: `SELECT ...
FROM table_name
ORDER BY column_a DESC, column_b ASC;`,
    example: `SELECT id, total, placed_at
FROM orders
ORDER BY placed_at DESC, id DESC;`,
    explain:
      'Sorts the final result set. Without it the engine may return rows in whatever order is convenient, and that order changes as data and plans change.',
    notes: [
      'ASC is the default. NULLs sort last in ASC on PostgreSQL and Oracle, first on MySQL and SQL Server, so say NULLS FIRST or NULLS LAST when it matters.',
      'Always add a unique tiebreaker, usually the primary key. Sorting by a non-unique column alone makes paginated results repeat or skip rows.',
      'ORDER BY runs after SELECT, so it can use output aliases.',
    ],
    dialects: [
      { db: 'SQL Server', note: 'No NULLS FIRST/LAST: emulate with ORDER BY CASE WHEN col IS NULL THEN 1 ELSE 0 END, col.' },
    ],
    related: ['limit-offset', 'keyset-pagination', 'unstable-sort'],
  },
  {
    id: 'limit-offset',
    title: 'LIMIT / OFFSET (FETCH FIRST)',
    category: 'basics',
    kind: 'syntax',
    summary: 'Return at most N rows, optionally skipping the first M.',
    tags: ['top', 'paging', 'pagination', 'fetch first', 'rownum'],
    syntax: `SELECT ... ORDER BY ... LIMIT 20 OFFSET 40;
SELECT ... ORDER BY ... OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY;  -- standard`,
    example: `SELECT id, email
FROM users
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 40;`,
    explain:
      'Takes a slice of an ordered result. OFFSET n still reads and throws away the first n rows, so page 500 costs far more than page 1.',
    notes: [
      'LIMIT without ORDER BY returns an arbitrary 20 rows, not the first 20.',
      'For deep paging use keyset pagination instead: it stays constant-time.',
    ],
    dialects: [
      { db: 'PostgreSQL / MySQL / SQLite', note: 'LIMIT n OFFSET m.' },
      { db: 'SQL Server', note: 'SELECT TOP (20) ..., or OFFSET ... ROWS FETCH NEXT ... ROWS ONLY, which requires ORDER BY.' },
      { db: 'Oracle', note: '12c and later support FETCH FIRST n ROWS ONLY; older versions wrap the query and filter on ROWNUM.' },
    ],
    related: ['order-by', 'keyset-pagination', 'top-n-per-group'],
  },
  {
    id: 'case',
    title: 'CASE WHEN',
    category: 'basics',
    kind: 'syntax',
    summary: 'If/else inside a query: bucket, relabel, or aggregate conditionally.',
    tags: ['if', 'conditional', 'switch', 'bucket'],
    syntax: `CASE WHEN condition THEN result
     WHEN condition THEN result
     ELSE fallback
END`,
    example: `SELECT id,
       total,
       CASE WHEN total >= 500 THEN 'large'
            WHEN total >= 100 THEN 'medium'
            ELSE 'small'
       END AS bucket
FROM orders;`,
    explain:
      'The one conditional that works everywhere. Branches are evaluated top to bottom and the first true one wins, so order conditions from most specific to least.',
    notes: [
      'Without ELSE, an unmatched row yields NULL.',
      'All branches must return compatible types, or the engine raises a conversion error on the first offending row.',
      'CASE inside an aggregate is conditional aggregation, the standard way to pivot rows into columns.',
    ],
    dialects: [
      { db: 'MySQL', note: 'IF(cond, a, b) is a shorter two-branch form.' },
      { db: 'PostgreSQL', note: 'FILTER (WHERE ...) reads better than CASE inside an aggregate.' },
    ],
    related: ['conditional-aggregation', 'coalesce', 'pivot'],
  },
  {
    id: 'coalesce',
    title: 'COALESCE / NULLIF',
    category: 'basics',
    kind: 'syntax',
    summary: 'First non-NULL value, and turning a sentinel value back into NULL.',
    tags: ['null', 'default', 'ifnull', 'isnull', 'nvl', 'divide by zero'],
    syntax: `COALESCE(a, b, c)   -- first non-NULL argument
NULLIF(a, b)        -- NULL when a = b, otherwise a`,
    example: `SELECT id,
       COALESCE(name, email, 'anonymous') AS display_name,
       total / NULLIF(qty, 0)             AS unit_price
FROM ...;`,
    explain:
      'COALESCE supplies a fallback for missing data. NULLIF is the trick for division by zero: turn the zero into NULL and the division returns NULL instead of raising.',
    notes: [
      'COALESCE stops at the first non-NULL argument, so put the cheap expressions first.',
      'COALESCE(col, 0) on an indexed column in WHERE makes the predicate unsargable and the index is skipped.',
    ],
    dialects: [
      { db: 'MySQL', note: 'IFNULL(a, b) is the two-argument version.' },
      { db: 'SQL Server', note: 'ISNULL(a, b) is two-argument and takes the type of its first argument; COALESCE is the portable choice.' },
      { db: 'Oracle', note: 'NVL(a, b) and NVL2(a, b, c).' },
    ],
    related: ['null-comparison', 'sargable', 'case'],
  },
  {
    id: 'cast',
    title: 'CAST and type conversion',
    category: 'basics',
    kind: 'syntax',
    summary: 'Convert a value from one type to another, explicitly.',
    tags: ['convert', 'type', 'to_char', 'to_date', 'decimal'],
    syntax: `CAST(expression AS target_type)
expression::target_type     -- PostgreSQL shorthand`,
    example: `SELECT CAST(total AS DECIMAL(12,2)) AS total_money,
       placed_at::date                AS placed_on
FROM orders;`,
    explain:
      'Makes a conversion the engine would otherwise do implicitly, or refuse to do, explicit and visible in the query.',
    notes: [
      'Casting a column inside WHERE disables its index. Cast the literal instead.',
      'Integer division truncates in most engines: 5/2 is 2. Cast one side to a decimal first.',
      'Never store money in FLOAT. Use DECIMAL/NUMERIC, or integer minor units.',
    ],
    dialects: [
      { db: 'SQL Server', note: 'CONVERT(type, expr, style) adds date-format styles that CAST lacks.' },
      { db: 'Oracle', note: 'TO_NUMBER, TO_DATE and TO_CHAR are the everyday converters.' },
    ],
    related: ['integer-division', 'sargable', 'date-truncate'],
  },
  {
    id: 'comments',
    title: 'Comments',
    category: 'basics',
    kind: 'syntax',
    summary: 'Line and block comments, and the one that shows up in your slow-query log.',
    tags: ['documentation', 'annotate', 'tagging'],
    syntax: `-- a line comment
/* a block
   comment */`,
    example: `/* svc=checkout endpoint=GET /users/:id/ltv */
SELECT u.id,
       SUM(o.total) AS ltv   -- refunds excluded upstream
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id;`,
    explain:
      'Beyond documenting intent, a leading comment carrying the service and endpoint turns an anonymous slow query in the database log into something you can trace back to a line of code.',
    notes: [
      'Some poolers and query rewriters strip comments, so check before relying on tagging.',
      'Block comments do not nest in every engine, and an unclosed one silently swallows the rest of the script.',
    ],
    related: ['explain'],
  },

  // ------------------------------------------------------------- filtering
  {
    id: 'where',
    title: 'WHERE',
    category: 'filtering',
    kind: 'syntax',
    summary: 'Keep only the rows matching a condition.',
    tags: ['filter', 'predicate', 'condition'],
    syntax: `SELECT ...
FROM table_name
WHERE condition [AND|OR condition];`,
    example: `SELECT id, email
FROM users
WHERE status = 'active'
  AND country = 'IN'
  AND created_at >= DATE '2026-01-01';`,
    explain:
      'Filters rows before grouping. A row survives only when the condition is TRUE. UNKNOWN, which is what any comparison with NULL returns, is not TRUE, so those rows drop out.',
    notes: [
      'AND binds tighter than OR: a AND b OR c means (a AND b) OR c. Parenthesise anything mixed.',
      'WHERE runs before SELECT, so it cannot see a select-list alias.',
      'Keep the indexed column bare on one side of the comparison to stay sargable.',
    ],
    related: ['having', 'null-comparison', 'sargable', 'in'],
  },
  {
    id: 'in',
    title: 'IN / NOT IN',
    category: 'filtering',
    kind: 'syntax',
    summary: 'Match against a list of values or the result of a subquery.',
    tags: ['any', 'list', 'set membership'],
    syntax: `WHERE column IN (value_a, value_b, value_c)
WHERE column IN (SELECT column FROM other_table WHERE ...)`,
    example: `SELECT id, email
FROM users
WHERE country IN ('IN', 'ZA', 'GB');`,
    explain: 'Shorthand for a chain of ORs, and the readable way to filter against the result of another query.',
    notes: [
      'NOT IN with a subquery that can return NULL returns no rows at all. Use NOT EXISTS.',
      'Very long literal lists blow up parse time. Load them into a temp table and join instead.',
    ],
    related: ['not-in-null', 'exists', 'exists-vs-in'],
  },
  {
    id: 'between',
    title: 'BETWEEN',
    category: 'filtering',
    kind: 'syntax',
    summary: 'Inclusive range test. Careful with timestamps.',
    tags: ['range', 'interval', 'from to', 'date range'],
    syntax: `WHERE column BETWEEN low AND high   -- inclusive on both ends`,
    example: `-- safe with timestamps: a half-open range
SELECT id, total
FROM orders
WHERE placed_at >= DATE '2026-09-01'
  AND placed_at <  DATE '2026-10-01';`,
    explain: 'BETWEEN a AND b is exactly a <= x AND x <= b. For dates that is fine; for timestamps it is a trap.',
    notes: [
      'BETWEEN a month start and month end on a timestamp column misses everything after midnight on the last day. Use a half-open range.',
      'The low bound must be the smaller value. BETWEEN 10 AND 1 matches nothing, without an error.',
    ],
    related: ['where', 'date-truncate', 'sargable'],
  },
  {
    id: 'like',
    title: 'LIKE / ILIKE pattern matching',
    category: 'filtering',
    kind: 'syntax',
    summary: 'Wildcard string matching: % for any run of characters, _ for exactly one.',
    tags: ['wildcard', 'contains', 'starts with', 'search', 'ilike'],
    syntax: `WHERE column LIKE 'prefix%'     -- starts with
WHERE column LIKE '%word%'      -- contains
WHERE column LIKE 'a_c'         -- single-character wildcard`,
    example: `SELECT id, email
FROM users
WHERE email LIKE 'sourabh%';`,
    explain:
      'The portable substring filter. A prefix pattern with no leading wildcard can use a B-tree index; a leading % forces a scan of every row.',
    notes: [
      'Escape a literal % or _ with an ESCAPE character.',
      'For real text search use the full-text or trigram index, not LIKE with a leading wildcard over millions of rows.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'LIKE is case-sensitive, ILIKE is not. pg_trgm plus a GIN index makes contains-patterns indexable.' },
      { db: 'MySQL', note: 'LIKE follows the column collation, so it is usually case-insensitive already.' },
      { db: 'Oracle / SQL Server', note: 'Compare UPPER(col) to an uppercase pattern, or use a case-insensitive collation.' },
    ],
    related: ['regex-match', 'sargable', 'text-search'],
  },
  {
    id: 'null-comparison',
    title: 'IS NULL / IS NOT NULL',
    category: 'filtering',
    kind: 'syntax',
    summary: 'The only way to test for NULL. Equals NULL is always unknown.',
    tags: ['null', 'missing', 'unknown', 'three-valued logic'],
    syntax: `WHERE column IS NULL
WHERE column IS NOT NULL
WHERE a IS NOT DISTINCT FROM b   -- NULL-safe equality (standard)`,
    example: `SELECT id, email
FROM users
WHERE country IS NULL;`,
    explain:
      'NULL means unknown, and every comparison with an unknown is itself unknown: not TRUE, not FALSE. WHERE keeps only TRUE rows, so a test for equality with NULL silently matches nothing.',
    notes: [
      'NULL = NULL is unknown, and so is NULL <> NULL. Only IS NULL answers the question.',
      'COUNT(col) skips NULLs and COUNT(*) does not. That difference is behind a lot of off-by-something reports.',
      'A UNIQUE constraint usually permits many NULLs, because the NULLs are not equal to each other.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'a IS NOT DISTINCT FROM b treats NULL = NULL as true.' },
      { db: 'MySQL', note: 'The <=> operator is NULL-safe equality.' },
      { db: 'Oracle', note: 'An empty string is stored as NULL, so comparing a column to an empty string never matches.' },
    ],
    related: ['not-in-null', 'coalesce', 'count-star'],
  },
  {
    id: 'regex-match',
    title: 'Regular expression matching',
    category: 'filtering',
    kind: 'syntax',
    summary: 'Filter with a regex when LIKE is not expressive enough.',
    tags: ['regexp', 'pattern', 'similar to', 'match', 'validation'],
    syntax: `WHERE column ~ 'pattern'          -- PostgreSQL, case-sensitive
WHERE column REGEXP 'pattern'     -- MySQL
WHERE REGEXP_LIKE(column, 'pat')  -- Oracle`,
    example: `-- rough email sanity sweep
SELECT id, email
FROM users
WHERE email !~ '^[^@[:space:]]+@[^@[:space:]]+\\.[a-z]{2,}$';`,
    explain: 'Full regular expressions over a column. Useful for validation sweeps and for parsing semi-structured text columns.',
    notes: [
      'No index helps a regex, so expect a full scan. Narrow with an indexed predicate first.',
      'Regex flavours differ between engines; a pattern that works in PostgreSQL may need rewriting for MySQL.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'The operators are ~ (match), ~* (case-insensitive) and !~ (no match).' },
      { db: 'SQL Server', note: 'No native regex in older versions: use LIKE or a CLR function.' },
    ],
    related: ['like', 'sargable'],
  },

  // ----------------------------------------------------------------- joins
  {
    id: 'inner-join',
    title: 'INNER JOIN',
    category: 'joins',
    kind: 'syntax',
    summary: 'Rows that match on both sides. Everything unmatched disappears.',
    tags: ['join', 'match', 'combine tables'],
    syntax: `SELECT ...
FROM a
JOIN b ON b.a_id = a.id;`,
    example: `SELECT o.id, o.total, u.email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid';`,
    explain:
      'The default join. For each row on the left it emits one output row per matching row on the right, and drops rows with no match on either side.',
    notes: [
      'The word INNER is optional. JOIN alone means INNER JOIN.',
      'If the right side matches more than once, the left row is duplicated. That is row fan-out, and it is what silently doubles SUM() totals.',
      'Filtering the right table in WHERE instead of ON is fine for an inner join, but changes the meaning of an outer join.',
    ],
    related: ['left-join', 'join-fanout', 'on-vs-using', 'outer-join-where'],
  },
  {
    id: 'left-join',
    title: 'LEFT JOIN (LEFT OUTER JOIN)',
    category: 'joins',
    kind: 'syntax',
    summary: 'Every row on the left, with NULLs where the right side has no match.',
    tags: ['outer join', 'optional', 'missing rows'],
    syntax: `SELECT ...
FROM a
LEFT JOIN b ON b.a_id = a.id;`,
    example: `-- every user, with their order count (0 for those who never ordered)
SELECT u.id, u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email;`,
    explain:
      'Keeps all left rows and fills the right-hand columns with NULL where nothing matched. The right way to answer questions that include the zero cases.',
    notes: [
      'COUNT(o.id) counts matches; COUNT(*) would count the NULL-padded row as one. This is the classic wrong count.',
      'A condition on the right table in WHERE turns a LEFT JOIN back into an inner join. Put it in the ON clause.',
      'RIGHT JOIN is the mirror image. Most teams normalise everything to LEFT JOIN so the reading order stays consistent.',
    ],
    related: ['outer-join-where', 'anti-join', 'inner-join', 'count-star'],
  },
  {
    id: 'full-join',
    title: 'FULL OUTER JOIN',
    category: 'joins',
    kind: 'syntax',
    summary: 'Every row from both sides, NULL-padded wherever there is no match.',
    tags: ['full join', 'outer', 'reconcile', 'compare tables'],
    syntax: `SELECT ...
FROM a
FULL OUTER JOIN b ON b.key = a.key;`,
    example: `-- reconcile two ledgers: rows only in one side or the other
SELECT COALESCE(a.ref, b.ref) AS ref, a.amount, b.amount
FROM ledger_a a
FULL OUTER JOIN ledger_b b ON b.ref = a.ref
WHERE a.ref IS NULL OR b.ref IS NULL OR a.amount <> b.amount;`,
    explain: 'The union of both outer joins. Mostly used for reconciliation: showing what is in A but not B, in B but not A, and different in both.',
    notes: [
      'Use COALESCE on the join key, since either side can be NULL in the output.',
      'MySQL has no FULL OUTER JOIN. Emulate it with a LEFT JOIN UNION-ed with a RIGHT JOIN.',
    ],
    related: ['left-join', 'compare-tables', 'union'],
  },
  {
    id: 'cross-join',
    title: 'CROSS JOIN',
    category: 'joins',
    kind: 'syntax',
    summary: 'Every combination of both sides. Deliberate, or a bug.',
    tags: ['cartesian product', 'combinations', 'matrix'],
    syntax: `SELECT ... FROM a CROSS JOIN b;
SELECT ... FROM a, b;   -- the same thing, written by accident`,
    example: `-- a row per (day, product) so a report has no gaps
SELECT d.day, p.id
FROM generate_series(DATE '2026-09-01', DATE '2026-09-30', INTERVAL '1 day') AS d(day)
CROSS JOIN products p
WHERE p.active;`,
    explain:
      'Produces the Cartesian product: every left row paired with every right row. Legitimately used to build a dense grid to left-join real data onto.',
    notes: [
      'Writing FROM a, b and forgetting the join predicate in WHERE is the accidental version. It is usually a runaway query, not a wrong one.',
      'Output size is the product of both row counts. Two 10,000-row tables make 100 million rows.',
    ],
    related: ['zero-fill-dates', 'inner-join'],
  },
  {
    id: 'self-join',
    title: 'Self join',
    category: 'joins',
    kind: 'syntax',
    summary: 'Join a table to itself to compare rows within it.',
    tags: ['hierarchy', 'manager', 'previous row', 'pairs'],
    syntax: `SELECT ...
FROM table_name a
JOIN table_name b ON b.parent_id = a.id;`,
    example: `-- each employee next to their manager
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;`,
    explain:
      'The same table under two aliases. Used for hierarchies (manager, parent category) and for comparing one row to another row of the same table.',
    notes: [
      'Aliases are mandatory. Without them every column reference is ambiguous.',
      'For comparing a row to its neighbour in an order, LAG/LEAD is faster and clearer than a self join.',
      'For arbitrary-depth hierarchies use a recursive CTE, not a chain of self joins.',
    ],
    related: ['lag-lead', 'recursive-cte', 'left-join'],
  },
  {
    id: 'anti-join',
    title: 'Anti join: rows with no match',
    category: 'joins',
    kind: 'recipe',
    summary: 'Find rows in A that have nothing matching in B.',
    tags: ['not exists', 'missing', 'orphans', 'left join is null'],
    syntax: `-- preferred
SELECT ... FROM a
WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);

-- equivalent
SELECT a.* FROM a
LEFT JOIN b ON b.a_id = a.id
WHERE b.a_id IS NULL;`,
    example: `-- users who have never placed an order
SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`,
    explain:
      'The standard way to ask what is missing: customers with no orders, orders with no items, rows whose foreign key points nowhere.',
    notes: [
      'NOT EXISTS is NULL-safe. NOT IN over a nullable column returns nothing at all.',
      'The LEFT JOIN ... IS NULL form is equivalent and sometimes plans better. Check EXPLAIN on your data rather than believing a rule of thumb.',
      'The column you test for IS NULL must be NOT NULL in the joined table, otherwise a real matched row can look unmatched.',
    ],
    related: ['not-in-null', 'exists', 'left-join', 'orphan-rows'],
  },
  {
    id: 'on-vs-using',
    title: 'ON vs USING vs NATURAL JOIN',
    category: 'joins',
    kind: 'syntax',
    summary: 'Three ways to state the join condition, only two of which are safe.',
    tags: ['join condition', 'natural join', 'using'],
    syntax: `JOIN b ON b.user_id = a.id    -- explicit, always works
JOIN b USING (user_id)         -- same column name on both sides
NATURAL JOIN b                 -- joins on every same-named column`,
    example: `SELECT o.id, u.email
FROM orders o
JOIN users u ON u.id = o.user_id;`,
    explain:
      'ON states the condition in full. USING is a shorthand when both tables name the column identically, and it collapses the pair into one output column.',
    notes: [
      'Never use NATURAL JOIN in application code. It silently picks up every same-named column, so adding a created_at column to both tables changes what the query returns.',
      'With USING, the joined column is unqualified in the select list: SELECT user_id, not a.user_id.',
    ],
    related: ['inner-join', 'left-join'],
  },
  {
    id: 'lateral-join',
    title: 'LATERAL / CROSS APPLY',
    category: 'joins',
    kind: 'syntax',
    summary: 'A subquery on the right that can refer to columns from the left.',
    tags: ['apply', 'per-row subquery', 'top n per group'],
    syntax: `FROM a
CROSS JOIN LATERAL (SELECT ... WHERE x = a.id LIMIT n) b   -- PostgreSQL
FROM a CROSS APPLY (SELECT TOP (n) ... WHERE x = a.id) b   -- SQL Server`,
    example: `-- the 3 most recent orders for each user
SELECT u.email, o.id, o.placed_at
FROM users u
CROSS JOIN LATERAL (
  SELECT id, placed_at
  FROM orders
  WHERE user_id = u.id
  ORDER BY placed_at DESC
  LIMIT 3
) o;`,
    explain:
      'A correlated subquery in the FROM clause. The right-hand query runs once per left row and can see that row, which makes per-row top-N cheap and readable.',
    notes: [
      'Use LEFT JOIN LATERAL ... ON TRUE to keep left rows whose subquery returns nothing.',
      'With a matching index this often beats the window-function form of top-N per group, because it can stop after n rows per group.',
    ],
    dialects: [
      { db: 'PostgreSQL / Oracle', note: 'LATERAL (Oracle also has CROSS APPLY and OUTER APPLY).' },
      { db: 'SQL Server', note: 'CROSS APPLY and OUTER APPLY.' },
      { db: 'MySQL', note: 'LATERAL is supported from 8.0.14.' },
    ],
    related: ['top-n-per-group', 'correlated-subquery', 'row-number'],
  },

  // ----------------------------------------------------------- aggregation
  {
    id: 'group-by',
    title: 'GROUP BY',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'Collapse rows into one row per distinct combination of the grouping columns.',
    tags: ['aggregate', 'summarise', 'per', 'roll up'],
    syntax: `SELECT key_column, aggregate_function(other_column)
FROM table_name
GROUP BY key_column;`,
    example: `SELECT u.country,
       COUNT(*)      AS users,
       AVG(o.total)  AS avg_order
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.country
ORDER BY users DESC;`,
    explain:
      'Splits rows into groups by the listed expressions and reduces each group to a single row. Every select-list column must either be in GROUP BY or wrapped in an aggregate.',
    notes: [
      'GROUP BY runs after WHERE and before HAVING. Filter individual rows in WHERE and whole groups in HAVING.',
      'Grouping by a column with NULLs produces one NULL group; NULLs are grouped together even though they are not equal.',
      'Group by the primary key and you may select its dependent columns without aggregating them in PostgreSQL. Other engines demand every column.',
    ],
    dialects: [
      { db: 'MySQL', note: 'With ONLY_FULL_GROUP_BY disabled it will return an arbitrary value for unaggregated columns. Leave the mode on.' },
    ],
    related: ['having', 'aggregates', 'grouping-sets', 'conditional-aggregation'],
  },
  {
    id: 'aggregates',
    title: 'COUNT, SUM, AVG, MIN, MAX',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'The five aggregate functions behind most reporting queries.',
    tags: ['total', 'average', 'sum', 'maximum', 'minimum'],
    syntax: `COUNT(*) | COUNT(col) | COUNT(DISTINCT col)
SUM(col) | AVG(col) | MIN(col) | MAX(col)`,
    example: `SELECT COUNT(*)                AS orders,
       COUNT(DISTINCT user_id)  AS buyers,
       SUM(total)               AS revenue,
       ROUND(AVG(total), 2)     AS avg_order,
       MAX(placed_at)           AS last_order
FROM orders
WHERE status = 'paid';`,
    explain: 'Each reduces a group of rows to one value. All of them except COUNT(*) ignore NULL inputs.',
    notes: [
      'SUM of no rows is NULL, not 0. Wrap it: COALESCE(SUM(total), 0).',
      'AVG ignores NULLs, so it divides by the count of non-NULL values, not by the row count.',
      'MIN and MAX work on text and dates too, which is how you get the earliest or latest row in a group.',
    ],
    related: ['count-star', 'count-distinct', 'group-by', 'null-comparison'],
  },
  {
    id: 'count-star',
    title: 'COUNT(*) vs COUNT(col) vs COUNT(1)',
    category: 'aggregation',
    kind: 'practice',
    summary: 'They are not the same, and only one of the differences matters.',
    tags: ['count', 'rows', 'nulls'],
    syntax: `COUNT(*)    -- rows in the group
COUNT(col)  -- rows where col IS NOT NULL
COUNT(1)    -- identical to COUNT(*) in every mainstream engine`,
    example: `SELECT COUNT(*)       AS rows_total,
       COUNT(country) AS with_country
FROM users;`,
    explain:
      'COUNT(*) counts rows. COUNT(col) counts non-NULL values of that column, which is exactly what you want after a LEFT JOIN and exactly what bites you when you did not intend it.',
    notes: [
      'COUNT(1) and COUNT(*) produce the same plan. The claim that one is faster is folklore.',
      'After LEFT JOIN orders, COUNT(*) is at least 1 for every user, while COUNT(orders.id) is 0 for users with no orders.',
      'COUNT(DISTINCT col) is much more expensive than COUNT(col): it has to deduplicate.',
    ],
    related: ['left-join', 'count-distinct', 'null-comparison'],
  },
  {
    id: 'having',
    title: 'HAVING',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'Filter groups after aggregation, the way WHERE filters rows before it.',
    tags: ['filter groups', 'aggregate filter'],
    syntax: `SELECT key, COUNT(*)
FROM table_name
WHERE row_level_condition
GROUP BY key
HAVING COUNT(*) > 1;`,
    example: `-- emails used by more than one account
SELECT email, COUNT(*) AS accounts
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY accounts DESC;`,
    explain: 'HAVING sees the grouped rows, so it can compare aggregates. WHERE cannot, because it runs before the aggregation.',
    notes: [
      'Put a condition in WHERE whenever it does not involve an aggregate. Filtering early means fewer rows to aggregate.',
      'HAVING without GROUP BY treats the whole result as one group.',
    ],
    related: ['group-by', 'where', 'find-duplicates'],
  },
  {
    id: 'count-distinct',
    title: 'COUNT(DISTINCT ...)',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'How many different values, not how many rows.',
    tags: ['unique count', 'cardinality', 'distinct'],
    syntax: `COUNT(DISTINCT column)
COUNT(DISTINCT (col_a, col_b))   -- PostgreSQL: distinct pairs`,
    example: `SELECT DATE_TRUNC('day', placed_at) AS day,
       COUNT(*)                     AS orders,
       COUNT(DISTINCT user_id)      AS buyers
FROM orders
GROUP BY 1
ORDER BY 1;`,
    explain: 'Deduplicates before counting. The difference between orders and buyers, sessions and users, rows and things.',
    notes: [
      'Cannot be combined across days: distinct buyers per day do not add up to distinct buyers per month. Recompute at each grain.',
      'Expensive on large groups. Where an estimate will do, PostgreSQL has HLL extensions and BigQuery has APPROX_COUNT_DISTINCT.',
    ],
    dialects: [
      { db: 'MySQL', note: 'COUNT(DISTINCT a, b) counts distinct combinations, and skips rows where any part is NULL.' },
    ],
    related: ['aggregates', 'distinct', 'count-star'],
  },
  {
    id: 'conditional-aggregation',
    title: 'Conditional aggregation (FILTER)',
    category: 'aggregation',
    kind: 'recipe',
    summary: 'Count or sum only the rows matching a condition, in one pass.',
    tags: ['filter clause', 'countif', 'sumif', 'pivot', 'case in aggregate'],
    syntax: `SUM(CASE WHEN condition THEN 1 ELSE 0 END)
COUNT(*) FILTER (WHERE condition)   -- PostgreSQL / SQLite / standard`,
    example: `SELECT user_id,
       COUNT(*)                                        AS orders,
       COUNT(*) FILTER (WHERE status = 'refunded')     AS refunded,
       SUM(total) FILTER (WHERE status = 'paid')       AS paid_revenue
FROM orders
GROUP BY user_id;`,
    explain:
      'Several differently-filtered aggregates over one scan of the table. This is how you produce a summary row with paid, pending and refunded columns without three separate queries.',
    notes: [
      'The portable form is SUM(CASE WHEN cond THEN 1 ELSE 0 END) for counting and SUM(CASE WHEN cond THEN col END) for summing.',
      'COUNT(CASE WHEN cond THEN 1 END) works too: the missing ELSE yields NULL, which COUNT skips.',
    ],
    dialects: [
      { db: 'PostgreSQL / SQLite', note: 'FILTER (WHERE ...) is the readable standard form.' },
      { db: 'MySQL / SQL Server / Oracle', note: 'No FILTER clause. Use the CASE form.' },
    ],
    related: ['case', 'pivot', 'group-by', 'percent-of-total'],
  },
  {
    id: 'string-agg',
    title: 'STRING_AGG / GROUP_CONCAT',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'Collapse a group of rows into one delimited string.',
    tags: ['group_concat', 'listagg', 'comma separated', 'array_agg'],
    syntax: `STRING_AGG(expression, ', ' ORDER BY expression)   -- PostgreSQL, SQL Server 2017+
GROUP_CONCAT(expression ORDER BY expression SEPARATOR ', ')  -- MySQL
LISTAGG(expression, ', ') WITHIN GROUP (ORDER BY expression) -- Oracle`,
    example: `SELECT o.id,
       STRING_AGG(p.name, ', ' ORDER BY p.name) AS products
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN products p    ON p.id = i.product_id
GROUP BY o.id;`,
    explain: 'Turns the many rows of a child table into one readable column on the parent. The quickest way to make a join result human-readable.',
    notes: [
      'Always give it an explicit ORDER BY, or the string order is arbitrary and diffs between runs.',
      'MySQL truncates at group_concat_max_len (1024 bytes by default) without an error. Raise it or expect silent truncation.',
      'For machine consumption prefer ARRAY_AGG or JSON_AGG over a delimited string.',
    ],
    related: ['group-by', 'json-build'],
  },
  {
    id: 'grouping-sets',
    title: 'GROUPING SETS, ROLLUP, CUBE',
    category: 'aggregation',
    kind: 'syntax',
    summary: 'Several levels of aggregation, including subtotals, in one query.',
    tags: ['subtotal', 'grand total', 'rollup', 'cube', 'drilldown'],
    syntax: `GROUP BY GROUPING SETS ((a, b), (a), ())
GROUP BY ROLLUP (a, b)   -- (a,b), (a), ()
GROUP BY CUBE (a, b)     -- every combination`,
    example: `SELECT country, status, SUM(total) AS revenue
FROM orders o
JOIN users u ON u.id = o.user_id
GROUP BY ROLLUP (country, status);`,
    explain:
      'One pass that emits per-group rows and the subtotal and grand-total rows above them. Replaces the UNION ALL of three near-identical queries.',
    notes: [
      'Subtotal rows carry NULL in the columns that were rolled up. GROUPING(col) returns 1 there so you can tell a subtotal from a genuine NULL.',
      'Supported in PostgreSQL, SQL Server, Oracle and MySQL 8 (MySQL uses WITH ROLLUP).',
    ],
    related: ['group-by', 'percent-of-total', 'union'],
  },

  // --------------------------------------------------------------- windows
  {
    id: 'over-partition',
    title: 'OVER (PARTITION BY ...)',
    category: 'windows',
    kind: 'syntax',
    summary: 'Aggregate across a group while keeping every individual row.',
    tags: ['window function', 'analytic', 'partition'],
    syntax: `aggregate_or_window_function(...) OVER (
  PARTITION BY partition_column
  ORDER BY sort_column
  [frame_clause]
)`,
    example: `-- each order next to its user's total, without losing the order rows
SELECT id,
       user_id,
       total,
       SUM(total) OVER (PARTITION BY user_id) AS user_lifetime_value
FROM orders;`,
    explain:
      'A window function computes over a set of rows related to the current row, and returns a value for every row instead of collapsing the group. GROUP BY answers how much per user; a window answers how much per user, shown on every order.',
    notes: [
      'Window functions run after WHERE, GROUP BY and HAVING, so you cannot filter on one directly. Wrap the query in a CTE or derived table and filter outside.',
      'PARTITION BY is optional. Without it the whole result is one window.',
      'ORDER BY inside OVER defines the running order, which is what turns SUM into a running total.',
    ],
    related: ['row-number', 'running-total', 'window-frame', 'rank'],
  },
  {
    id: 'row-number',
    title: 'ROW_NUMBER()',
    category: 'windows',
    kind: 'syntax',
    summary: 'A 1, 2, 3 sequence within each partition. The workhorse of dedupe and top-N.',
    tags: ['numbering', 'first per group', 'dedupe', 'rank'],
    syntax: `ROW_NUMBER() OVER (PARTITION BY key ORDER BY sort_column DESC)`,
    example: `-- the newest order per user
SELECT *
FROM (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY placed_at DESC, id DESC) AS rn
  FROM orders o
) ranked
WHERE rn = 1;`,
    explain:
      'Numbers rows within each partition in the given order. Filtering on rn = 1 picks the first row per group; rn <= 3 picks the top three.',
    notes: [
      'Always add a unique tiebreaker to the ORDER BY, or which row gets number 1 changes between runs.',
      'Unlike RANK, it never repeats a number, so exactly one row per partition gets 1.',
      'You cannot put the function in WHERE. Compute it in a subquery or CTE and filter outside.',
    ],
    related: ['rank', 'top-n-per-group', 'delete-duplicates', 'latest-per-group'],
  },
  {
    id: 'rank',
    title: 'RANK() vs DENSE_RANK() vs ROW_NUMBER()',
    category: 'windows',
    kind: 'syntax',
    summary: 'Three ways to number rows, differing only in how they treat ties.',
    tags: ['ties', 'leaderboard', 'position', 'dense_rank'],
    syntax: `ROW_NUMBER() OVER (ORDER BY score DESC)  -- 1,2,3,4
RANK()       OVER (ORDER BY score DESC)  -- 1,2,2,4
DENSE_RANK() OVER (ORDER BY score DESC)  -- 1,2,2,3`,
    example: `SELECT name, score,
       RANK()       OVER (ORDER BY score DESC) AS rank_with_gaps,
       DENSE_RANK() OVER (ORDER BY score DESC) AS rank_no_gaps
FROM leaderboard;`,
    explain:
      'For a leaderboard where two people genuinely tie for second, RANK gives 1, 2, 2, 4 and DENSE_RANK gives 1, 2, 2, 3. ROW_NUMBER breaks the tie arbitrarily.',
    notes: [
      'Use DENSE_RANK when you want the Nth distinct value, for example the third highest salary.',
      'Use ROW_NUMBER when you need exactly one row per group and do not care which of two identical rows wins.',
    ],
    related: ['row-number', 'nth-highest', 'ntile'],
  },
  {
    id: 'lag-lead',
    title: 'LAG() and LEAD()',
    category: 'windows',
    kind: 'syntax',
    summary: 'Read a value from the previous or next row without a self join.',
    tags: ['previous row', 'next row', 'delta', 'difference', 'time series'],
    syntax: `LAG(expression, offset, default) OVER (PARTITION BY key ORDER BY sort_column)
LEAD(expression, offset, default) OVER (...)`,
    example: `-- gap in days between a user's consecutive orders
SELECT user_id, id, placed_at,
       placed_at - LAG(placed_at) OVER (PARTITION BY user_id ORDER BY placed_at) AS since_previous
FROM orders;`,
    explain:
      'Shifts a column up or down within the partition, which turns questions about change over time into a single subtraction.',
    notes: [
      'The first row of each partition has no previous row, so LAG returns NULL unless you pass a default as the third argument.',
      'Month-over-month growth, state-change detection and gaps-and-islands all start here.',
    ],
    related: ['running-total', 'month-over-month', 'gaps-islands', 'self-join'],
  },
  {
    id: 'window-frame',
    title: 'Window frames (ROWS vs RANGE)',
    category: 'windows',
    kind: 'syntax',
    summary: 'Which rows around the current one the window actually covers.',
    tags: ['frame', 'preceding', 'following', 'unbounded', 'moving average'],
    syntax: `OVER (ORDER BY col ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
OVER (ORDER BY col ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
OVER (ORDER BY col RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW)`,
    example: `-- 7-day moving average of daily revenue
SELECT day,
       revenue,
       AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_7d
FROM daily_revenue;`,
    explain:
      'The frame narrows the window to a sliding range around the current row. ROWS counts physical rows; RANGE works in terms of the ORDER BY value, so tied rows share a frame.',
    notes: [
      'With ORDER BY and no explicit frame, the default is RANGE UNBOUNDED PRECEDING AND CURRENT ROW, which includes all peer rows with the same sort value. That surprises people computing running totals over a non-unique date.',
      'Without ORDER BY the frame is the entire partition.',
      'ROWS is what you want for a moving average over evenly-spaced rows; RANGE with an INTERVAL is what you want over real time with gaps.',
    ],
    related: ['running-total', 'over-partition', 'moving-average'],
  },
  {
    id: 'ntile',
    title: 'NTILE() and percentiles',
    category: 'windows',
    kind: 'syntax',
    summary: 'Split rows into N buckets, or ask for a percentile directly.',
    tags: ['quartile', 'decile', 'median', 'percentile_cont', 'bucket'],
    syntax: `NTILE(4) OVER (ORDER BY value)                                  -- quartiles
PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)              -- median
PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY value)             -- p95, an actual row value`,
    example: `-- which spending quartile each customer falls in
SELECT user_id,
       SUM(total) AS spend,
       NTILE(4) OVER (ORDER BY SUM(total) DESC) AS quartile
FROM orders
GROUP BY user_id;`,
    explain:
      'NTILE distributes rows as evenly as it can into N buckets. The PERCENTILE functions are ordered-set aggregates: CONT interpolates between rows, DISC returns a value that exists in the data.',
    notes: [
      'NTILE splits by row count, not by value. Two customers with identical spend can land in different quartiles.',
      'For latency percentiles use PERCENTILE_DISC, so the answer is a real observed value.',
      'MySQL has no PERCENTILE functions. Emulate a median with ROW_NUMBER and COUNT.',
    ],
    related: ['rank', 'median', 'histogram'],
  },
  {
    id: 'first-last-value',
    title: 'FIRST_VALUE / LAST_VALUE / NTH_VALUE',
    category: 'windows',
    kind: 'syntax',
    summary: 'The first, last or Nth row of the window, projected onto every row.',
    tags: ['first', 'last', 'anchor', 'baseline'],
    syntax: `FIRST_VALUE(expr) OVER (PARTITION BY key ORDER BY sort_col)
LAST_VALUE(expr)  OVER (PARTITION BY key ORDER BY sort_col
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)`,
    example: `-- every order compared with the user's first-ever order value
SELECT user_id, id, total,
       FIRST_VALUE(total) OVER (PARTITION BY user_id ORDER BY placed_at) AS first_order_total
FROM orders;`,
    explain: 'Useful for baselines: compare each row to where the series started, or to where it ended.',
    notes: [
      'LAST_VALUE with the default frame returns the current row, because the frame ends at the current row. You must spell out the full frame.',
      'FIRST_VALUE with ORDER BY DESC is often clearer than fighting the LAST_VALUE frame.',
    ],
    related: ['window-frame', 'over-partition', 'latest-per-group'],
  },
  {
    id: 'running-total',
    title: 'Running total (cumulative sum)',
    category: 'windows',
    kind: 'recipe',
    summary: 'A column that accumulates down the ordered result.',
    tags: ['cumulative', 'running sum', 'balance', 'ledger'],
    syntax: `SUM(amount) OVER (PARTITION BY key ORDER BY sort_col
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`,
    example: `SELECT placed_at,
       total,
       SUM(total) OVER (ORDER BY placed_at, id
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue
FROM orders
WHERE status = 'paid'
ORDER BY placed_at, id;`,
    explain: 'Running balances, cumulative revenue, burn-down charts: all the same shape.',
    notes: [
      'Spell out ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. The default RANGE frame lumps all rows sharing a timestamp together, which inflates every tied row to the day total.',
      'Add the primary key as a tiebreaker in ORDER BY so the sequence is reproducible.',
      'COUNT and AVG take the same frame, giving a running count or a moving average.',
    ],
    related: ['window-frame', 'moving-average', 'over-partition'],
  },

  // ------------------------------------------------------------ subqueries
  {
    id: 'scalar-subquery',
    title: 'Scalar subquery',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'A subquery returning exactly one row and one column, used as a value.',
    tags: ['inline', 'single value', 'subselect'],
    syntax: `SELECT col, (SELECT MAX(x) FROM other WHERE other.id = t.id) AS latest
FROM t;`,
    example: `SELECT u.email,
       (SELECT MAX(o.placed_at) FROM orders o WHERE o.user_id = u.id) AS last_order_at
FROM users u;`,
    explain: 'Drops a single computed value into the select list, the WHERE clause, or anywhere an expression is allowed.',
    notes: [
      'If it returns more than one row the query fails at runtime, on real data, usually in production.',
      'No matching row yields NULL rather than an error.',
      'One scalar subquery per select-list column means one pass per column. A LEFT JOIN to a grouped subquery does it in one.',
    ],
    related: ['correlated-subquery', 'derived-table', 'lateral-join'],
  },
  {
    id: 'derived-table',
    title: 'Derived table (subquery in FROM)',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'A subquery that acts as a table for the outer query.',
    tags: ['inline view', 'subquery in from', 'wrap'],
    syntax: `SELECT ...
FROM (SELECT ... FROM ... ) AS alias
WHERE alias.computed_column > 0;`,
    example: `-- filter on a window function by computing it one level down
SELECT *
FROM (
  SELECT id, user_id, total,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC) AS rn
  FROM orders
) t
WHERE rn <= 3;`,
    explain: 'The standard way to filter on something you had to compute first: a window function, an aggregate, or a messy expression.',
    notes: [
      'The alias is mandatory in most engines, even when unused.',
      'A CTE is the same thing with a name at the top, and usually reads better once nesting goes past one level.',
    ],
    related: ['cte', 'row-number', 'scalar-subquery'],
  },
  {
    id: 'exists',
    title: 'EXISTS / NOT EXISTS',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'Does at least one matching row exist? Stops at the first hit.',
    tags: ['semi join', 'anti join', 'any', 'correlated'],
    syntax: `WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)
WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)`,
    example: `-- users who have at least one paid order
SELECT u.id, u.email
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.status = 'paid'
);`,
    explain:
      'A membership test that returns each left row at most once, no matter how many matches exist. That makes it the fan-out-free alternative to a join when you only care whether a match exists.',
    notes: [
      'SELECT 1 versus SELECT * makes no difference. The engine never evaluates the select list.',
      'NOT EXISTS handles NULLs correctly where NOT IN does not.',
      'It can stop at the first matching row, so with an index it often beats a join plus DISTINCT.',
    ],
    related: ['in', 'not-in-null', 'anti-join', 'exists-vs-in'],
  },
  {
    id: 'correlated-subquery',
    title: 'Correlated subquery',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'A subquery that references the outer row, so it runs per row.',
    tags: ['per row', 'dependent subquery'],
    syntax: `SELECT ... FROM a
WHERE a.col > (SELECT AVG(col) FROM b WHERE b.a_id = a.id);`,
    example: `-- orders above that user's own average
SELECT o.id, o.user_id, o.total
FROM orders o
WHERE o.total > (
  SELECT AVG(o2.total) FROM orders o2 WHERE o2.user_id = o.user_id
);`,
    explain:
      'The inner query depends on the current outer row, so conceptually it runs once per row. Powerful, and the easiest way to write an accidentally quadratic query.',
    notes: [
      'Modern optimisers often rewrite these into a join or a hash aggregate. Read EXPLAIN rather than assuming either outcome.',
      'The window form, AVG(total) OVER (PARTITION BY user_id), does it in one pass and is usually faster.',
      'Make sure the correlated column is indexed, or you get a full scan per outer row.',
    ],
    related: ['over-partition', 'lateral-join', 'exists', 'explain'],
  },
  {
    id: 'cte',
    title: 'WITH ... AS (common table expression)',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'Name a subquery at the top and use it like a table below.',
    tags: ['with clause', 'temporary result', 'readability', 'pipeline'],
    syntax: `WITH name AS (
  SELECT ...
), other AS (
  SELECT ... FROM name ...
)
SELECT ... FROM other;`,
    example: `WITH paid AS (
  SELECT user_id, SUM(total) AS spend
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
), ranked AS (
  SELECT user_id, spend,
         RANK() OVER (ORDER BY spend DESC) AS position
  FROM paid
)
SELECT u.email, r.spend, r.position
FROM ranked r
JOIN users u ON u.id = r.user_id
WHERE r.position <= 10;`,
    explain:
      'Turns one deeply nested query into a readable top-to-bottom pipeline of named steps. Each CTE can reference the ones defined before it.',
    notes: [
      'A CTE referenced twice may be evaluated twice. If the step is expensive, materialise it into a temp table.',
      'PostgreSQL 12 and later inlines CTEs by default. Add MATERIALIZED or NOT MATERIALIZED to force the choice.',
      'CTEs do not make a query faster on their own. They make it legible, which is usually what you needed.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'WITH name AS MATERIALIZED (...) pins the result so it is computed once.' },
      { db: 'MySQL', note: 'Supported from 8.0. Earlier versions need derived tables.' },
    ],
    related: ['derived-table', 'recursive-cte', 'temp-table'],
  },
  {
    id: 'recursive-cte',
    title: 'WITH RECURSIVE',
    category: 'subqueries',
    kind: 'syntax',
    summary: 'Walk a hierarchy or generate a series by repeating a query until it stops producing rows.',
    tags: ['hierarchy', 'tree', 'org chart', 'graph', 'bill of materials'],
    syntax: `WITH RECURSIVE t AS (
  SELECT ... FROM base WHERE ...          -- anchor: the starting rows
  UNION ALL
  SELECT ... FROM base JOIN t ON ...      -- recursive step, refers to t
)
SELECT * FROM t;`,
    example: `-- everyone reporting up to employee 1, at any depth
WITH RECURSIVE reports AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees
  WHERE id = 1

  UNION ALL

  SELECT e.id, e.name, e.manager_id, r.depth + 1
  FROM employees e
  JOIN reports r ON e.manager_id = r.id
  WHERE r.depth < 20
)
SELECT * FROM reports ORDER BY depth, name;`,
    explain:
      'The anchor query runs once, then the recursive query runs repeatedly against the rows most recently produced, until it returns none. Category trees, org charts, folder paths and BOM explosions all use this shape.',
    notes: [
      'Always bound the recursion with a depth column. A cycle in the data otherwise loops until the server runs out of memory.',
      'UNION (without ALL) removes duplicates each round, which is a cheap cycle guard on graphs.',
      'SQL Server writes WITH (no RECURSIVE keyword) and defaults to 100 levels; raise it with OPTION (MAXRECURSION n).',
    ],
    dialects: [
      { db: 'Oracle', note: 'Also offers CONNECT BY PRIOR, an older and more compact hierarchy syntax.' },
    ],
    related: ['cte', 'self-join', 'zero-fill-dates'],
  },

  // ------------------------------------------------------------------ sets
  {
    id: 'union',
    title: 'UNION vs UNION ALL',
    category: 'sets',
    kind: 'syntax',
    summary: 'Stack two result sets. UNION deduplicates, UNION ALL does not.',
    tags: ['append', 'combine', 'stack', 'merge results'],
    syntax: `SELECT a, b FROM t1
UNION ALL
SELECT a, b FROM t2
ORDER BY a;   -- applies to the whole result`,
    example: `SELECT id, placed_at, 'order' AS kind FROM orders
UNION ALL
SELECT id, refunded_at, 'refund'        FROM refunds
ORDER BY placed_at DESC;`,
    explain:
      'Concatenates rows from queries with the same column count and compatible types. UNION additionally sorts or hashes the whole result to remove duplicates; UNION ALL just appends.',
    notes: [
      'Default to UNION ALL. Use UNION only when you actually need deduplication, because it is not free.',
      'Column names come from the first branch. ORDER BY belongs at the end and applies to the combined result.',
      'Types must line up positionally, not by name. A mismatched column order is a silent data bug.',
    ],
    related: ['intersect-except', 'full-join', 'grouping-sets'],
  },
  {
    id: 'intersect-except',
    title: 'INTERSECT and EXCEPT (MINUS)',
    category: 'sets',
    kind: 'syntax',
    summary: 'Rows in both results, or rows in the first and not the second.',
    tags: ['minus', 'difference', 'set difference', 'common rows'],
    syntax: `SELECT ... INTERSECT SELECT ...   -- in both
SELECT ... EXCEPT    SELECT ...   -- in the first only (Oracle: MINUS)`,
    example: `-- emails on the marketing list that no longer have an account
SELECT email FROM marketing_list
EXCEPT
SELECT email FROM users;`,
    explain: 'Set arithmetic on whole rows. The quickest way to diff two lists without writing a join.',
    notes: [
      'Both remove duplicates unless you add ALL, which not every engine supports.',
      'They treat NULLs as equal, unlike a join predicate, which is often what you want for a diff.',
      'MySQL added INTERSECT and EXCEPT in 8.0.31. Before that, emulate with NOT EXISTS.',
    ],
    dialects: [
      { db: 'Oracle', note: 'EXCEPT is spelled MINUS.' },
    ],
    related: ['union', 'compare-tables', 'anti-join'],
  },

  // ------------------------------------------------------------------- dml
  {
    id: 'insert',
    title: 'INSERT',
    category: 'dml',
    kind: 'syntax',
    summary: 'Add rows, one or many, and get their generated keys back.',
    tags: ['add row', 'create', 'values', 'bulk insert'],
    syntax: `INSERT INTO table_name (col_a, col_b)
VALUES (value_a, value_b),
       (value_a, value_b);`,
    example: `INSERT INTO users (email, name, country, status)
VALUES ('a@example.com', 'Asha', 'IN', 'active'),
       ('b@example.com', 'Bo',   'ZA', 'active')
RETURNING id;`,
    explain:
      'Always name the columns. An INSERT without a column list depends on physical column order, so the next migration silently shifts your values into the wrong columns.',
    notes: [
      'One multi-row INSERT is far faster than N single-row INSERTs: one round trip, one transaction, one index maintenance pass.',
      'For bulk loads of thousands of rows, COPY (PostgreSQL) or LOAD DATA INFILE (MySQL) is an order of magnitude faster again.',
      'Use parameter binding, never string concatenation.',
    ],
    dialects: [
      { db: 'PostgreSQL / SQLite / MariaDB', note: 'RETURNING gives back generated ids in the same statement.' },
      { db: 'SQL Server', note: 'OUTPUT INSERTED.id serves the same purpose.' },
      { db: 'MySQL', note: 'LAST_INSERT_ID() returns the first id of the batch.' },
    ],
    related: ['insert-select', 'upsert', 'returning', 'sql-injection'],
  },
  {
    id: 'insert-select',
    title: 'INSERT ... SELECT',
    category: 'dml',
    kind: 'syntax',
    summary: 'Populate a table from a query instead of from literals.',
    tags: ['copy rows', 'backfill', 'archive', 'etl'],
    syntax: `INSERT INTO target (col_a, col_b)
SELECT col_a, col_b
FROM source
WHERE ...;`,
    example: `-- archive orders older than a year
INSERT INTO orders_archive (id, user_id, total, placed_at)
SELECT id, user_id, total, placed_at
FROM orders
WHERE placed_at < CURRENT_DATE - INTERVAL '1 year';`,
    explain: 'The standard move for backfills, archiving and building denormalised tables: all the work happens inside the database, with no round trip per row.',
    notes: [
      'Column positions must line up between the insert list and the select list; names are not matched.',
      'Batch very large backfills (a few thousand rows per statement) so you do not hold one enormous transaction and bloat the write-ahead log.',
      'Add ON CONFLICT DO NOTHING when re-running a backfill should be safe.',
    ],
    related: ['insert', 'upsert', 'transaction'],
  },
  {
    id: 'update',
    title: 'UPDATE',
    category: 'dml',
    kind: 'syntax',
    summary: 'Change values in existing rows.',
    tags: ['modify', 'set', 'edit rows'],
    syntax: `UPDATE table_name
SET col_a = value_a,
    col_b = value_b
WHERE condition;`,
    example: `UPDATE users
SET status     = 'dormant',
    updated_at = NOW()
WHERE status = 'active'
  AND id NOT IN (SELECT user_id FROM orders WHERE placed_at > CURRENT_DATE - INTERVAL '2 years');`,
    explain: 'Sets new values on every row matching the WHERE clause. All assignments in one statement see the old values, so you can swap two columns in a single SET.',
    notes: [
      'Run the WHERE clause as a SELECT first, and check the row count, before running the UPDATE.',
      'An UPDATE without WHERE rewrites the whole table. Wrap risky statements in an explicit transaction so you can roll back.',
      'Updating an indexed column rewrites its index entries too, which is why bulk updates on hot tables are expensive.',
    ],
    dialects: [
      { db: 'PostgreSQL / SQLite', note: 'RETURNING * shows exactly which rows changed.' },
      { db: 'MySQL', note: 'The safe-updates setting refuses an UPDATE without a key in WHERE. Leave it on for interactive sessions.' },
    ],
    related: ['update-from', 'delete', 'transaction', 'delete-without-where'],
  },
  {
    id: 'update-from',
    title: 'UPDATE from another table',
    category: 'dml',
    kind: 'recipe',
    summary: 'Set a column from a joined table, in every dialect.',
    tags: ['update join', 'update from', 'merge values', 'backfill column'],
    syntax: `-- PostgreSQL
UPDATE t SET col = s.col FROM source s WHERE s.id = t.id;

-- MySQL
UPDATE t JOIN source s ON s.id = t.id SET t.col = s.col;

-- SQL Server
UPDATE t SET col = s.col FROM t JOIN source s ON s.id = t.id;

-- Oracle and portable standard
UPDATE t SET col = (SELECT s.col FROM source s WHERE s.id = t.id)
WHERE EXISTS (SELECT 1 FROM source s WHERE s.id = t.id);`,
    example: `-- denormalise each user's order count onto users
UPDATE users u
SET order_count = agg.n
FROM (
  SELECT user_id, COUNT(*) AS n FROM orders GROUP BY user_id
) agg
WHERE agg.user_id = u.id;`,
    explain: 'The one statement whose syntax differs in every engine. Worth keeping the four forms side by side.',
    notes: [
      'The correlated-subquery form is portable but sets NULL for unmatched rows unless you add the EXISTS guard.',
      'If the source query can return several rows per target row, the engine picks one arbitrarily (or errors, in Oracle). Aggregate first.',
    ],
    related: ['update', 'upsert', 'correlated-subquery'],
  },
  {
    id: 'delete',
    title: 'DELETE',
    category: 'dml',
    kind: 'syntax',
    summary: 'Remove rows, optionally using a join to decide which.',
    tags: ['remove', 'purge', 'delete join', 'cleanup'],
    syntax: `DELETE FROM table_name WHERE condition;

-- with a join
DELETE FROM a USING b WHERE b.a_id = a.id AND b.flag;   -- PostgreSQL
DELETE a FROM a JOIN b ON b.a_id = a.id WHERE b.flag;   -- MySQL / SQL Server`,
    example: `DELETE FROM sessions
WHERE expires_at < NOW() - INTERVAL '30 days';`,
    explain: 'Removes matching rows, firing triggers and cascading foreign keys as it goes.',
    notes: [
      'Delete in batches on a big table (LIMIT or a key range per statement). One giant DELETE holds locks and bloats the log.',
      'DELETE leaves the space allocated. TRUNCATE is the way to empty a table quickly.',
      'A foreign key with ON DELETE RESTRICT makes the statement fail rather than orphan child rows. That is usually what you want.',
    ],
    related: ['truncate', 'delete-duplicates', 'delete-without-where', 'foreign-key'],
  },
  {
    id: 'upsert',
    title: 'Upsert: INSERT ... ON CONFLICT / ON DUPLICATE KEY',
    category: 'dml',
    kind: 'recipe',
    summary: 'Insert a row, or update it if the key already exists, atomically.',
    tags: ['merge', 'insert or update', 'idempotent', 'on conflict'],
    syntax: `-- PostgreSQL / SQLite
INSERT INTO t (id, col) VALUES (...)
ON CONFLICT (id) DO UPDATE SET col = EXCLUDED.col;

-- MySQL
INSERT INTO t (id, col) VALUES (...)
ON DUPLICATE KEY UPDATE col = VALUES(col);`,
    example: `INSERT INTO daily_counters (day, name, hits)
VALUES (CURRENT_DATE, 'signup', 1)
ON CONFLICT (day, name)
DO UPDATE SET hits = daily_counters.hits + 1;`,
    explain:
      'One atomic statement that makes writes idempotent, so a retried request cannot create a duplicate. The alternative (SELECT, then INSERT or UPDATE from the application) has a race between the two statements.',
    notes: [
      'It needs a UNIQUE or PRIMARY KEY constraint on the conflict target. Without one there is nothing to conflict on.',
      'ON CONFLICT DO NOTHING is the idempotent-insert form for re-runnable backfills.',
      'EXCLUDED (PostgreSQL) is the row that was proposed for insertion; reference the table name for the existing values.',
    ],
    dialects: [
      { db: 'SQL Server / Oracle', note: 'Use MERGE. On SQL Server, take a HOLDLOCK on the target or concurrent MERGEs can still deadlock or duplicate.' },
    ],
    related: ['merge', 'insert', 'unique-check', 'transaction'],
  },
  {
    id: 'merge',
    title: 'MERGE',
    category: 'dml',
    kind: 'syntax',
    summary: 'Insert, update and delete in one statement, driven by a source query.',
    tags: ['upsert', 'sync', 'when matched', 'slowly changing dimension'],
    syntax: `MERGE INTO target t
USING source s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET col = s.col
WHEN NOT MATCHED THEN INSERT (id, col) VALUES (s.id, s.col);`,
    example: `MERGE INTO products p
USING staging_products s ON p.id = s.id
WHEN MATCHED AND p.price <> s.price THEN UPDATE SET price = s.price, active = s.active
WHEN NOT MATCHED THEN INSERT (id, name, price, active) VALUES (s.id, s.name, s.price, s.active);`,
    explain: 'The standard way to sync a table from a staging table in one pass. Common in ETL and warehouse loads.',
    notes: [
      'Available in Oracle, SQL Server, PostgreSQL 15 and later, and BigQuery. MySQL has no MERGE.',
      'If the source produces more than one row per target row, MERGE errors instead of picking one. Deduplicate the source first.',
      'For the simple insert-or-update case, ON CONFLICT is shorter and harder to get wrong.',
    ],
    related: ['upsert', 'insert-select', 'transaction'],
  },
  {
    id: 'returning',
    title: 'RETURNING / OUTPUT',
    category: 'dml',
    kind: 'syntax',
    summary: 'Get the affected rows back from an INSERT, UPDATE or DELETE.',
    tags: ['generated id', 'output inserted', 'affected rows'],
    syntax: `INSERT INTO t (...) VALUES (...) RETURNING id, created_at;
UPDATE t SET ... WHERE ... RETURNING *;
DELETE FROM t WHERE ... RETURNING id;`,
    example: `-- claim the next job atomically: no SELECT-then-UPDATE race
UPDATE jobs
SET status = 'running', started_at = NOW()
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'queued'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING id, payload;`,
    explain:
      'Saves a round trip and, more importantly, closes a race: the rows you get back are exactly the rows this statement changed, not what a separate SELECT sees afterwards.',
    notes: [
      'PostgreSQL, SQLite and MariaDB use RETURNING; SQL Server uses OUTPUT INSERTED.* / DELETED.*.',
      'MySQL has neither. Use LAST_INSERT_ID(), and for the update case re-select inside the transaction.',
    ],
    related: ['insert', 'select-for-update', 'transaction'],
  },
  {
    id: 'truncate',
    title: 'TRUNCATE',
    category: 'dml',
    kind: 'syntax',
    summary: 'Empty a table fast. Not a DELETE with a shortcut.',
    tags: ['empty table', 'reset', 'wipe'],
    syntax: `TRUNCATE TABLE table_name;
TRUNCATE TABLE a, b RESTART IDENTITY CASCADE;   -- PostgreSQL`,
    example: `TRUNCATE TABLE staging_products;`,
    explain: 'Deallocates the table storage instead of removing rows one at a time, so it is near-instant regardless of table size.',
    notes: [
      'It does not fire row triggers and usually cannot be filtered with WHERE.',
      'In PostgreSQL it is transactional and can be rolled back; in MySQL and Oracle it is DDL and commits implicitly.',
      'Identity and sequence counters keep going unless you ask for RESTART IDENTITY.',
    ],
    related: ['delete', 'transaction'],
  },
  {
    id: 'transaction',
    title: 'Transactions: BEGIN, COMMIT, ROLLBACK',
    category: 'dml',
    kind: 'syntax',
    summary: 'Group statements so they all take effect, or none do.',
    tags: ['acid', 'atomic', 'savepoint', 'rollback', 'isolation'],
    syntax: `BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK;`,
    example: `BEGIN;
  INSERT INTO orders (user_id, total, status) VALUES (7, 249.00, 'paid') RETURNING id;
  INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (currval('orders_id_seq'), 3, 1, 249.00);
  SAVEPOINT items_done;
COMMIT;`,
    explain:
      'Atomicity for multi-statement writes: a crash or an error between the two updates cannot leave money missing. Any statement that must not half-apply belongs in one.',
    notes: [
      'Keep transactions short. A transaction left open holds locks and, in PostgreSQL, blocks vacuum from cleaning up.',
      'Never wait on a network call (a payment API, another service) inside an open transaction.',
      'SAVEPOINT lets you roll back part of a transaction; ROLLBACK TO savepoint_name returns to that point.',
      'Default isolation is READ COMMITTED in PostgreSQL, Oracle and SQL Server, and REPEATABLE READ in MySQL InnoDB. Read-modify-write logic that assumes otherwise has a race.',
    ],
    related: ['select-for-update', 'update', 'upsert', 'isolation-levels'],
  },
  {
    id: 'isolation-levels',
    title: 'Isolation levels',
    category: 'dml',
    kind: 'practice',
    summary: 'What concurrent transactions are allowed to see of each other.',
    tags: ['read committed', 'repeatable read', 'serializable', 'phantom', 'dirty read'],
    syntax: `SET TRANSACTION ISOLATION LEVEL READ COMMITTED | REPEATABLE READ | SERIALIZABLE;
BEGIN ISOLATION LEVEL SERIALIZABLE;   -- PostgreSQL`,
    example: `-- a read-modify-write that must not lose an update
BEGIN;
  SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;`,
    explain:
      'The level decides which anomalies are possible: dirty reads, non-repeatable reads, phantoms, and lost updates. Higher levels cost concurrency and, at SERIALIZABLE, require your application to retry failed transactions.',
    notes: [
      'READ COMMITTED (the common default) means two reads inside one transaction can return different data.',
      'REPEATABLE READ gives a stable snapshot but does not stop a lost update unless you lock the row.',
      'SERIALIZABLE in PostgreSQL aborts conflicting transactions with a serialization failure. Retrying is your job, and the retry loop is not optional.',
      'When in doubt, take an explicit row lock (SELECT ... FOR UPDATE) instead of raising the isolation level globally.',
    ],
    related: ['transaction', 'select-for-update'],
  },
  {
    id: 'select-for-update',
    title: 'SELECT ... FOR UPDATE / SKIP LOCKED',
    category: 'dml',
    kind: 'syntax',
    summary: 'Lock the rows you read so nobody else can change them until you commit.',
    tags: ['row lock', 'pessimistic locking', 'queue', 'skip locked', 'nowait'],
    syntax: `SELECT ... FROM t WHERE ... FOR UPDATE;
SELECT ... FOR UPDATE NOWAIT;        -- fail instead of waiting
SELECT ... FOR UPDATE SKIP LOCKED;   -- ignore rows someone else locked
SELECT ... FOR SHARE;                -- allow other readers, block writers`,
    example: `-- a work queue several workers can poll without colliding
BEGIN;
  SELECT id, payload
  FROM jobs
  WHERE status = 'queued'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 10;
  -- ... process, then UPDATE their status ...
COMMIT;`,
    explain:
      'Pessimistic locking for read-modify-write. SKIP LOCKED in particular turns an ordinary table into a workable job queue, because each worker takes a different batch instead of queueing behind the first.',
    notes: [
      'The lock lives until COMMIT or ROLLBACK, so keep the transaction short.',
      'Always lock rows in a consistent order across the codebase, or two transactions will deadlock.',
      'SKIP LOCKED means the result is not a consistent snapshot, which is exactly what a queue wants and exactly what a report does not.',
    ],
    dialects: [
      { db: 'PostgreSQL / MySQL 8 / Oracle', note: 'FOR UPDATE SKIP LOCKED is supported.' },
      { db: 'SQL Server', note: 'Use WITH (UPDLOCK, READPAST, ROWLOCK) for the same effect.' },
    ],
    related: ['transaction', 'returning', 'isolation-levels'],
  },

  // ------------------------------------------------------------------- ddl
  {
    id: 'create-table',
    title: 'CREATE TABLE',
    category: 'ddl',
    kind: 'syntax',
    summary: 'Define a table: columns, types, defaults and constraints.',
    tags: ['schema', 'ddl', 'data types', 'migration'],
    syntax: `CREATE TABLE table_name (
  id          BIGSERIAL PRIMARY KEY,
  col_a       TEXT        NOT NULL,
  col_b       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT name_unique UNIQUE (col_a)
);`,
    example: `CREATE TABLE orders (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total      NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  status     TEXT        NOT NULL DEFAULT 'pending',
  placed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
    explain:
      'Constraints in the table definition are the cheapest data quality you will ever buy: the database enforces them for every writer, including the one-off script someone runs at 2am.',
    notes: [
      'NOT NULL by default, nullable by exception. A nullable column is a question every future query has to answer.',
      'Money is NUMERIC/DECIMAL, never FLOAT. Timestamps are TIMESTAMPTZ (or UTC TIMESTAMP), never a local-time string.',
      'Name your constraints. An error mentioning orders_total_check is debuggable; one mentioning chk_2 is not.',
      'Prefer TEXT/VARCHAR without a tight length guess unless the length is a real business rule.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'GENERATED ALWAYS AS IDENTITY is the modern alternative to SERIAL.' },
      { db: 'MySQL', note: 'BIGINT AUTO_INCREMENT, and use utf8mb4 for real Unicode.' },
      { db: 'SQL Server', note: 'BIGINT IDENTITY(1,1), DATETIME2 rather than DATETIME.' },
    ],
    related: ['primary-key', 'foreign-key', 'unique-check', 'alter-table'],
  },
  {
    id: 'primary-key',
    title: 'PRIMARY KEY',
    category: 'ddl',
    kind: 'syntax',
    summary: 'The column (or columns) that uniquely identify a row.',
    tags: ['pk', 'identity', 'uuid', 'composite key', 'surrogate key'],
    syntax: `id BIGSERIAL PRIMARY KEY
-- or, composite
PRIMARY KEY (order_id, product_id)`,
    example: `CREATE TABLE order_items (
  order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  qty        INT    NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);`,
    explain:
      'A primary key is UNIQUE plus NOT NULL, and in most engines it also decides the physical clustering of the table. Every table should have one.',
    notes: [
      'A composite key on a join table is a constraint and an index in one, and it stops duplicate pairs by construction.',
      'Random UUID v4 primary keys scatter writes across the index and hurt on large tables. UUID v7 or ULID keeps them time-ordered.',
      'In MySQL InnoDB every secondary index carries the primary key, so a wide primary key inflates every index on the table.',
    ],
    related: ['create-table', 'foreign-key', 'composite-index'],
  },
  {
    id: 'foreign-key',
    title: 'FOREIGN KEY and ON DELETE',
    category: 'ddl',
    kind: 'syntax',
    summary: 'Point a column at another table and say what happens when the parent goes.',
    tags: ['fk', 'references', 'cascade', 'referential integrity', 'orphan'],
    syntax: `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT
-- ON DELETE CASCADE | SET NULL | RESTRICT | NO ACTION`,
    example: `ALTER TABLE orders
  ADD CONSTRAINT orders_user_fk
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE RESTRICT;`,
    explain:
      'The database guarantees the row you point at exists. Without it you get orphan rows, and every report afterwards has to guess what they meant.',
    notes: [
      'Always index the foreign key column. Most engines do not create that index for you, and without it every parent delete scans the child table.',
      'ON DELETE CASCADE is convenient and dangerous: deleting one parent row can remove millions of children with no warning.',
      'RESTRICT is the safe default. It makes an unintended delete fail loudly instead of quietly removing data.',
    ],
    dialects: [
      { db: 'MySQL', note: 'InnoDB creates an index on the FK column automatically; MyISAM ignores foreign keys entirely.' },
      { db: 'PostgreSQL', note: 'No automatic index. Add it yourself.' },
    ],
    related: ['primary-key', 'fk-index', 'delete', 'orphan-rows'],
  },
  {
    id: 'unique-check',
    title: 'UNIQUE, CHECK, NOT NULL, DEFAULT',
    category: 'ddl',
    kind: 'syntax',
    summary: 'The constraints that keep bad rows out in the first place.',
    tags: ['constraint', 'validation', 'invariant', 'data quality'],
    syntax: `col TEXT NOT NULL DEFAULT 'pending'
CONSTRAINT users_email_unique UNIQUE (email)
CONSTRAINT orders_total_positive CHECK (total >= 0)`,
    example: `ALTER TABLE users
  ADD CONSTRAINT users_email_unique UNIQUE (email),
  ADD CONSTRAINT users_status_valid CHECK (status IN ('active','dormant','banned'));`,
    explain:
      'Application-level validation protects one code path. A constraint protects every code path, including the migration script and the manual fix someone ran during an incident.',
    notes: [
      'A UNIQUE constraint permits multiple NULLs in most engines, because NULLs are not equal to each other. Use a partial unique index if you need at most one NULL-ish row.',
      'A UNIQUE constraint creates an index, so it also speeds up lookups on that column.',
      'Adding a constraint to a large existing table validates every row and takes a lock. In PostgreSQL, add it NOT VALID first and VALIDATE afterwards.',
      'CHECK constraints cannot reference other tables. That job belongs to a foreign key or a trigger.',
    ],
    related: ['create-table', 'upsert', 'partial-index', 'find-duplicates'],
  },
  {
    id: 'alter-table',
    title: 'ALTER TABLE',
    category: 'ddl',
    kind: 'syntax',
    summary: 'Add, drop, rename or retype a column on a live table.',
    tags: ['migration', 'add column', 'drop column', 'rename', 'schema change'],
    syntax: `ALTER TABLE t ADD COLUMN col TEXT;
ALTER TABLE t ALTER COLUMN col SET NOT NULL;
ALTER TABLE t RENAME COLUMN old_name TO new_name;
ALTER TABLE t DROP COLUMN col;`,
    example: `-- safe on a hot table in PostgreSQL 11+
ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';

-- backfill in batches, then tighten
ALTER TABLE users ALTER COLUMN locale DROP DEFAULT;`,
    explain: 'The statement behind every migration, and the one most likely to take an exclusive lock on a table your application is actively reading.',
    notes: [
      'Adding a nullable column, or a column with a constant default, is instant in PostgreSQL 11+ and MySQL 8 with INSTANT DDL. Adding NOT NULL without a default rewrites the table.',
      'Renaming or dropping a column breaks running application code. Deploy in phases: add, dual-write, backfill, switch reads, drop.',
      'Set a short lock_timeout before a migration so a blocked ALTER fails fast instead of queueing every query behind it.',
      'Use pt-online-schema-change or gh-ost on large MySQL tables.',
    ],
    related: ['create-table', 'unique-check', 'create-index'],
  },
  {
    id: 'view',
    title: 'CREATE VIEW',
    category: 'ddl',
    kind: 'syntax',
    summary: 'A saved query that behaves like a table.',
    tags: ['virtual table', 'abstraction', 'reporting'],
    syntax: `CREATE VIEW view_name AS
SELECT ...;

CREATE OR REPLACE VIEW view_name AS SELECT ...;`,
    example: `CREATE VIEW paid_orders AS
SELECT o.*, u.email, u.country
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid';`,
    explain:
      'Stores the query text, not the rows: every reference re-runs it. Useful for giving reporting users a clean, pre-joined surface and for hiding columns they should not see.',
    notes: [
      'A view adds no speed. A view over a view over a view usually removes some.',
      'Simple single-table views are often updatable; anything with a join or an aggregate is read-only unless you add INSTEAD OF triggers.',
      'CREATE OR REPLACE cannot change the column list or types. Drop and recreate for that.',
    ],
    related: ['materialized-view', 'cte', 'temp-table'],
  },
  {
    id: 'materialized-view',
    title: 'Materialized view',
    category: 'ddl',
    kind: 'syntax',
    summary: 'A view whose result is stored on disk and refreshed on demand.',
    tags: ['cache', 'precomputed', 'refresh', 'rollup', 'reporting'],
    syntax: `CREATE MATERIALIZED VIEW mv AS SELECT ...;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv;   -- PostgreSQL`,
    example: `CREATE MATERIALIZED VIEW daily_revenue AS
SELECT DATE_TRUNC('day', placed_at) AS day,
       SUM(total)                   AS revenue,
       COUNT(*)                     AS orders
FROM orders
WHERE status = 'paid'
GROUP BY 1;

CREATE UNIQUE INDEX ON daily_revenue (day);   -- required for CONCURRENTLY`,
    explain:
      'Trades freshness for speed: an expensive aggregate runs on a schedule instead of on every dashboard load.',
    notes: [
      'The data is as stale as your last refresh. Show the refresh time on the dashboard, or someone will make a decision on yesterday.',
      'REFRESH ... CONCURRENTLY avoids locking readers but needs a unique index and is slower.',
      'MySQL has no materialized views. Use a summary table maintained by a scheduled job or triggers.',
    ],
    related: ['view', 'temp-table', 'explain'],
  },
  {
    id: 'temp-table',
    title: 'Temporary tables',
    category: 'ddl',
    kind: 'syntax',
    summary: 'A real table scoped to your session, useful for staging a multi-step job.',
    tags: ['staging', 'scratch', 'session', 'batch'],
    syntax: `CREATE TEMP TABLE tmp_ids (id BIGINT PRIMARY KEY);
CREATE TEMP TABLE tmp AS SELECT ... ;   -- CTAS
-- SQL Server: CREATE TABLE #tmp (...)`,
    example: `CREATE TEMP TABLE tmp_target AS
SELECT id FROM users WHERE status = 'dormant';

CREATE INDEX ON tmp_target (id);
ANALYZE tmp_target;

UPDATE users u SET archived = TRUE
FROM tmp_target t WHERE t.id = u.id;`,
    explain:
      'When a CTE is evaluated more than once, or the optimiser badly misestimates it, staging the rows in a temp table you can index and ANALYZE gives the planner real statistics to work with.',
    notes: [
      'Dropped automatically at the end of the session (or the transaction, with ON COMMIT DROP).',
      'This is also how you get a big IN list out of a query: load the ids into a temp table and join.',
      'In PostgreSQL, heavy temp-table churn creates catalog bloat. Do not use them as a per-request cache.',
    ],
    related: ['cte', 'in', 'insert-select', 'analyze-stats'],
  },

  // ----------------------------------------------------------- performance
  {
    id: 'create-index',
    title: 'CREATE INDEX',
    category: 'performance',
    kind: 'syntax',
    summary: 'The single biggest lever on query speed, and not free.',
    tags: ['b-tree', 'speed', 'lookup', 'concurrently'],
    syntax: `CREATE INDEX idx_name ON table_name (column);
CREATE INDEX CONCURRENTLY idx_name ON t (col);   -- PostgreSQL, no write lock
CREATE UNIQUE INDEX ...`,
    example: `CREATE INDEX idx_orders_user_placed
  ON orders (user_id, placed_at DESC);`,
    explain:
      'An index is a sorted copy of some columns with pointers back to the rows. It turns a full scan into a lookup, and it must be updated by every INSERT, UPDATE and DELETE that touches those columns.',
    notes: [
      'Index the columns you filter, join and sort on. Do not index everything: each index costs write throughput and disk.',
      'On a live table use CREATE INDEX CONCURRENTLY (PostgreSQL) or an online DDL tool, or you lock out writers for the duration.',
      'An index on a low-cardinality column (a two-value status) rarely helps on its own, but does as the second column of a composite index.',
      'Drop indexes nothing uses. pg_stat_user_indexes and sys.dm_db_index_usage_stats show which those are.',
    ],
    related: ['composite-index', 'partial-index', 'covering-index', 'explain', 'fk-index'],
  },
  {
    id: 'composite-index',
    title: 'Composite index column order',
    category: 'performance',
    kind: 'practice',
    summary: 'Equality columns first, then the range or sort column. Order decides everything.',
    tags: ['multi-column', 'leftmost prefix', 'index order'],
    syntax: `CREATE INDEX idx ON t (equality_col, range_or_sort_col);`,
    example: `-- serves: WHERE user_id = ? ORDER BY placed_at DESC LIMIT 20
CREATE INDEX idx_orders_user_placed ON orders (user_id, placed_at DESC);

-- does NOT serve: WHERE placed_at > ?   (user_id is not in the predicate)`,
    explain:
      'A composite index is sorted by the first column, then the second within it. A query can use any leftmost prefix of the columns, and nothing else.',
    notes: [
      'An index on (a, b) serves queries on a, and on a plus b, but not on b alone.',
      'Put the equality predicate first. Once a range predicate is used, later columns can no longer narrow the scan, only avoid a sort.',
      'Matching the ORDER BY direction in the index lets the engine skip the sort entirely, which is what makes a LIMIT query fast.',
      'Two separate single-column indexes are not equivalent to one composite index, even when the engine can combine them.',
    ],
    related: ['create-index', 'covering-index', 'keyset-pagination', 'explain'],
  },
  {
    id: 'partial-index',
    title: 'Partial (filtered) index',
    category: 'performance',
    kind: 'syntax',
    summary: 'Index only the rows you actually query.',
    tags: ['filtered index', 'where clause index', 'soft delete', 'sparse'],
    syntax: `CREATE INDEX idx ON t (col) WHERE condition;            -- PostgreSQL / SQLite
CREATE INDEX idx ON t (col) WHERE condition;            -- SQL Server: filtered index`,
    example: `-- a queue table where only pending rows are ever scanned
CREATE INDEX idx_jobs_pending
  ON jobs (created_at)
  WHERE status = 'queued';

-- at most one active subscription per user
CREATE UNIQUE INDEX uq_active_sub
  ON subscriptions (user_id)
  WHERE cancelled_at IS NULL;`,
    explain:
      'Smaller index, cheaper writes, and it enforces conditional uniqueness that a plain UNIQUE constraint cannot express.',
    notes: [
      'The query predicate must match the index predicate for the planner to use it.',
      'Ideal for soft-deleted tables (WHERE deleted_at IS NULL) and for status columns where one value dominates.',
      'MySQL has no partial indexes. Emulate with a generated column plus an index on it.',
    ],
    related: ['create-index', 'unique-check', 'sargable'],
  },
  {
    id: 'covering-index',
    title: 'Covering index (index-only scan)',
    category: 'performance',
    kind: 'practice',
    summary: 'Put every column the query needs in the index so the table is never touched.',
    tags: ['include', 'index only scan', 'avoid lookup'],
    syntax: `CREATE INDEX idx ON t (filter_col) INCLUDE (selected_col);   -- PostgreSQL 11+, SQL Server
CREATE INDEX idx ON t (filter_col, selected_col);            -- everywhere else`,
    example: `-- SELECT email FROM users WHERE country = 'IN'
CREATE INDEX idx_users_country_email ON users (country) INCLUDE (email);`,
    explain:
      'Normally the engine finds a row in the index and then reads the table page for the remaining columns. If the index already holds every column the query mentions, that second read disappears.',
    notes: [
      'INCLUDE columns are stored only in the leaf pages, so they add less overhead than making them key columns.',
      'PostgreSQL also needs the visibility map to be current for a true index-only scan, which means the table has to have been vacuumed.',
      'Covering a SELECT * is not possible in practice. This is another reason to name your columns.',
    ],
    related: ['composite-index', 'no-select-star', 'explain'],
  },
  {
    id: 'explain',
    title: 'EXPLAIN / EXPLAIN ANALYZE',
    category: 'performance',
    kind: 'practice',
    summary: 'Ask the database what it plans to do, or what it actually did.',
    tags: ['query plan', 'execution plan', 'seq scan', 'profiling', 'slow query'],
    syntax: `EXPLAIN SELECT ...;                           -- the plan
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;        -- PostgreSQL: run it and report
EXPLAIN ANALYZE SELECT ...;                   -- MySQL 8.0.18+`,
    example: `EXPLAIN (ANALYZE, BUFFERS)
SELECT u.email, COUNT(*)
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.country = 'IN'
GROUP BY u.email;`,
    explain:
      'The only honest answer to why is this slow. Read it bottom-up: the innermost node runs first, and each node reports estimated rows and, with ANALYZE, actual rows and time.',
    notes: [
      'The single most useful signal is a large gap between estimated and actual rows. That means stale or missing statistics, and every join choice above it is built on a bad guess.',
      'A sequential scan is not automatically wrong. On a small table, or when you are reading most of it, it is the right plan.',
      'EXPLAIN ANALYZE actually executes the query. Wrap a write in BEGIN ... ROLLBACK.',
      'Look for: nested loops over large row counts, sorts spilling to disk, and filters that discard most of what they read.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT). Paste the output into explain.dalibo.com to read it visually.' },
      { db: 'MySQL', note: 'EXPLAIN FORMAT=JSON gives cost details; EXPLAIN ANALYZE runs it.' },
      { db: 'SQL Server', note: 'SET STATISTICS IO, TIME ON, plus the actual execution plan.' },
    ],
    related: ['sargable', 'analyze-stats', 'create-index', 'n-plus-one'],
  },
  {
    id: 'sargable',
    title: 'Keep predicates sargable',
    category: 'performance',
    kind: 'practice',
    summary: 'An index is only used when the indexed column sits bare on one side of the comparison.',
    tags: ['index usage', 'function on column', 'implicit cast', 'seek vs scan'],
    syntax: `-- not sargable                      -- sargable
WHERE DATE(placed_at) = '2026-09-01'  ->  WHERE placed_at >= DATE '2026-09-01'
                                            AND placed_at <  DATE '2026-09-02'
WHERE UPPER(email) = 'A@B.COM'        ->  WHERE email = 'a@b.com'  (or index UPPER(email))
WHERE total * 1.2 > 100               ->  WHERE total > 100 / 1.2
WHERE col LIKE '%term%'               ->  WHERE col LIKE 'term%'`,
    example: `-- rewrite that lets idx_orders_placed_at do its job
SELECT id, total
FROM orders
WHERE placed_at >= DATE '2026-09-01'
  AND placed_at <  DATE '2026-10-01';`,
    explain:
      'Wrapping the column in a function or arithmetic hides its value from the index, so the engine has to compute the expression for every row. Move the work to the other side of the comparison.',
    notes: [
      'When you genuinely need the function, index the expression itself: CREATE INDEX ON users ((lower(email))).',
      'An implicit type cast (comparing a VARCHAR column to a number) is the invisible version of this problem and is a classic MySQL index-killer.',
      'OR across different columns often defeats indexing too. A UNION ALL of two indexed queries can be far faster.',
    ],
    related: ['create-index', 'like', 'cast', 'implicit-conversion', 'explain'],
  },
  {
    id: 'no-select-star',
    title: 'Do not SELECT * in application code',
    category: 'performance',
    kind: 'practice',
    summary: 'Name your columns: less I/O, stable contracts, and index-only scans stay possible.',
    tags: ['projection', 'bandwidth', 'toast', 'contract'],
    syntax: `SELECT id, email, status FROM users WHERE ...;`,
    example: `-- pulls a 2 MB description column you never render
SELECT * FROM products WHERE category = 'laptops';

-- pulls what the page actually shows
SELECT id, name, price FROM products WHERE category = 'laptops';`,
    explain:
      'Every extra column is bytes read from disk, bytes over the wire, and bytes parsed by the driver. Large text or JSON columns make that difference enormous.',
    notes: [
      'A covering index can serve a named list of columns without touching the table. It can never cover *.',
      'When someone adds a column, * changes the shape of your result and can break positional code or overflow a row cache.',
      'Exploring interactively is the exception. Ship named columns.',
    ],
    related: ['select-star', 'covering-index', 'explain'],
  },
  {
    id: 'exists-vs-in',
    title: 'EXISTS vs IN vs JOIN',
    category: 'performance',
    kind: 'practice',
    summary: 'Three ways to ask the same question, with different NULL behaviour and different plans.',
    tags: ['semi join', 'subquery', 'duplicates', 'distinct'],
    syntax: `WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)   -- semi join, no fan-out
WHERE a.id IN (SELECT a_id FROM b)                    -- same, unsafe when negated
JOIN b ON b.a_id = a.id                               -- duplicates a when b matches twice`,
    example: `-- correct: one row per user, whatever the order count
SELECT u.id, u.email
FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`,
    explain:
      'For does a match exist, EXISTS and IN both compile to a semi join in modern optimisers, so the choice is about readability and NULL safety. A plain JOIN is different: it multiplies rows.',
    notes: [
      'If you find yourself writing SELECT DISTINCT because a join duplicated rows, you wanted EXISTS.',
      'NOT IN over a nullable column returns nothing. NOT EXISTS is always the safe negation.',
      'When you need columns from the other table, you need the join. When you only need the yes/no, use EXISTS.',
    ],
    related: ['exists', 'in', 'not-in-null', 'join-fanout', 'distinct-crutch'],
  },
  {
    id: 'keyset-pagination',
    title: 'Keyset pagination (seek method)',
    category: 'performance',
    kind: 'recipe',
    summary: 'Page through a large table in constant time, instead of OFFSET getting slower every page.',
    tags: ['cursor pagination', 'infinite scroll', 'seek', 'deep paging'],
    syntax: `SELECT ... FROM t
WHERE (sort_col, id) < (last_sort_value, last_id)   -- row comparison, DESC order
ORDER BY sort_col DESC, id DESC
LIMIT 20;`,
    example: `-- first page
SELECT id, placed_at, total
FROM orders
ORDER BY placed_at DESC, id DESC
LIMIT 20;

-- next page: pass the last row's values back in
SELECT id, placed_at, total
FROM orders
WHERE (placed_at, id) < (TIMESTAMP '2026-09-14 10:05:00', 88213)
ORDER BY placed_at DESC, id DESC
LIMIT 20;`,
    explain:
      'OFFSET 100000 makes the database produce and discard 100,000 rows. Keyset pagination asks for the rows after the last one you saw, so with a matching index every page costs the same as the first.',
    notes: [
      'Needs an index matching the ORDER BY, including direction, and a unique tiebreaker column.',
      'Row-value comparison ((a, b) < (x, y)) is supported in PostgreSQL and MySQL 8. Elsewhere expand it: a < x OR (a = x AND b < y).',
      'Trade-off: no jump-to-page-57. That is fine for infinite scroll, APIs and export jobs, which is where deep paging actually happens.',
    ],
    related: ['limit-offset', 'composite-index', 'order-by'],
  },
  {
    id: 'n-plus-one',
    title: 'The N+1 query problem',
    category: 'performance',
    kind: 'practice',
    summary: 'One query for the list, then one more per row. The commonest ORM performance bug.',
    tags: ['orm', 'eager loading', 'batching', 'round trip', 'latency'],
    syntax: `-- instead of one query per parent row
SELECT * FROM orders WHERE user_id IN (1, 2, 3, ...);   -- one batched query
-- or join and let the database do the work`,
    example: `-- 1 + N round trips from application code
-- for u in users: SELECT COUNT(*) FROM orders WHERE user_id = u.id

-- one round trip
SELECT u.id, u.email, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email;`,
    explain:
      'Each query may be fast; the problem is the round trips. At 1 ms of latency, 500 rows costs half a second of pure waiting before the database has done any real work.',
    notes: [
      'Fix it by eager-loading (the ORM include/preload/joins mechanism) or by batching the ids into one IN query.',
      'It hides well in code review and shows up instantly in the query log: the same statement with different parameters, hundreds of times per request.',
      'Watch out for the reverse over-correction: joining a dozen tables to avoid two queries produces enormous fan-out.',
    ],
    related: ['correlated-subquery', 'in', 'join-fanout', 'explain'],
  },
  {
    id: 'fk-index',
    title: 'Index every foreign key',
    category: 'performance',
    kind: 'practice',
    summary: 'The missing index nobody notices until a parent delete locks the table.',
    tags: ['foreign key index', 'cascade', 'lock', 'join performance'],
    syntax: `CREATE INDEX idx_orders_user_id ON orders (user_id);`,
    example: `-- find PostgreSQL foreign keys with no supporting index
SELECT c.conrelid::regclass AS table_name, a.attname AS column_name
FROM pg_constraint c
JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND i.indkey[0] = k.attnum
  );`,
    explain:
      'PostgreSQL, Oracle and SQL Server do not index a foreign key column for you. Without that index, deleting or updating a parent row scans the whole child table to check for references, while holding a lock.',
    notes: [
      'It also makes the join you will inevitably write in that direction fast.',
      'MySQL InnoDB creates the index automatically, which is why the problem surprises people moving to PostgreSQL.',
      'A composite index starting with the FK column counts. A composite index where it appears second does not.',
    ],
    related: ['foreign-key', 'create-index', 'composite-index'],
  },
  {
    id: 'analyze-stats',
    title: 'Statistics: ANALYZE and why plans go bad',
    category: 'performance',
    kind: 'practice',
    summary: 'The planner chooses from estimates. Stale estimates produce bad plans.',
    tags: ['vacuum', 'statistics', 'cardinality', 'autovacuum', 'histogram'],
    syntax: `ANALYZE table_name;                    -- PostgreSQL
ANALYZE TABLE table_name;              -- MySQL
UPDATE STATISTICS table_name;          -- SQL Server`,
    example: `-- after a large bulk load, before running reports on it
ANALYZE orders;

-- tell PostgreSQL to keep more detail on a skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;`,
    explain:
      'The optimiser decides index-vs-scan and which join algorithm to use from row-count estimates built by sampling the table. After a bulk load or a big delete those samples are wrong, and a plan that was fine yesterday collapses.',
    notes: [
      'A big estimated-versus-actual gap in EXPLAIN ANALYZE is the signature. Run ANALYZE and re-check before changing the query.',
      'Autovacuum handles this in steady state, but not immediately after a load of millions of rows.',
      'Correlated columns (city and postcode) break the independence assumption. PostgreSQL has CREATE STATISTICS for exactly that case.',
    ],
    related: ['explain', 'temp-table', 'create-index'],
  },

  // ------------------------------------------------------------- functions
  {
    id: 'date-truncate',
    title: 'DATE_TRUNC / grouping by day, week, month',
    category: 'functions',
    kind: 'syntax',
    summary: 'Round a timestamp down to a day, week or month so you can group by it.',
    tags: ['group by day', 'date_format', 'date_trunc', 'month', 'bucket'],
    syntax: `DATE_TRUNC('month', ts)                 -- PostgreSQL
DATE_FORMAT(ts, '%Y-%m-01')             -- MySQL
DATEFROMPARTS(YEAR(ts), MONTH(ts), 1)   -- SQL Server
TRUNC(ts, 'MM')                         -- Oracle`,
    example: `SELECT DATE_TRUNC('day', placed_at) AS day,
       COUNT(*)                     AS orders,
       SUM(total)                   AS revenue
FROM orders
WHERE placed_at >= DATE '2026-09-01'
  AND placed_at <  DATE '2026-10-01'
GROUP BY 1
ORDER BY 1;`,
    explain: 'The backbone of every time-series report: collapse timestamps to a bucket, then group by that bucket.',
    notes: [
      'Truncate in the SELECT and GROUP BY, never in WHERE. A function on the column in WHERE kills the index; use a half-open range instead.',
      'Weeks start on Monday in PostgreSQL DATE_TRUNC, but on Sunday in several other engines. Check before comparing dashboards.',
      'Days with no rows simply do not appear. Left-join a generated date series to fill the gaps.',
    ],
    related: ['date-arithmetic', 'zero-fill-dates', 'sargable', 'extract-datepart'],
  },
  {
    id: 'date-arithmetic',
    title: 'Date arithmetic and intervals',
    category: 'functions',
    kind: 'syntax',
    summary: 'Add, subtract and difference dates without an off-by-one.',
    tags: ['interval', 'dateadd', 'datediff', 'age', 'last 30 days'],
    syntax: `ts + INTERVAL '7 days'          -- PostgreSQL / MySQL (INTERVAL 7 DAY)
DATEADD(day, 7, ts)             -- SQL Server
DATEDIFF(day, start, end)       -- SQL Server / MySQL (2-arg)
end_ts - start_ts               -- PostgreSQL: yields an interval`,
    example: `-- orders in the last 30 days, index-friendly
SELECT COUNT(*)
FROM orders
WHERE placed_at >= NOW() - INTERVAL '30 days';

-- days between signup and first order
SELECT u.id,
       MIN(o.placed_at)::date - u.created_at::date AS days_to_first_order
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.created_at;`,
    explain: 'Every engine spells this differently, and the argument order of DATEDIFF is a reliable source of sign errors.',
    notes: [
      'MySQL DATEDIFF(a, b) returns a minus b in days; SQL Server DATEDIFF(unit, a, b) returns b minus a. They are backwards from each other.',
      'Adding a month to 31 January gives 28 or 29 February in most engines. Month arithmetic is not reversible.',
      'CURRENT_DATE is a date, NOW() is a timestamp. Mixing them silently drops or adds a time component.',
    ],
    related: ['date-truncate', 'timezones', 'between'],
  },
  {
    id: 'extract-datepart',
    title: 'EXTRACT / DATE_PART',
    category: 'functions',
    kind: 'syntax',
    summary: 'Pull the year, month, hour or day-of-week out of a timestamp.',
    tags: ['year', 'month', 'dow', 'hour', 'datepart', 'weekday'],
    syntax: `EXTRACT(YEAR FROM ts)        -- standard
DATE_PART('dow', ts)         -- PostgreSQL: 0 = Sunday
DATEPART(weekday, ts)        -- SQL Server
YEAR(ts), MONTH(ts)          -- MySQL shorthands`,
    example: `-- when do orders actually come in?
SELECT EXTRACT(HOUR FROM placed_at) AS hour_of_day,
       COUNT(*)                     AS orders
FROM orders
GROUP BY 1
ORDER BY 1;`,
    explain: 'Useful for seasonality: hour of day, day of week, month of year. Not for building date buckets, which is DATE_TRUNC territory.',
    notes: [
      'Grouping by EXTRACT(MONTH ...) alone merges the same month across different years. Group by DATE_TRUNC when you mean a real timeline.',
      'Day-of-week numbering differs: PostgreSQL dow is 0 to 6 from Sunday, isodow is 1 to 7 from Monday, SQL Server depends on DATEFIRST.',
      'EXTRACT(EPOCH FROM interval) converts a duration to seconds in PostgreSQL.',
    ],
    related: ['date-truncate', 'date-arithmetic'],
  },
  {
    id: 'timezones',
    title: 'Time zones: storing and converting',
    category: 'functions',
    kind: 'practice',
    summary: 'Store UTC, convert at the edges, and be careful what a day means.',
    tags: ['utc', 'timestamptz', 'at time zone', 'ist', 'dst', 'offset'],
    syntax: `ts AT TIME ZONE 'Asia/Kolkata'                 -- PostgreSQL
CONVERT_TZ(ts, '+00:00', '+05:30')             -- MySQL
ts AT TIME ZONE 'India Standard Time'          -- SQL Server 2016+`,
    example: `-- daily revenue in IST from timestamps stored in UTC
SELECT DATE_TRUNC('day', placed_at AT TIME ZONE 'Asia/Kolkata') AS ist_day,
       SUM(total)                                               AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;`,
    explain:
      'A timestamp without a zone is ambiguous the moment it crosses a border. Store UTC (TIMESTAMPTZ in PostgreSQL), convert only for display and for day-boundary reporting.',
    notes: [
      'Use named zones (Asia/Kolkata), not fixed offsets. An offset does not know about daylight saving.',
      'A day is a zone-dependent concept. Revenue grouped in UTC and revenue grouped in IST will not match, and both are correct.',
      'PostgreSQL TIMESTAMPTZ stores an instant, not a zone. Keep the user zone in its own column if you need to render it back.',
      'MySQL CONVERT_TZ returns NULL unless the time-zone tables are loaded.',
    ],
    related: ['date-truncate', 'date-arithmetic', 'create-table'],
  },
  {
    id: 'string-functions',
    title: 'String functions',
    category: 'functions',
    kind: 'syntax',
    summary: 'Concatenate, slice, trim, pad, replace, change case.',
    tags: ['concat', 'substring', 'trim', 'replace', 'lpad', 'length', 'upper'],
    syntax: `a || b  |  CONCAT(a, b)      SUBSTRING(s FROM 1 FOR 3)   LENGTH(s)
TRIM(BOTH ' ' FROM s)         REPLACE(s, 'a', 'b')        LPAD(s, 6, '0')
UPPER(s) / LOWER(s)           POSITION('x' IN s)          LEFT(s, 3) / RIGHT(s, 3)`,
    example: `SELECT id,
       LOWER(TRIM(email))                          AS email_normalised,
       SPLIT_PART(email, '@', 2)                   AS domain,
       LPAD(id::text, 8, '0')                      AS padded_ref,
       LEFT(name, 1) || '. ' || SPLIT_PART(name, ' ', 2) AS short_name
FROM users;`,
    explain: 'The everyday text toolkit: normalising input, deriving a display value, building a reference number.',
    notes: [
      'CONCAT ignores NULL arguments; the || operator returns NULL if any operand is NULL. That difference silently blanks out rows.',
      'String positions are 1-based in SQL, not 0-based.',
      'Normalise on write (store the lowercased email) rather than calling LOWER in every WHERE clause, which defeats the index.',
    ],
    dialects: [
      { db: 'PostgreSQL', note: 'SPLIT_PART(s, delim, n) and STRING_TO_ARRAY are the splitting tools.' },
      { db: 'MySQL', note: 'SUBSTRING_INDEX(s, delim, n); no || operator by default.' },
      { db: 'SQL Server', note: 'Use + to concatenate, or CONCAT; STRING_SPLIT for splitting.' },
    ],
    related: ['split-string', 'like', 'sargable', 'coalesce'],
  },
  {
    id: 'split-string',
    title: 'Splitting a delimited string into rows',
    category: 'functions',
    kind: 'recipe',
    summary: 'Turn a comma-separated column, or a parameter, into one row per value.',
    tags: ['unnest', 'string_split', 'csv column', 'explode', 'array'],
    syntax: `SELECT UNNEST(STRING_TO_ARRAY(s, ','))            -- PostgreSQL
SELECT value FROM STRING_SPLIT(@s, ',')           -- SQL Server 2016+
JOIN JSON_TABLE(CONCAT('["', REPLACE(s, ',', '","'), '"]'), ...)  -- MySQL 8`,
    example: `-- one row per tag from a legacy comma-separated column
SELECT p.id, TRIM(tag) AS tag
FROM products p
CROSS JOIN LATERAL UNNEST(STRING_TO_ARRAY(p.tags, ',')) AS tag;`,
    explain: 'The usual fix for a legacy denormalised column, and the usual way to pass a list into a query as a single parameter.',
    notes: [
      'Trim the parts. Values separated by comma-space carry a leading space you will otherwise join on.',
      'If you control the schema, store a child table or a native array instead. A delimited column cannot be indexed or constrained.',
      'STRING_SPLIT in SQL Server did not guarantee ordering before the ordinal column arrived in 2022.',
    ],
    related: ['string-functions', 'json-query', 'cross-join'],
  },
  {
    id: 'json-query',
    title: 'Querying JSON columns',
    category: 'functions',
    kind: 'syntax',
    summary: 'Reach into a JSON document stored in a column, and index the path you filter on.',
    tags: ['jsonb', 'json_extract', 'json_value', 'arrow operator', 'gin'],
    syntax: `col->>'key'          -- PostgreSQL: value as text
col->'a'->>'b'       -- nested
col @> '{"k":"v"}'   -- containment, GIN-indexable
JSON_VALUE(col, '$.a.b')     -- SQL Server / Oracle / MySQL
col->>'$.a.b'                -- MySQL shorthand`,
    example: `-- filter and project from a jsonb payload
SELECT id,
       payload->>'event'                    AS event,
       (payload->'amount')::numeric         AS amount
FROM events
WHERE payload @> '{"event":"checkout"}';

CREATE INDEX idx_events_payload ON events USING GIN (payload jsonb_path_ops);`,
    explain:
      'JSON columns are the right answer for genuinely variable payloads (webhooks, audit trails, feature flags) and the wrong answer for fields every row has.',
    notes: [
      'In PostgreSQL use jsonb, not json: jsonb is parsed, indexable and deduplicated. json is a text blob.',
      'A GIN index supports containment (@>) and key-exists; a B-tree index on a single extracted expression supports equality on that path.',
      'Anything you filter on in every query deserves a real column. You can keep both, with a generated column that extracts it.',
    ],
    dialects: [
      { db: 'MySQL', note: 'Index a JSON path by adding a generated column and indexing that.' },
    ],
    related: ['json-build', 'string-functions', 'create-index'],
  },
  {
    id: 'json-build',
    title: 'Building JSON in SQL',
    category: 'functions',
    kind: 'recipe',
    summary: 'Return a nested document from one query instead of stitching it in application code.',
    tags: ['json_agg', 'json_build_object', 'for json', 'nested api response'],
    syntax: `JSON_BUILD_OBJECT('k', v)       JSON_AGG(expr)        -- PostgreSQL
JSON_OBJECT('k', v)             JSON_ARRAYAGG(expr)   -- MySQL 8 / standard
FOR JSON PATH                                           -- SQL Server`,
    example: `-- one row per order, with its items nested
SELECT JSON_BUILD_OBJECT(
         'id',    o.id,
         'total', o.total,
         'items', COALESCE(JSON_AGG(JSON_BUILD_OBJECT('product', p.name, 'qty', i.qty))
                           FILTER (WHERE i.id IS NOT NULL), '[]')
       ) AS order_json
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
LEFT JOIN products p    ON p.id = i.product_id
GROUP BY o.id, o.total;`,
    explain: 'Collapses the classic parent-plus-children round trip into a single query, which is often the simplest fix for an N+1.',
    notes: [
      'JSON_AGG over a LEFT JOIN with no matches yields [null]. The FILTER plus COALESCE combination above returns an empty array instead.',
      'Keep it for API edges and exports. Aggregating JSON in the middle of a pipeline hides the data from the planner.',
    ],
    related: ['json-query', 'string-agg', 'n-plus-one'],
  },

  // --------------------------------------------------------------- recipes
  {
    id: 'find-duplicates',
    title: 'Find duplicate rows',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Which values appear more than once, and how many times.',
    tags: ['duplicates', 'dedupe', 'data quality', 'group by having'],
    syntax: `SELECT key_columns, COUNT(*) AS copies
FROM t
GROUP BY key_columns
HAVING COUNT(*) > 1;`,
    example: `-- duplicate emails, with the ids involved
SELECT LOWER(TRIM(email)) AS email,
       COUNT(*)           AS copies,
       MIN(id)            AS keep_id,
       STRING_AGG(id::text, ',' ORDER BY id) AS all_ids
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY copies DESC;`,
    explain: 'Group by whatever should have been unique and keep the groups bigger than one. Normalise (lower, trim) in the GROUP BY or near-duplicates slip through.',
    notes: [
      'Run this before adding a UNIQUE constraint, because the constraint will fail on the first duplicate.',
      'To see the full duplicate rows rather than the keys, use COUNT(*) OVER (PARTITION BY key) > 1 in a derived table.',
    ],
    related: ['delete-duplicates', 'having', 'unique-check'],
  },
  {
    id: 'delete-duplicates',
    title: 'Delete duplicates, keeping one',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Keep the oldest (or newest) row per key and remove the rest.',
    tags: ['dedupe', 'cleanup', 'row_number', 'purge'],
    syntax: `DELETE FROM t
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY key_cols ORDER BY tie_break) AS rn
    FROM t
  ) d WHERE rn > 1
);`,
    example: `-- keep the lowest id per email
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY id) AS rn
    FROM users
  ) d
  WHERE rn > 1
);`,
    explain: 'ROW_NUMBER decides which copy survives; everything numbered above 1 goes. The ORDER BY is the policy: oldest wins, newest wins, most complete wins.',
    notes: [
      'Run the inner SELECT on its own first and read the rows you are about to destroy. Then wrap the DELETE in a transaction.',
      'Child rows may point at the copies you are deleting. Repoint them first, or the foreign key will stop you (which is the constraint doing its job).',
      'MySQL cannot read the same table it deletes from in a subquery. Wrap it in one more derived table, or stage the ids in a temp table.',
      'PostgreSQL alternative: DELETE ... USING with a self join on ctid.',
    ],
    related: ['find-duplicates', 'row-number', 'transaction', 'unique-check'],
  },
  {
    id: 'nth-highest',
    title: 'Nth highest value',
    category: 'recipes',
    kind: 'recipe',
    summary: 'The classic interview question, and what ties do to it.',
    tags: ['second highest', 'third highest', 'salary', 'dense_rank', 'top'],
    syntax: `SELECT MAX(col) FROM t WHERE col < (SELECT MAX(col) FROM t);     -- 2nd, no ties
SELECT DISTINCT col FROM t ORDER BY col DESC OFFSET n-1 LIMIT 1;  -- nth distinct
-- or DENSE_RANK`,
    example: `-- third highest distinct order total
SELECT total
FROM (
  SELECT total, DENSE_RANK() OVER (ORDER BY total DESC) AS position
  FROM orders
) r
WHERE position = 3
LIMIT 1;`,
    explain: 'Say what you mean by Nth: the Nth distinct value, or the Nth row. DENSE_RANK gives distinct values; ROW_NUMBER gives rows.',
    notes: [
      'The OFFSET form is the shortest and is fine for small tables. It still has to sort everything.',
      'Return no row rather than NULL when fewer than N values exist: the aggregate form silently gives NULL.',
    ],
    related: ['rank', 'row-number', 'limit-offset'],
  },
  {
    id: 'top-n-per-group',
    title: 'Top N rows per group',
    category: 'recipes',
    kind: 'recipe',
    summary: 'The three most recent orders for every user, in one query.',
    tags: ['per group', 'greatest n per group', 'leaderboard', 'lateral'],
    syntax: `SELECT * FROM (
  SELECT t.*, ROW_NUMBER() OVER (PARTITION BY key ORDER BY sort_col DESC) AS rn
  FROM t
) x
WHERE rn <= n;`,
    example: `-- top 3 products per category by price
SELECT category, name, price
FROM (
  SELECT p.*,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC, id) AS rn
  FROM products p
  WHERE active
) r
WHERE rn <= 3
ORDER BY category, rn;`,
    explain: 'The window-function answer to greatest-n-per-group: number the rows within each group, then keep the first n.',
    notes: [
      'With an index on (group, sort_col DESC), the LATERAL form can be much faster on wide tables because it stops after n rows per group.',
      'Use RANK instead of ROW_NUMBER if you want to keep ties rather than cut them off arbitrarily.',
    ],
    related: ['row-number', 'lateral-join', 'latest-per-group', 'rank'],
  },
  {
    id: 'latest-per-group',
    title: 'Latest row per key',
    category: 'recipes',
    kind: 'recipe',
    summary: 'The most recent order per user, the current status per ticket, the last reading per sensor.',
    tags: ['most recent', 'current record', 'distinct on', 'last row'],
    syntax: `-- PostgreSQL, shortest
SELECT DISTINCT ON (key) *
FROM t ORDER BY key, ts DESC;

-- portable
SELECT * FROM (
  SELECT t.*, ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC) rn FROM t
) x WHERE rn = 1;`,
    example: `SELECT DISTINCT ON (user_id)
       user_id, id AS last_order_id, placed_at, total
FROM orders
ORDER BY user_id, placed_at DESC, id DESC;`,
    explain: 'A top-N-per-group with n = 1, common enough to deserve its own entry. The join-to-MAX form is the third variant, and the one that breaks on ties.',
    notes: [
      'Joining back to a MAX(ts) subquery returns two rows when two rows share the maximum timestamp. ROW_NUMBER with a tiebreaker does not.',
      'Add the primary key as the final ORDER BY term so the winner is deterministic.',
      'With an index on (key, ts DESC) both forms are fast; the LATERAL form scales best when the table is very wide.',
    ],
    related: ['top-n-per-group', 'distinct', 'row-number', 'lateral-join'],
  },
  {
    id: 'percent-of-total',
    title: 'Percent of total',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Each row as a share of the whole, without a second query.',
    tags: ['share', 'ratio', 'contribution', 'percentage'],
    syntax: `value * 100.0 / SUM(value) OVER ()                  -- share of grand total
value * 100.0 / SUM(value) OVER (PARTITION BY group)  -- share within a group`,
    example: `SELECT country,
       SUM(o.total)                                          AS revenue,
       ROUND(100.0 * SUM(o.total) / SUM(SUM(o.total)) OVER (), 2) AS pct_of_total
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY country
ORDER BY revenue DESC;`,
    explain: 'A window function over the aggregated rows: the inner SUM aggregates per country, the outer SUM windows across all countries.',
    notes: [
      'Multiply by 100.0, not 100, or integer division floors the result to whole percents.',
      'Guard against an empty result with NULLIF(SUM(...) OVER (), 0) to avoid dividing by zero.',
      'SUM(SUM(x)) OVER () looks odd but is correct: window functions run after aggregation.',
    ],
    related: ['over-partition', 'integer-division', 'grouping-sets'],
  },
  {
    id: 'month-over-month',
    title: 'Month-over-month growth',
    category: 'recipes',
    kind: 'recipe',
    summary: 'This period next to the last one, and the change between them.',
    tags: ['growth', 'trend', 'delta', 'wow', 'mom', 'lag'],
    syntax: `LAG(value) OVER (ORDER BY period)                          -- previous period
(value - LAG(value) OVER (ORDER BY period)) * 100.0
  / NULLIF(LAG(value) OVER (ORDER BY period), 0)            -- percent change`,
    example: `WITH monthly AS (
  SELECT DATE_TRUNC('month', placed_at) AS month,
         SUM(total)                     AS revenue
  FROM orders
  WHERE status = 'paid'
  GROUP BY 1
)
SELECT month,
       revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS pct_change
FROM monthly
ORDER BY month;`,
    explain: 'Aggregate to the period grain first, then LAG across periods. Doing both in one step is where the double-counting creeps in.',
    notes: [
      'A month with no rows is missing from the CTE, so LAG compares against the wrong month. Generate the months and left-join if gaps are possible.',
      'NULLIF guards the division when the previous period was zero.',
      'For year-over-year use LAG(revenue, 12) on monthly data.',
    ],
    related: ['lag-lead', 'date-truncate', 'zero-fill-dates'],
  },
  {
    id: 'zero-fill-dates',
    title: 'Fill gaps in a time series',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Show every day in the range, including the days with no rows.',
    tags: ['generate_series', 'calendar table', 'missing days', 'dense series'],
    syntax: `-- PostgreSQL
SELECT d::date FROM generate_series(start_date, end_date, INTERVAL '1 day') d;
-- elsewhere: a calendar table, or a recursive CTE`,
    example: `SELECT d::date                     AS day,
       COALESCE(SUM(o.total), 0)   AS revenue,
       COUNT(o.id)                 AS orders
FROM generate_series(DATE '2026-09-01', DATE '2026-09-30', INTERVAL '1 day') d
LEFT JOIN orders o
       ON o.placed_at >= d
      AND o.placed_at <  d + INTERVAL '1 day'
      AND o.status = 'paid'
GROUP BY d
ORDER BY d;`,
    explain: 'GROUP BY only produces rows that exist. Generating the calendar and left-joining the data onto it is what makes a chart show a flat zero instead of skipping the day.',
    notes: [
      'The join conditions must be in the ON clause. Moving them to WHERE turns the LEFT JOIN back into an inner join and the gaps vanish again.',
      'MySQL and SQL Server have no generate_series: keep a small calendar table, or build one with a recursive CTE.',
      'Fill the value with COALESCE(..., 0), otherwise the gaps come back as NULL.',
    ],
    related: ['cross-join', 'outer-join-where', 'recursive-cte', 'date-truncate'],
  },
  {
    id: 'pivot',
    title: 'Pivot rows into columns',
    category: 'recipes',
    kind: 'recipe',
    summary: 'One row per entity, one column per category.',
    tags: ['crosstab', 'transpose', 'wide format', 'pivot table'],
    syntax: `SELECT key,
       SUM(CASE WHEN dim = 'a' THEN val ELSE 0 END) AS a,
       SUM(CASE WHEN dim = 'b' THEN val ELSE 0 END) AS b
FROM t GROUP BY key;`,
    example: `-- orders per status, one row per month
SELECT DATE_TRUNC('month', placed_at)                   AS month,
       COUNT(*) FILTER (WHERE status = 'paid')          AS paid,
       COUNT(*) FILTER (WHERE status = 'pending')       AS pending,
       COUNT(*) FILTER (WHERE status = 'refunded')      AS refunded
FROM orders
GROUP BY 1
ORDER BY 1;`,
    explain: 'Conditional aggregation is the portable pivot. Every target column is one aggregate with its own condition.',
    notes: [
      'SQL is statically typed, so the column list must be known when you write the query. A truly dynamic pivot means generating SQL, or pivoting in the application.',
      'SQL Server has PIVOT and Oracle has PIVOT; PostgreSQL has crosstab() in the tablefunc extension. The CASE form works everywhere and is easier to read.',
      'Use 0 rather than NULL in the ELSE branch when the consumer is a chart.',
    ],
    related: ['conditional-aggregation', 'unpivot', 'case'],
  },
  {
    id: 'unpivot',
    title: 'Unpivot columns into rows',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Turn a wide table into a long one: one row per (entity, metric).',
    tags: ['melt', 'long format', 'normalise', 'cross join values'],
    syntax: `SELECT t.id, v.metric, v.value
FROM t
CROSS JOIN LATERAL (VALUES ('a', t.a), ('b', t.b)) AS v(metric, value);`,
    example: `SELECT id, metric, value
FROM monthly_stats s
CROSS JOIN LATERAL (VALUES
  ('revenue', s.revenue),
  ('orders',  s.orders::numeric),
  ('refunds', s.refunds)
) AS v(metric, value);`,
    explain: 'The reverse of a pivot, and what most charting and BI tools actually want as input.',
    notes: [
      'All the unpivoted values must share a type. Cast them to a common one.',
      'A UNION ALL of one SELECT per column does the same thing portably, at the cost of scanning the table once per column.',
      'SQL Server and Oracle have an UNPIVOT operator.',
    ],
    related: ['pivot', 'cross-join', 'union'],
  },
  {
    id: 'gaps-islands',
    title: 'Gaps and islands (consecutive runs)',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Group consecutive rows into runs: streaks, sessions, uninterrupted periods.',
    tags: ['streak', 'sessions', 'consecutive days', 'runs', 'grouping'],
    syntax: `-- the classic trick: value minus its row number is constant within a run
SELECT grp, MIN(d) AS run_start, MAX(d) AS run_end, COUNT(*) AS len
FROM (
  SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp FROM t
) x
GROUP BY grp;`,
    example: `-- longest streak of consecutive active days per user
WITH days AS (
  SELECT DISTINCT user_id, placed_at::date AS d FROM orders
), grouped AS (
  SELECT user_id, d,
         d - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d))::int AS grp
  FROM days
)
SELECT user_id, MIN(d) AS streak_start, MAX(d) AS streak_end, COUNT(*) AS days
FROM grouped
GROUP BY user_id, grp
ORDER BY days DESC;`,
    explain:
      'Subtracting a dense row number from a dense sequence gives the same value for every row in an unbroken run, which turns "find the runs" into an ordinary GROUP BY.',
    notes: [
      'For sessionisation by time gap, use LAG to flag rows more than N minutes after the previous one, then take a running SUM of that flag as the group id.',
      'Deduplicate first. Two rows on the same day break the arithmetic.',
    ],
    related: ['lag-lead', 'row-number', 'running-total'],
  },
  {
    id: 'median',
    title: 'Median and percentiles',
    category: 'recipes',
    kind: 'recipe',
    summary: 'The middle value, which is usually a better summary than the average.',
    tags: ['p50', 'p95', 'percentile_cont', 'latency', 'skew'],
    syntax: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)   -- interpolated median
PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY value)  -- an actual observed value`,
    example: `SELECT country,
       ROUND(AVG(total), 2)                                          AS mean_order,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total)            AS median_order,
       PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY total)           AS p95_order
FROM orders o
JOIN users u ON u.id = o.user_id
GROUP BY country;`,
    explain: 'Averages hide skew: one enterprise order drags the mean of a thousand small ones. Report the median next to it, and the p95 when you care about the tail.',
    notes: [
      'PERCENTILE_CONT interpolates between two rows, so it can return a value that does not exist in the data. Use PERCENTILE_DISC for latency SLOs.',
      'MySQL has neither. Emulate with ROW_NUMBER and COUNT, taking the middle row (or the average of the middle two).',
      'These are ordered-set aggregates: WITHIN GROUP, not OVER.',
    ],
    related: ['ntile', 'aggregates', 'histogram'],
  },
  {
    id: 'histogram',
    title: 'Histogram / bucketing',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Count rows per value range, with empty buckets included.',
    tags: ['distribution', 'width_bucket', 'bins', 'range count'],
    syntax: `WIDTH_BUCKET(value, min, max, bucket_count)   -- PostgreSQL / Oracle
FLOOR(value / bucket_size) * bucket_size      -- portable`,
    example: `SELECT FLOOR(total / 100) * 100 AS bucket_start,
       COUNT(*)                 AS orders
FROM orders
WHERE status = 'paid'
GROUP BY 1
ORDER BY 1;`,
    explain: 'Divide by the bucket width, floor it, multiply back: every row lands on its bucket start, and GROUP BY does the rest.',
    notes: [
      'Empty buckets do not appear. Join against a generated series of bucket starts if the chart needs them.',
      'WIDTH_BUCKET clamps out-of-range values into an underflow and an overflow bucket, which is often what you want for outliers.',
      'For heavily skewed data (order values, response times), bucket on LOG(value) instead of on the raw value.',
    ],
    related: ['zero-fill-dates', 'median', 'case'],
  },
  {
    id: 'random-sample',
    title: 'Random sample of rows',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Pull a handful of random rows without sorting the whole table.',
    tags: ['sample', 'tablesample', 'order by random', 'spot check'],
    syntax: `SELECT * FROM t ORDER BY RANDOM() LIMIT 10;          -- small tables only
SELECT * FROM t TABLESAMPLE SYSTEM (1);              -- ~1% of pages, fast
SELECT * FROM t TABLESAMPLE BERNOULLI (1);           -- ~1% of rows, fairer`,
    example: `-- 20 random paid orders to eyeball
SELECT id, user_id, total
FROM orders TABLESAMPLE BERNOULLI (1)
WHERE status = 'paid'
LIMIT 20;`,
    explain: 'ORDER BY RANDOM() sorts every row in the table to return ten. On anything large, TABLESAMPLE reads a fraction of the pages instead.',
    notes: [
      'SYSTEM samples whole pages, so rows that were inserted together tend to appear together. BERNOULLI samples rows and is fairer but slower.',
      'The percentage is approximate. Ask for more than you need and apply LIMIT.',
      'MySQL has no TABLESAMPLE; for a rough sample use WHERE RAND() < 0.01.',
    ],
    related: ['limit-offset', 'order-by'],
  },
  {
    id: 'compare-tables',
    title: 'Compare two tables (diff)',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Rows only in A, only in B, and rows present in both but different.',
    tags: ['reconcile', 'diff', 'migration check', 'except', 'audit'],
    syntax: `(SELECT * FROM a EXCEPT SELECT * FROM b)
UNION ALL
(SELECT * FROM b EXCEPT SELECT * FROM a);`,
    example: `-- reconcile a migrated table against the original
SELECT COALESCE(o.id, n.id) AS id,
       CASE WHEN n.id IS NULL THEN 'missing_in_new'
            WHEN o.id IS NULL THEN 'extra_in_new'
            ELSE 'changed'
       END AS issue,
       o.total AS old_total, n.total AS new_total
FROM orders_old o
FULL OUTER JOIN orders_new n ON n.id = o.id
WHERE o.id IS NULL
   OR n.id IS NULL
   OR o.total IS DISTINCT FROM n.total;`,
    explain: 'The FULL OUTER JOIN form labels each difference; the EXCEPT form is shorter when you only need to know that something differs.',
    notes: [
      'IS DISTINCT FROM compares NULLs correctly. A plain <> treats two NULLs as an unknown and hides the row.',
      'EXCEPT compares whole rows, so a column-order or type mismatch produces noise.',
      'On very large tables, compare checksums per key range first and only diff the ranges that differ.',
    ],
    related: ['intersect-except', 'full-join', 'null-comparison'],
  },
  {
    id: 'orphan-rows',
    title: 'Find orphan and unreferenced rows',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Child rows pointing at a parent that is gone, and parents nothing points at.',
    tags: ['integrity check', 'dangling', 'referential', 'cleanup'],
    syntax: `-- orphans: child with no parent
SELECT c.* FROM child c
WHERE NOT EXISTS (SELECT 1 FROM parent p WHERE p.id = c.parent_id);`,
    example: `-- order items whose order no longer exists
SELECT i.id, i.order_id
FROM order_items i
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = i.order_id);

-- products nobody has ever ordered
SELECT p.id, p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id);`,
    explain: 'The audit you run before adding a foreign key that should have been there from the start, and the one that finds data a broken delete left behind.',
    notes: [
      'Fix the orphans, then add the constraint. Otherwise the same bug refills the table next week.',
      'Watch for NULL foreign keys: a NULL parent_id is not an orphan, it is an unset optional reference.',
    ],
    related: ['anti-join', 'foreign-key', 'exists'],
  },
  {
    id: 'moving-average',
    title: 'Moving average (rolling window)',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Smooth a noisy daily series into a 7-day trend line.',
    tags: ['rolling', 'smoothing', '7 day average', 'trend'],
    syntax: `AVG(value) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`,
    example: `WITH daily AS (
  SELECT DATE_TRUNC('day', placed_at) AS day, SUM(total) AS revenue
  FROM orders WHERE status = 'paid'
  GROUP BY 1
)
SELECT day,
       revenue,
       ROUND(AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS avg_7d
FROM daily
ORDER BY day;`,
    explain: 'A 7-day trailing average takes the weekday cycle out of a daily chart, which is usually the difference between a readable graph and a sawtooth.',
    notes: [
      'The first six rows average fewer than seven days. Blank them out if that matters, by checking COUNT(*) OVER (same frame) = 7.',
      'ROWS counts rows, so a missing day silently shortens the window. Fill the series first if gaps are possible.',
      'RANGE BETWEEN INTERVAL 6 days PRECEDING AND CURRENT ROW works on real time instead of row counts, where supported.',
    ],
    related: ['window-frame', 'running-total', 'zero-fill-dates'],
  },
  {
    id: 'cohort-retention',
    title: 'Cohort retention',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Group users by their signup month and track how many come back each month after.',
    tags: ['cohort', 'retention', 'churn', 'activity', 'analysis'],
    syntax: `-- cohort = first activity period; offset = periods since then
WITH first_seen AS (SELECT user_id, MIN(period) AS cohort FROM activity GROUP BY user_id)
SELECT cohort, period - cohort AS offset, COUNT(DISTINCT user_id) ...`,
    example: `WITH first_order AS (
  SELECT user_id, DATE_TRUNC('month', MIN(placed_at)) AS cohort
  FROM orders GROUP BY user_id
), activity AS (
  SELECT DISTINCT o.user_id,
         f.cohort,
         DATE_TRUNC('month', o.placed_at) AS active_month
  FROM orders o
  JOIN first_order f ON f.user_id = o.user_id
)
SELECT cohort,
       EXTRACT(YEAR FROM AGE(active_month, cohort)) * 12
         + EXTRACT(MONTH FROM AGE(active_month, cohort)) AS month_offset,
       COUNT(DISTINCT user_id)                           AS users
FROM activity
GROUP BY cohort, month_offset
ORDER BY cohort, month_offset;`,
    explain: 'Two steps: pin each user to the period they first appeared, then count distinct users per (cohort, periods-since-cohort). Pivot the offsets into columns for the familiar triangle.',
    notes: [
      'Month offset 0 is the cohort size, so every retention percentage divides by that row.',
      'Incomplete recent periods make the last diagonal look like a cliff. Exclude the current period or mark it.',
      'Use COUNT(DISTINCT user_id): a user with three orders in a month is still one retained user.',
    ],
    related: ['date-truncate', 'pivot', 'count-distinct', 'percent-of-total'],
  },
  {
    id: 'text-search',
    title: 'Full-text search',
    category: 'recipes',
    kind: 'recipe',
    summary: 'Word-aware search with ranking, instead of LIKE with wildcards.',
    tags: ['tsvector', 'match against', 'relevance', 'search', 'gin index'],
    syntax: `-- PostgreSQL
WHERE to_tsvector('english', col) @@ plainto_tsquery('english', :q)
-- MySQL
WHERE MATCH(col) AGAINST (:q IN NATURAL LANGUAGE MODE)`,
    example: `-- searchable product descriptions, with ranking
ALTER TABLE products ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(description, ''))) STORED;

CREATE INDEX idx_products_search ON products USING GIN (search);

SELECT id, name, ts_rank(search, q) AS rank
FROM products, plainto_tsquery('english', 'wireless keyboard') q
WHERE search @@ q
ORDER BY rank DESC
LIMIT 20;`,
    explain:
      'Full-text search normalises words (stemming, stop words) and is backed by an inverted index, so it handles multi-word queries and ranking that LIKE cannot.',
    notes: [
      'Store the tsvector in a generated column and index it. Computing it per query defeats the index.',
      'For fuzzy or typo-tolerant matching use pg_trgm similarity instead, or a dedicated search engine.',
      'The language configuration matters: stemming with the wrong one quietly changes what matches.',
    ],
    related: ['like', 'json-query', 'create-index'],
  },
  {
    id: 'table-sizes',
    title: 'Table and index sizes',
    category: 'recipes',
    kind: 'recipe',
    summary: 'What is actually using the disk, and which indexes are dead weight.',
    tags: ['disk usage', 'bloat', 'unused index', 'dba', 'storage'],
    syntax: `SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables;`,
    example: `-- PostgreSQL: biggest tables including indexes and TOAST
SELECT relname                                        AS table_name,
       pg_size_pretty(pg_total_relation_size(relid))  AS total,
       pg_size_pretty(pg_relation_size(relid))        AS table_only,
       pg_size_pretty(pg_indexes_size(relid))         AS indexes
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- indexes nothing has scanned since the last stats reset
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY relname;`,
    explain: 'The first query to run when the disk alert fires, and the one that finds the indexes slowing every write for no benefit.',
    notes: [
      'An index with zero scans since the last statistics reset is a candidate for removal, but check the reset time and any replica traffic first.',
      'Never drop the index behind a UNIQUE or PRIMARY KEY constraint; drop the constraint if that is what you mean.',
      'MySQL: query information_schema.TABLES (DATA_LENGTH, INDEX_LENGTH). SQL Server: sys.dm_db_partition_stats.',
    ],
    related: ['create-index', 'analyze-stats', 'explain'],
  },

  // -------------------------------------------------------------- pitfalls
  {
    id: 'not-in-null',
    title: 'NOT IN with NULLs returns nothing',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'One NULL in the subquery and your result set is empty. No error, no warning.',
    tags: ['null', 'not in', 'empty result', 'three-valued logic'],
    syntax: `-- broken when orders.user_id is nullable
WHERE u.id NOT IN (SELECT user_id FROM orders)

-- safe
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)`,
    example: `-- users who never ordered, correctly
SELECT u.id, u.email
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`,
    explain:
      'x NOT IN (1, 2, NULL) expands to x <> 1 AND x <> 2 AND x <> NULL. The last comparison is UNKNOWN, so the whole condition can never be TRUE and every row is filtered out.',
    notes: [
      'The IN form is unaffected; only the negation breaks.',
      'Adding WHERE user_id IS NOT NULL to the subquery also fixes it, but NOT EXISTS is the habit worth having.',
      'This is the bug that survives testing, because test data rarely has the NULL.',
    ],
    related: ['in', 'exists', 'anti-join', 'null-comparison'],
  },
  {
    id: 'outer-join-where',
    title: 'A WHERE clause that cancels your LEFT JOIN',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Filtering the right table in WHERE turns an outer join back into an inner one.',
    tags: ['left join', 'on vs where', 'missing rows', 'outer join'],
    syntax: `-- inner join in disguise: unmatched rows have NULL status, which fails the test
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid'

-- keeps every user
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'`,
    example: `-- every user, with paid-order revenue (0 for those with none)
SELECT u.id, u.email, COALESCE(SUM(o.total), 0) AS paid_revenue
FROM users u
LEFT JOIN orders o
       ON o.user_id = u.id
      AND o.status = 'paid'
GROUP BY u.id, u.email;`,
    explain:
      'The outer join pads unmatched rows with NULL, and then the WHERE clause tests those NULLs and throws the rows away. The filter has to be part of the join condition instead.',
    notes: [
      'Conditions on the LEFT table belong in WHERE; conditions on the RIGHT table belong in ON.',
      'The exception is WHERE right.id IS NULL, which is the deliberate anti-join pattern.',
      'Symptom: a report where the zero-activity rows quietly disappeared.',
    ],
    related: ['left-join', 'anti-join', 'zero-fill-dates'],
  },
  {
    id: 'join-fanout',
    title: 'Row fan-out: joins that double your totals',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Joining two one-to-many tables multiplies rows, and every SUM afterwards is wrong.',
    tags: ['duplicate rows', 'double counting', 'cartesian', 'sum too high'],
    syntax: `-- wrong: items and payments both multiply the order rows
SELECT o.id, SUM(i.qty), SUM(p.amount)
FROM orders o JOIN order_items i ON ... JOIN payments p ON ...

-- right: aggregate each side first, then join the aggregates`,
    example: `SELECT o.id,
       i.items,
       p.paid
FROM orders o
LEFT JOIN (SELECT order_id, SUM(qty)    AS items FROM order_items GROUP BY order_id) i ON i.order_id = o.id
LEFT JOIN (SELECT order_id, SUM(amount) AS paid  FROM payments    GROUP BY order_id) p ON p.order_id = o.id;`,
    explain:
      'An order with 3 items and 2 payments produces 6 rows. SUM(amount) then counts each payment three times. The numbers look plausible, which is what makes this dangerous.',
    notes: [
      'Symptom: revenue that is an exact multiple of the truth, or that changes when you add an unrelated join.',
      'Sanity check with COUNT(*) before and after adding a join.',
      'Aggregate each branch in its own subquery or CTE, then join the one-row-per-key results.',
      'SELECT DISTINCT does not fix it: distinct rows still carry duplicated amounts.',
    ],
    related: ['inner-join', 'distinct-crutch', 'exists-vs-in', 'count-star'],
  },
  {
    id: 'distinct-crutch',
    title: 'DISTINCT used to hide a join problem',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'If you needed DISTINCT to get the right row count, the join was wrong.',
    tags: ['duplicates', 'select distinct', 'symptom', 'performance'],
    syntax: `-- symptom
SELECT DISTINCT u.id, u.email FROM users u JOIN orders o ON o.user_id = u.id;

-- cause addressed
SELECT u.id, u.email FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`,
    example: `SELECT u.id, u.email
FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'paid');`,
    explain:
      'DISTINCT deduplicates rows the join should not have produced. It costs a full sort or hash, and it only masks the symptom: any aggregate in the same query is still double-counting.',
    notes: [
      'Use EXISTS when you only need to know a match exists, and pre-aggregate when you need a number from the other table.',
      'DISTINCT is legitimate when the source data genuinely has duplicates you want collapsed.',
    ],
    related: ['distinct', 'exists-vs-in', 'join-fanout'],
  },
  {
    id: 'integer-division',
    title: 'Integer division truncates',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'count_a / count_b returns 0 when both are integers.',
    tags: ['rounding', 'percentage', 'ratio', 'decimal', 'zero'],
    syntax: `-- wrong                            -- right
SELECT wins / games                   SELECT wins * 1.0 / games
SELECT 100 * wins / games             SELECT 100.0 * wins / games`,
    example: `SELECT country,
       COUNT(*) FILTER (WHERE status = 'refunded') AS refunds,
       COUNT(*)                                    AS orders,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'refunded') / COUNT(*), 2) AS refund_pct
FROM orders o
JOIN users u ON u.id = o.user_id
GROUP BY country;`,
    explain:
      'When both operands are integers, most engines do integer arithmetic and throw away the remainder. A 3% refund rate shows up as 0.',
    notes: [
      'Multiply by 1.0 or 100.0, or CAST one side to NUMERIC, before dividing.',
      'Division by zero raises an error rather than returning NULL. Guard with NULLIF(denominator, 0).',
      'MySQL is the exception: / always produces a decimal, and DIV is the integer operator.',
    ],
    related: ['cast', 'coalesce', 'percent-of-total'],
  },
  {
    id: 'unstable-sort',
    title: 'ORDER BY without a tiebreaker',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Ties break arbitrarily, so paginated results repeat and skip rows.',
    tags: ['pagination bug', 'non-deterministic', 'flaky test', 'sort'],
    syntax: `-- unstable when several rows share created_at
ORDER BY created_at DESC LIMIT 20 OFFSET 20

-- deterministic
ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 20`,
    example: `SELECT id, email, created_at
FROM users
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 20;`,
    explain:
      'Nothing requires the engine to order tied rows consistently between two executions. With OFFSET paging, a row can appear on both page 1 and page 2, and another can be skipped entirely.',
    notes: [
      'Always end ORDER BY with a unique column, usually the primary key.',
      'The same omission makes tests flaky: they pass locally and fail once the plan changes.',
      'It also matters for LIMIT-only queries: top 10 by score with ties is not a stable list.',
    ],
    related: ['order-by', 'limit-offset', 'keyset-pagination'],
  },
  {
    id: 'implicit-conversion',
    title: 'Implicit type conversion kills indexes',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Comparing a string column to a number makes the engine convert every row.',
    tags: ['type mismatch', 'collation', 'varchar', 'index not used', 'slow'],
    syntax: `-- account_no is VARCHAR
WHERE account_no = 12345      -- converts the column: full scan
WHERE account_no = '12345'    -- uses the index`,
    example: `SELECT id, email
FROM users
WHERE phone = '919812345678';   -- quoted, because phone is text`,
    explain:
      'When the types on both sides differ, the engine converts one of them, and it usually converts the column. That makes the predicate unsargable and quietly turns a lookup into a scan of the table.',
    notes: [
      'MySQL is the worst offender: a string-to-number comparison can also match unexpectedly, because leading-numeric strings convert.',
      'A collation mismatch between two joined columns has the same effect on the join.',
      'Look for a CAST or CONVERT_IMPLICIT node in the plan on a column you expected to be indexed.',
    ],
    related: ['sargable', 'cast', 'explain'],
  },
  {
    id: 'delete-without-where',
    title: 'UPDATE or DELETE without a WHERE',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'The mistake everyone makes once. Make it recoverable.',
    tags: ['safety', 'production', 'transaction', 'autocommit', 'oops'],
    syntax: `BEGIN;
  DELETE FROM orders WHERE ...;   -- check the reported row count
  -- SELECT to verify
COMMIT;   -- or ROLLBACK;`,
    example: `-- 1. read it first
SELECT COUNT(*) FROM orders WHERE status = 'abandoned' AND placed_at < NOW() - INTERVAL '1 year';

-- 2. then delete inside a transaction, in batches
BEGIN;
DELETE FROM orders
WHERE id IN (
  SELECT id FROM orders
  WHERE status = 'abandoned' AND placed_at < NOW() - INTERVAL '1 year'
  LIMIT 5000
);
COMMIT;`,
    explain: 'The habits that make this survivable: select the rows first, run inside an explicit transaction, delete in batches, and confirm the row count before committing.',
    notes: [
      'Turn off autocommit in interactive sessions against production, so a stray statement can still be rolled back.',
      'MySQL safe-updates mode refuses an UPDATE or DELETE that does not use a key. Leave it on in the client.',
      'Once it is committed, only a backup or point-in-time recovery helps. Know whether you have one before you need it.',
    ],
    related: ['transaction', 'delete', 'update'],
  },
  {
    id: 'sql-injection',
    title: 'String-concatenated SQL',
    category: 'pitfalls',
    kind: 'practice',
    summary: 'Bind parameters. Never build a query by concatenating user input.',
    tags: ['injection', 'security', 'prepared statement', 'bind', 'parameter'],
    syntax: `-- never
"SELECT * FROM users WHERE email = '" + input + "'"

-- always
SELECT * FROM users WHERE email = ?      -- or $1, :email, depending on the driver`,
    example: `-- parameterised, and an identifier that cannot come from user input
SELECT id, email
FROM users
WHERE email = $1
  AND status = $2;`,
    explain:
      'A bound parameter is sent separately from the statement, so its contents can never be parsed as SQL. Concatenation puts the user in charge of your query text.',
    notes: [
      'Escaping by hand is not equivalent, and neither is a regex allowlist. Use the driver placeholders.',
      'Table and column names cannot be bound. If they must vary, map the input against a fixed allowlist of known names.',
      'Prepared statements are also faster: the plan can be reused across executions.',
      'An ORM does not make you safe if you drop to raw SQL with interpolated strings.',
    ],
    related: ['insert', 'where'],
  },
]
