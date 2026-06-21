// Chạy file .sql lên Supabase qua SUPABASE_DB_URL.
// Dùng: node --env-file=.env.local scripts/db.mjs <file.sql> [file2.sql ...]
import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("✗ Thiếu SUPABASE_DB_URL trong .env.local");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("✗ Cần ít nhất một file .sql");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const file of files) {
    const sql = await readFile(file, "utf8");
    process.stdout.write(`→ ${file} ... `);
    await client.query(sql);
    console.log("OK");
  }
  const { rows } = await client.query(
    "select (select count(*) from fade_os_staff) as staff, (select count(*) from fade_os_services) as services",
  );
  console.log(`✓ Hoàn tất. staff=${rows[0].staff}, services=${rows[0].services}`);
} catch (err) {
  console.error("✗ Lỗi:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
