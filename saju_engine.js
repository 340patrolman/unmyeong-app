const STEMS = ["갑","을","병","정","무","기","경","신","임","계"];
const BRANCHES = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const STEMS_H = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES_H = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HOUR_STEM_START = {0:0, 5:0, 1:2, 6:2, 2:4, 7:4, 3:6, 8:6, 4:8, 9:8};
const ANCHOR_DAYS = 10957;
const ANCHOR_IDX = 54;

const ELEM = ["목","화","토","금","수"];
const STEM_ELEM = [0,0,1,1,2,2,3,3,4,4];
const HIDDEN = {
  0:[[8,10],[9,20]], 1:[[9,9],[7,3],[5,18]], 2:[[4,7],[2,7],[0,16]],
  3:[[0,10],[1,20]], 4:[[1,9],[9,3],[4,18]], 5:[[4,7],[6,7],[2,16]],
  6:[[2,10],[5,9],[3,11]], 7:[[3,9],[1,3],[5,18]], 8:[[4,7],[8,7],[6,16]],
  9:[[6,10],[7,20]], 10:[[7,9],[3,3],[4,18]], 11:[[4,7],[0,7],[8,16]]
};
const TEN_GODS = ["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];

function gz(idx) {
  const i = ((idx % 60) + 60) % 60;
  return { stem: STEMS[i % 10], branch: BRANCHES[i % 12],
           hanja: STEMS_H[i % 10] + BRANCHES_H[i % 12], idx: i };
}

function tenGod(dayStemIdx, otherStemIdx) {
  const de = STEM_ELEM[dayStemIdx], oe = STEM_ELEM[otherStemIdx];
  const rel = ((oe - de) % 5 + 5) % 5;
  const samePolarity = (dayStemIdx % 2) === (otherStemIdx % 2);
  return TEN_GODS[rel * 2 + (samePolarity ? 0 : 1)];
}

function branchMainStem(branchIdx) {
  const h = HIDDEN[branchIdx];
  return h[h.length - 1][0];
}

function detectCombos(pillars) {
  const bs = new Set(["year","month","day","hour"].map(k => BRANCHES.indexOf(pillars[k].branch)));
  const combos = [];
  const SAMHAP = [
    { set: [8,0,4], king: 0, elem: 4, name: "신자진 삼합 수국" },
    { set: [11,3,7], king: 3, elem: 0, name: "해묘미 삼합 목국" },
    { set: [2,6,10], king: 6, elem: 1, name: "인오술 삼합 화국" },
    { set: [5,9,1], king: 9, elem: 3, name: "사유축 삼합 금국" }
  ];
  const BANGHAP = [
    { set: [2,3,4], elem: 0, name: "인묘진 방합 목국" },
    { set: [5,6,7], elem: 1, name: "사오미 방합 화국" },
    { set: [8,9,10], elem: 3, name: "신유술 방합 금국" },
    { set: [11,0,1], elem: 4, name: "해자축 방합 수국" }
  ];
  for (const h of SAMHAP) {
    const hit = h.set.filter(b => bs.has(b));
    if (hit.length === 3) combos.push({ name: h.name, elem: h.elem, bonus: 60 });
    else if (hit.length === 2 && hit.includes(h.king)) {
      const names = hit.map(b => BRANCHES[b]).join("");
      combos.push({ name: names + " 반합 " + ELEM[h.elem] + "국", elem: h.elem, bonus: 30 });
    }
  }
  for (const h of BANGHAP) {
    if (h.set.every(b => bs.has(b))) combos.push({ name: h.name, elem: h.elem, bonus: 45 });
  }
  return combos;
}

function computeStrength(pillars) {
  const score = [0,0,0,0,0];
  for (const key of ["year","month","day","hour"]) {
    const p = pillars[key];
    const stemIdx = STEMS.indexOf(p.stem);
    score[STEM_ELEM[stemIdx]] += 30;
    const brIdx = BRANCHES.indexOf(p.branch);
    const w = key === "month" ? 1.5 : 1.0;
    for (const [s, days] of HIDDEN[brIdx]) score[STEM_ELEM[s]] += days * w;
  }
  const combos = detectCombos(pillars);
  for (const c of combos) score[c.elem] += c.bonus;
  const total = score.reduce((a,b) => a+b, 0);
  const out = {};
  ELEM.forEach((e,i) => out[e] = { raw: Math.round(score[i]*10)/10, pct: Math.round(score[i]/total*1000)/10 });
  return { method: "지장간 분일 + 월지 1.5배 + 합국 가중(삼합60·반합30·방합45)",
           combos: combos.map(c => c.name + " (+" + c.bonus + ")"), scores: out };
}

function computeSaju(input, table) {
  const [Y, M, D] = input.date.split("-").map(Number);
  const [h, mi] = input.time.split(":").map(Number);
  const lon = input.lon;
  const gender = input.gender || "M";
  const adjMin = Math.round((lon - 135) * 4);

  const epochDays = Math.floor(Date.UTC(Y, M - 1, D) / 86400000);
  const utcMin = epochDays * 1440 + h * 60 + mi - 9 * 60;

  const tsAbsMin = epochDays * 1440 + h * 60 + mi + adjMin;
  const shifted = tsAbsMin + 60;
  const dayForPillar = Math.floor(shifted / 1440);
  const hourBranchIdx = Math.floor((((shifted % 1440) + 1440) % 1440) / 120);

  const dayIdx = ((((dayForPillar - ANCHOR_DAYS) % 60) + 60 + ANCHOR_IDX) % 60);
  const dayGZ = gz(dayIdx);

  let lo = 0, hi = table.length - 1, pos = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid][0] <= utcMin) { pos = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  if (pos < 0 || pos >= table.length - 1) throw new Error("지원 범위(1920~2050) 밖 출생");
  const yearGZ = gz(table[pos][1]);
  const monthGZ = gz(table[pos][2]);

  const hourStemIdx = (HOUR_STEM_START[dayIdx % 10] + hourBranchIdx) % 10;
  const hourGZ = { stem: STEMS[hourStemIdx], branch: BRANCHES[hourBranchIdx],
                   hanja: STEMS_H[hourStemIdx] + BRANCHES_H[hourBranchIdx] };

  const pillars = { year: yearGZ, month: monthGZ, day: dayGZ, hour: hourGZ };

  const dayStemIdx = dayIdx % 10;
  const sipsin = {};
  for (const key of ["year","month","hour"]) {
    const sIdx = STEMS.indexOf(pillars[key].stem);
    sipsin[key + "_stem"] = tenGod(dayStemIdx, sIdx);
  }
  sipsin.day_stem = "일간";
  for (const key of ["year","month","day","hour"]) {
    const bIdx = BRANCHES.indexOf(pillars[key].branch);
    sipsin[key + "_branch"] = tenGod(dayStemIdx, branchMainStem(bIdx));
  }

  const yearStemIdx = yearGZ.idx % 10;
  const forward = ((yearStemIdx % 2 === 0) === (gender === "M"));
  let boundaryMin;
  if (forward) boundaryMin = table[pos + 1][0];
  else boundaryMin = table[pos][0];
  const diffDays = Math.abs(boundaryMin - utcMin) / 1440;
  let daeunSu = Math.round(diffDays / 3);
  if (daeunSu < 1) daeunSu = 1;
  const daeun = [];
  for (let i = 1; i <= 8; i++) {
    const n = forward ? (monthGZ.idx + i) : (monthGZ.idx - i);
    daeun.push({ start_age: daeunSu + (i-1)*10, ...gz(n) });
  }

  return {
    pillars, sipsin,
    strength: computeStrength(pillars),
    daewoon: { direction: forward ? "순행" : "역행", su: daeunSu, list: daeun },
    true_solar_correction_minutes: adjMin,
    engine_version: "0.3",
    rules: { day_change: "진태양시 23:00 일진 교체(전통)", jieqi_time_basis: "표준시(절입 절대시각)",
             strength_method: "지장간 분일 + 월지 1.5배 + 합국 가중(삼합60·반합30·방합45, 학파 따라 상이)",
             daeun_method: "3일=1년 절기 거리, 반올림, 최소 1" }
  };
}

function currentDaeun(saju, birthDate, asOfDate) {
  const age = Math.floor((asOfDate - birthDate) / (365.2425 * 86400000));
  for (let i = saju.daewoon.list.length - 1; i >= 0; i--) {
    if (age >= saju.daewoon.list[i].start_age) return { age, ...saju.daewoon.list[i] };
  }
  return { age, note: "대운 진입 전" };
}

if (typeof module !== "undefined") module.exports = { computeSaju, currentDaeun, gz, tenGod };
