const STEMS = ["갑","을","병","정","무","기","경","신","임","계"];
const BRANCHES = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const STEMS_H = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES_H = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HOUR_STEM_START = {0:0, 5:0, 1:2, 6:2, 2:4, 7:4, 3:6, 8:6, 4:8, 9:8};
const ANCHOR_DAYS = 10957;
const ANCHOR_IDX = 54;

function gz(idx) {
  const i = ((idx % 60) + 60) % 60;
  return { stem: STEMS[i % 10], branch: BRANCHES[i % 12],
           hanja: STEMS_H[i % 10] + BRANCHES_H[i % 12], idx: i };
}

function computeSaju(input, table) {
  const [Y, M, D] = input.date.split("-").map(Number);
  const [h, mi] = input.time.split(":").map(Number);
  const lon = input.lon;
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
  if (pos < 0) throw new Error("지원 범위(1920~2050) 이전 출생");
  const yearGZ = gz(table[pos][1]);
  const monthGZ = gz(table[pos][2]);

  const hourStemIdx = (HOUR_STEM_START[dayIdx % 10] + hourBranchIdx) % 10;
  const hourGZ = { stem: STEMS[hourStemIdx], branch: BRANCHES[hourBranchIdx],
                   hanja: STEMS_H[hourStemIdx] + BRANCHES_H[hourBranchIdx] };

  return {
    pillars: { year: yearGZ, month: monthGZ, day: dayGZ, hour: hourGZ },
    true_solar_correction_minutes: adjMin,
    rules: { day_change: "진태양시 23:00 일진 교체(전통)", jieqi_time_basis: "표준시(절입 절대시각)" }
  };
}

if (typeof module !== "undefined") module.exports = { computeSaju, gz };
