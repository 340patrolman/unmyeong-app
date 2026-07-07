const { computeSaju, currentDaeun } = require("./saju_engine.js");
const table = require("./jieqi_table.json");

let pass = 0, fail = 0;
function check(name, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + " | " + name + (detail ? " | " + detail : ""));
  cond ? pass++ : fail++;
}

const A = computeSaju({ date: "1970-02-19", time: "21:50", lon: 126.978, gender: "M" }, table);
const B = computeSaju({ date: "1969-08-10", time: "21:50", lon: 126.978, gender: "F" }, table);
const pil = s => ["year","month","day","hour"].map(k => s.pillars[k].stem + s.pillars[k].branch).join(" ");

check("검증 A 원국", pil(A) === "경술 무인 경오 정해", pil(A));
check("검증 B 원국", pil(B) === "기유 임신 정사 신해", pil(B));

const m1 = computeSaju({ date: "1969-08-08", time: "01:30", lon: 126.978 }, table);
const m2 = computeSaju({ date: "1969-08-08", time: "03:00", lon: 126.978 }, table);
check("입추 절입 전 신미월", m1.pillars.month.stem + m1.pillars.month.branch === "신미");
check("입추 절입 후 임신월", m2.pillars.month.stem + m2.pillars.month.branch === "임신");
const y1 = computeSaju({ date: "1970-02-04", time: "12:00", lon: 126.978 }, table);
const y2 = computeSaju({ date: "1970-02-04", time: "16:00", lon: 126.978 }, table);
check("입춘 전 기유년", y1.pillars.year.stem + y1.pillars.year.branch === "기유");
check("입춘 후 경술년", y2.pillars.year.stem + y2.pillars.year.branch === "경술");
const z = computeSaju({ date: "1970-02-19", time: "23:40", lon: 126.978 }, table);
check("자시 일진 교체", z.pillars.hour.branch === "자" && z.pillars.day.stem + z.pillars.day.branch !== "경오");

check("A 십신: 시간 정화=정관", A.sipsin.hour_stem === "정관", A.sipsin.hour_stem);
check("A 십신: 월간 무토=편인", A.sipsin.month_stem === "편인", A.sipsin.month_stem);
check("A 십신: 년간 경금=비견", A.sipsin.year_stem === "비견", A.sipsin.year_stem);
check("B 십신: 월간 임수=정관", B.sipsin.month_stem === "정관", B.sipsin.month_stem);

check("A 대운: 순행·대운수 5", A.daewoon.direction === "순행" && A.daewoon.su === 5, A.daewoon.direction + " " + A.daewoon.su);
check("B 대운: 순행·대운수 9", B.daewoon.direction === "순행" && B.daewoon.su === 9, B.daewoon.direction + " " + B.daewoon.su);
const now = new Date("2026-07-08");
const dA = currentDaeun(A, new Date("1970-02-19"), now);
const dB = currentDaeun(B, new Date("1969-08-10"), now);
check("A 현재 대운 = 갑신(55세~)", dA.stem + dA.branch === "갑신" && dA.start_age === 55, dA.stem + dA.branch + " " + dA.start_age + "세");
check("B 현재 대운 = 정축(49세~)", dB.stem + dB.branch === "정축" && dB.start_age === 49, dB.stem + dB.branch + " " + dB.start_age + "세");

const sA = A.strength.scores;
check("A 왕쇠 합계 100%", Math.abs(Object.values(sA).reduce((a,x)=>a+x.pct,0) - 100) < 1,
      Object.entries(sA).map(([k,v])=>k+v.pct).join(" "));
check("A 인오술 삼합 화국 검출", A.strength.combos.some(c => c.includes("인오술 삼합 화국")), A.strength.combos.join(","));
check("A 화 최강 (관살 태왕 재현)", Object.entries(sA).sort((a,b)=>b[1].pct-a[1].pct)[0][0] === "화");
check("B 사유 반합 금국 검출", B.strength.combos.some(c => c.includes("반합 금국")), B.strength.combos.join(","));
check("B 금 최강 (재다신약 재현)", Object.entries(B.strength.scores).sort((a,b)=>b[1].pct-a[1].pct)[0][0] === "금");

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
