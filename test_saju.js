const { computeSaju } = require("./saju_engine.js");
const table = require("./jieqi_table.json");

const cases = [
  { name: "검증 A", in: { date: "1970-02-19", time: "21:50", lon: 126.978 },
    exp: ["경술","무인","경오","정해"] },
  { name: "검증 B", in: { date: "1969-08-10", time: "21:50", lon: 126.978 },
    exp: ["기유","임신","정사","신해"] },
  { name: "입추 전날(월경계)", in: { date: "1969-08-07", time: "12:00", lon: 126.978 },
    expMonth: "신미" },
  { name: "입추 당일 절입 전(02:14전)", in: { date: "1969-08-08", time: "01:30", lon: 126.978 },
    expMonth: "신미" },
  { name: "입추 당일 절입 후", in: { date: "1969-08-08", time: "03:00", lon: 126.978 },
    expMonth: "임신" },
  { name: "입춘 전(년경계 14:45전)", in: { date: "1970-02-04", time: "12:00", lon: 126.978 },
    expYear: "기유" },
  { name: "입춘 후(년경계)", in: { date: "1970-02-04", time: "16:00", lon: 126.978 },
    expYear: "경술" },
  { name: "자시 일진교체(23:40 진태양시 23:08)", in: { date: "1970-02-19", time: "23:40", lon: 126.978 },
    expHourBranch: "자", expDayNot: "경오" }
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = computeSaju(c.in, table);
  const p = r.pillars;
  const got = [p.year, p.month, p.day, p.hour].map(x => x.stem + x.branch);
  let ok = true, detail = got.join(" ");
  if (c.exp) ok = JSON.stringify(got) === JSON.stringify(c.exp);
  if (c.expMonth) ok = ok && got[1] === c.expMonth;
  if (c.expYear) ok = ok && got[0] === c.expYear;
  if (c.expHourBranch) ok = ok && p.hour.branch === c.expHourBranch;
  if (c.expDayNot) ok = ok && got[2] !== c.expDayNot;
  console.log((ok ? "PASS" : "FAIL") + " | " + c.name + " | " + detail);
  ok ? pass++ : fail++;
}
console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
