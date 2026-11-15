// dashaCalculator.js

const DAYS_IN_YEAR = 365.25;
const MS_PER_YEAR = DAYS_IN_YEAR * 24 * 60 * 60 * 1000;
const TOTAL_YEARS = 120;
const DURATION_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]; // Ke, Ve, Su, Mo, Ma, Ra, Ju, Sa, Me
const PLANETS = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"];

export const PLANET_NAMES = {
  Ke: "Ketu",
  Ve: "Venus",
  Su: "Sun",
  Mo: "Moon",
  Ma: "Mars",
  Ra: "Rahu",
  Ju: "Jupiter",
  Sa: "Saturn",
  Me: "Mercury",
};

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanistha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const NAVA_TARAS = [
  {
    id: 1,
    name: "Janma",
    isFavorable: false,
    significance: "Focus on self-care, mindfulness, and steady routines",
  },
  {
    id: 2,
    name: "Sampat",
    isFavorable: true,
    significance: "Wealth, prosperity, and material gains",
  },
  {
    id: 3,
    name: "Vipat",
    isFavorable: false,
    significance: "Take extra care with decisions, travel, and new ventures",
  },
  {
    id: 4,
    name: "Kshema",
    isFavorable: true,
    significance: "Well-being, safety, comfort, and stability",
  },
  {
    id: 5,
    name: "Pratyari",
    isFavorable: false,
    significance:
      "Navigate disagreements patiently and avoid unnecessary friction",
  },
  {
    id: 6,
    name: "Sadhaka",
    isFavorable: true,
    significance: "Achievement, productivity, and goal realization",
  },
  {
    id: 7,
    name: "Nidhana",
    isFavorable: false,
    significance:
      "Prioritize rest, review plans carefully, and avoid major risks",
  },
  {
    id: 8,
    name: "Mitra",
    isFavorable: true,
    significance: "Support, collaboration, and friendly harmony",
  },
  {
    id: 9,
    name: "Ati-Mitra",
    isFavorable: true,
    significance: "Highly favorable energy and deep supportive alignment",
  },
];

function fract(val) {
  return val - Math.floor(val);
}

function getNakshatra(longitude) {
  let nak = Math.floor(longitude * 0.075);
  if (nak >= 18) nak -= 18;
  if (nak >= 9) nak -= 9;
  return nak;
}

function balanceOfDasha(moonDegree) {
  const d0 = 9.0 * fract(moonDegree / 120);
  const n0 = fract(d0);
  const q = Math.floor(d0);
  return (1 - n0) * DURATION_YEARS[q];
}

/**
 * Converts birth details into exact UTC timestamp (Milliseconds)
 */
export function getBirthTimestamp({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
}) {
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

export function timestampToDate(timestamp) {
  return new Date(timestamp);
}

export function formatDisplayDate(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "--/--/----";
  const dd = String(dateObj.getUTCDate()).padStart(2, "0");
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDisplayDateTime(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "--/--/---- --:--";
  const dateStr = formatDisplayDate(dateObj);
  const hh = String(dateObj.getUTCHours()).padStart(2, "0");
  const min = String(dateObj.getUTCMinutes()).padStart(2, "0");
  return `${dateStr} at ${hh}:${min} UTC`;
}

/**
 * Generates continuous, gapless planetary periods using exact timestamp math
 */
export function calculateDashaLevels(birthTimestamp, moonDegree, path = []) {
  const nakshatra = getNakshatra(moonDegree);

  // Level 0: Mahadasha
  if (path.length === 0) {
    let currentStartMs = birthTimestamp;
    const results = [];

    for (let count = 0, i = nakshatra; count < 9; count++, i++) {
      if (i >= 9) i -= 9;

      const durationYears =
        count === 0 ? balanceOfDasha(moonDegree) : DURATION_YEARS[i];
      const durationMs = durationYears * MS_PER_YEAR;
      const currentEndMs = currentStartMs + durationMs;

      results.push({
        planetCode: PLANETS[i],
        planetName: PLANET_NAMES[PLANETS[i]],
        startDate: timestampToDate(currentStartMs),
        endDate: timestampToDate(currentEndMs),
        startTimestamp: currentStartMs,
        endTimestamp: currentEndMs,
        index: i,
      });

      currentStartMs = currentEndMs; // Guarantees zero gaps
    }
    return results;
  }

  // Nested Levels (Antardasha, Pratyantardasha, Sookshma)
  const parentPeriods = calculateDashaLevels(
    birthTimestamp,
    moonDegree,
    path.slice(0, path.length - 1),
  );
  const parentNode = parentPeriods.find(
    (p) => p.planetCode === path[path.length - 1],
  );

  if (!parentNode) return [];

  const parentStartMs = parentNode.startTimestamp;
  const parentSpanMs = parentNode.endTimestamp - parentStartMs;

  let currentStartMs = parentStartMs;
  const results = [];

  for (let count = 0, i = parentNode.index; count < 9; count++, i++) {
    if (i >= 9) i -= 9;

    const spanFraction = DURATION_YEARS[i] / TOTAL_YEARS;
    const periodMs = parentSpanMs * spanFraction;
    const currentEndMs = currentStartMs + periodMs;

    results.push({
      planetCode: PLANETS[i],
      planetName: PLANET_NAMES[PLANETS[i]],
      startDate: timestampToDate(currentStartMs),
      endDate: timestampToDate(currentEndMs),
      startTimestamp: currentStartMs,
      endTimestamp: currentEndMs,
      index: i,
    });

    currentStartMs = currentEndMs;
  }

  return results;
}

/**
 * Traces exact active path down to 4 levels for a given target timestamp
 */
export function getActiveDashaState(
  birthTimestamp,
  moonDegree,
  targetDateObj = new Date(),
) {
  const targetMs = targetDateObj.getTime();
  const activePath = [];
  let activeSookshmaNode = null;

  for (let level = 0; level < 4; level++) {
    const periods = calculateDashaLevels(
      birthTimestamp,
      moonDegree,
      activePath,
    );
    if (!periods.length) break;

    // Strict boundary condition: targetMs >= start AND targetMs < end
    let matched = periods.find(
      (p) => targetMs >= p.startTimestamp && targetMs < p.endTimestamp,
    );

    if (!matched) {
      if (targetMs < periods[0].startTimestamp) {
        matched = periods[0];
      } else {
        matched = periods[periods.length - 1];
      }
    }

    activePath.push(matched.planetCode);
    activeSookshmaNode = matched;
  }

  return {
    activePath,
    activeNode: activeSookshmaNode,
  };
}

/**
 * Computes Sidereal Moon Longitude (Lahiri Ayanamsa)
 */
export function getSiderealMoonDegree(dateObj = new Date()) {
  const jd = dateObj.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const T = d / 36525.0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const norm360 = (deg) => ((deg % 360) + 360) % 360;

  const L0 = norm360(218.3164477 + 481267.88123421 * T);
  const D = norm360(297.8501921 + 445267.1114034 * T);
  const M = norm360(357.5291092 + 35999.0502909 * T);
  const Mm = norm360(134.9633964 + 477198.8675055 * T);
  const F = norm360(93.272095 + 483202.0175233 * T);

  const dL =
    6.288774 * Math.sin(toRad(Mm)) +
    1.274027 * Math.sin(toRad(2 * D - Mm)) +
    0.658314 * Math.sin(toRad(2 * D)) +
    0.213618 * Math.sin(toRad(2 * Mm)) -
    0.185116 * Math.sin(toRad(M)) -
    0.114332 * Math.sin(toRad(2 * F));

  const tropicalMoon = norm360(L0 + dL);
  const ayanamsa = 23.853 + 0.013969 * (d / 365.25);

  return norm360(tropicalMoon - ayanamsa);
}

/**
 * Computes precise intraday Nava Tara transitions for a given date
 */
/**
 * Computes exact local-day intraday Nava Tara & finds the exact transition time
 */
export function calculateIntradayNavaTara(
  birthMoonDegree,
  targetDateObj = new Date(),
) {
  const nakSpan = 360 / 27;
  const norm360 = (deg) => ((deg % 360) + 360) % 360;

  const birthNakIndex = Math.floor(norm360(birthMoonDegree) / nakSpan);
  const currentMoonDeg = getSiderealMoonDegree(targetDateObj);
  const currentNakIndex = Math.floor(norm360(currentMoonDeg) / nakSpan);

  const count = ((currentNakIndex - birthNakIndex + 27) % 27) + 1;
  const taraNumber = ((count - 1) % 9) + 1;
  const taraMeta = NAVA_TARAS.find((t) => t.id === taraNumber);

  // Scan remaining minutes of the user's local day in 15-minute steps to find exact transition
  let nextShift = null;
  const endOfLocalDay = new Date(
    targetDateObj.getFullYear(),
    targetDateObj.getMonth(),
    targetDateObj.getDate(),
    23,
    59,
    59,
  );

  const stepMs = 15 * 60 * 1000;
  for (
    let t = targetDateObj.getTime() + stepMs;
    t <= endOfLocalDay.getTime();
    t += stepMs
  ) {
    const probeDate = new Date(t);
    const probeNakIndex = Math.floor(
      norm360(getSiderealMoonDegree(probeDate)) / nakSpan,
    );

    if (probeNakIndex !== currentNakIndex) {
      const futureCount = ((probeNakIndex - birthNakIndex + 27) % 27) + 1;
      const futureTaraNum = ((futureCount - 1) % 9) + 1;
      const futureMeta = NAVA_TARAS.find((t) => t.id === futureTaraNum);

      nextShift = {
        time: probeDate,
        nakshatra: NAKSHATRAS[probeNakIndex],
        taraName: futureMeta.name,
        isFavorable: futureMeta.isFavorable,
      };
      break;
    }
  }

  return {
    birthNakshatra: NAKSHATRAS[birthNakIndex],
    currentNakshatra: NAKSHATRAS[currentNakIndex],
    countFromJanma: count,
    taraNumber,
    taraName: taraMeta.name,
    isFavorable: taraMeta.isFavorable,
    statusLabel: taraMeta.isFavorable ? "Favorable" : "Observe Caution",
    significance: taraMeta.significance,
    nextShift,
  };
}

/**
 * Scans the next `daysCount` days (morning & evening slots) and returns all favorable Tara windows
 */
export function getUpcomingFavorableTaras(
  birthMoonDegree,
  startDateObj = new Date(),
  daysCount = 28,
) {
  const favorableWindows = [];
  const baseYear = startDateObj.getFullYear();
  const baseMonth = startDateObj.getMonth();
  const baseDay = startDateObj.getDate();

  for (let offset = 0; offset < daysCount; offset++) {
    const morningDate = new Date(
      baseYear,
      baseMonth,
      baseDay + offset,
      8,
      0,
      0,
    );
    const eveningDate = new Date(
      baseYear,
      baseMonth,
      baseDay + offset,
      20,
      0,
      0,
    );

    const morningTara = calculateIntradayNavaTara(birthMoonDegree, morningDate);
    const eveningTara = calculateIntradayNavaTara(birthMoonDegree, eveningDate);

    const dd = String(morningDate.getDate()).padStart(2, "0");
    const mm = String(morningDate.getMonth() + 1).padStart(2, "0");
    const yyyy = morningDate.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    const dayName = morningDate.toLocaleDateString("en-US", {
      weekday: "short",
    });

    // If the same favorable Nakshatra covers the whole day, show as a single full-day entry
    if (
      morningTara.isFavorable &&
      eveningTara.isFavorable &&
      morningTara.currentNakshatra === eveningTara.currentNakshatra
    ) {
      favorableWindows.push({
        formattedDate,
        dayName,
        timeWindow: "Full Day",
        isToday: offset === 0,
        ...morningTara,
      });
    } else {
      if (morningTara.isFavorable) {
        favorableWindows.push({
          formattedDate,
          dayName,
          timeWindow: "Morning",
          isToday: offset === 0,
          ...morningTara,
        });
      }
      if (eveningTara.isFavorable) {
        favorableWindows.push({
          formattedDate,
          dayName,
          timeWindow: "Evening",
          isToday: offset === 0,
          ...eveningTara,
        });
      }
    }
  }

  return favorableWindows;
}
