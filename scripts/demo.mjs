// Tạo dữ liệu minh hoạ (ca + hoá đơn vài ngày) để xem giao diện có số liệu.
// Dùng: node --env-file=.env.local scripts/demo.mjs
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const staff = (await c.query("select id, name from fade_os_staff where role <> 'cashier'")).rows;
const services = (await c.query("select id, name, price from fade_os_services where active order by sort")).rows;
const pick = (arr, i) => arr[i % arr.length];

const shift = (
  await c.query("insert into fade_os_shifts (opening_fund, opened_by) values (2000000, 'Hương') returning id")
).rows[0];

let n = 0;
for (let day = 4; day >= 0; day--) {
  const count = day === 0 ? 9 : 3 + (day % 3);
  for (let k = 0; k < count; k++) {
    const st = pick(staff, n);
    const chosen = n % 3 === 0 ? [pick(services, n), pick(services, n + 3)] : [pick(services, n)];
    const subtotal = chosen.reduce((s, x) => s + Number(x.price), 0);
    const discount = n % 5 === 0 ? 20000 : 0;
    const total = subtotal - discount;
    const pm = n % 3 === 1 ? "transfer" : "cash";
    const sid = day === 0 ? shift.id : null;
    const createdAt = `now() - interval '${day} day' + interval '${8 + k} hour'`;
    const txn = (
      await c.query(
        `insert into fade_os_transactions
           (shift_id, staff_id, payment_method, transfer_verified, subtotal, discount, total, created_at)
         values ($1,$2,$3,$4,$5,$6,$7, ${createdAt}) returning id`,
        [sid, st.id, pm, pm === "transfer", subtotal, discount, total],
      )
    ).rows[0];
    for (const x of chosen) {
      await c.query(
        `insert into fade_os_transaction_items (transaction_id, service_id, staff_id, name, price, qty)
         values ($1,$2,$3,$4,$5,1)`,
        [txn.id, x.id, st.id, x.name, x.price],
      );
    }
    n++;
  }
}

await c.query(
  "insert into fade_os_cash_movements (shift_id, direction, amount, reason) values ($1,'out',150000,'Mua nước & gel')",
  [shift.id],
);

console.log(`✓ Đã tạo 1 ca đang mở + ${n} hoá đơn minh hoạ.`);
await c.end();
