"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  calculateDashaLevels,
  getActiveDashaState,
  calculateNavaTara,
  getUpcomingFavorableTaras,
  getBirthTimestamp,
  formatDisplayDate,
  formatDisplayDateTime,
  PLANET_NAMES,
} from "./dashaCalculator";

const DEFAULT_BIRTH_DETAILS = {
  year: 1993,
  month: 10,
  day: 31,
  hour: 5,
  minute: 40,
  second: 30,
  moonDegree: 19.091677349400126,
};

const LEVEL_LABELS = [
  "Mahadasha",
  "Antardasha",
  "Pratyantardasha",
  "Sookshma Dasha",
];

export default function DashaViewer({ birthDetails = DEFAULT_BIRTH_DETAILS }) {
  // 1. Defer `new Date()` to useEffect so Next.js static prerendering never blocks
  const [today, setToday] = useState(null);
  const [navigationPath, setNavigationPath] = useState(null);
  const [showUpcomingTaras, setShowUpcomingTaras] = useState(false);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const birthTimestamp = useMemo(() => {
    return getBirthTimestamp(birthDetails);
  }, [birthDetails]);

  // 2. Compute active Dasha & Nava Tara only after `today` is populated on the client
  const { activePath, activeNode } = useMemo(() => {
    if (!today) return { activePath: [], activeNode: null };
    return getActiveDashaState(birthTimestamp, birthDetails.moonDegree, today);
  }, [birthTimestamp, birthDetails.moonDegree, today]);

  const navaTara = useMemo(() => {
    if (!today) return null;
    return calculateNavaTara(birthDetails.moonDegree, today);
  }, [birthDetails.moonDegree, today]);

  const upcomingFavorableTaras = useMemo(() => {
    if (!today) return [];
    return getUpcomingFavorableTaras(birthDetails.moonDegree, today, 28);
  }, [birthDetails.moonDegree, today]);

  const defaultLevel3Path = useMemo(() => activePath.slice(0, 2), [activePath]);

  // Set default Level 3 path once `defaultLevel3Path` is computed on client mount
  useEffect(() => {
    if (defaultLevel3Path.length > 0) {
      setNavigationPath(defaultLevel3Path);
    }
  }, [defaultLevel3Path]);

  const activeNavPath = navigationPath ?? defaultLevel3Path;

  const currentPeriods = useMemo(() => {
    if (!today) return [];
    return calculateDashaLevels(
      birthTimestamp,
      birthDetails.moonDegree,
      activeNavPath,
    );
  }, [birthTimestamp, birthDetails.moonDegree, activeNavPath, today]);

  // 3. Lightweight skeleton during SSR/prerender before client clock hydrates
  if (!today || !navaTara) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen font-sans">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-6 space-y-5 animate-pulse">
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-36 w-full bg-slate-200 rounded-2xl" />
          <div className="h-24 w-full bg-slate-100 rounded-2xl" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 w-full bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isViewingDefaultActiveLevel3 =
    activeNavPath.join("-") === defaultLevel3Path.join("-");

  const handleRowClick = (planetCode) => {
    if (activeNavPath.length < 3) {
      setNavigationPath([...activeNavPath, planetCode]);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setNavigationPath([]);
    } else {
      setNavigationPath(activeNavPath.slice(0, index + 1));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen font-sans box-border">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 sm:p-8 space-y-5">
        {/* Header Section */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Dasha Explorer
            </h1>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Live Today
            </div>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Birth: {formatDisplayDateTime(new Date(birthTimestamp))}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>
              Janma:{" "}
              <strong className="text-slate-700">
                {navaTara.birthNakshatra}
              </strong>
            </span>
          </p>
        </div>

        {/* Currently Active 4-Level Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-4 sm:p-6 text-white shadow-xl">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3.5 relative z-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/80 block mb-2">
                Current Active Hierarchy
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activePath.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10"
                  >
                    <span className="text-[9px] uppercase tracking-wider text-indigo-200/70 font-semibold truncate">
                      {LEVEL_LABELS[idx]}
                    </span>
                    <span className="text-sm sm:text-base font-bold tracking-wide text-white mt-0.5 truncate">
                      {code}{" "}
                      <span className="text-[10px] font-normal text-indigo-200">
                        ({PLANET_NAMES[code]})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {activeNode && (
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-200/70 block">
                    Active Sookshma Duration
                  </span>
                  <span className="text-xs font-bold font-mono text-indigo-100 mt-0.5 block">
                    {formatDisplayDate(activeNode.startDate)} —{" "}
                    {formatDisplayDate(activeNode.endDate)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Running Now
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nava Tara Card + Next 4 Weeks Favorable Days */}
        <div
          className={`rounded-2xl p-4 border transition-all flex flex-col gap-3 ${
            navaTara.isFavorable
              ? "bg-emerald-50/60 border-emerald-200/70"
              : "bg-amber-50/70 border-amber-200/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Nava Tara Today • Moon in {navaTara.currentNakshatra}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {navaTara.taraName} Tara
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    navaTara.isFavorable
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  {navaTara.statusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/50">
            <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">
              Significance
            </span>
            <p className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">
              {navaTara.significance}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/50">
            <button
              onClick={() => setShowUpcomingTaras((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-emerald-800 bg-white/80 hover:bg-white px-3 py-2 rounded-xl border border-emerald-200/80 transition-all cursor-pointer"
            >
              <span>
                Favorable Days — Next 4 Weeks ({upcomingFavorableTaras.length}{" "}
                days)
              </span>
              <span className="text-emerald-600 text-sm leading-none">
                {showUpcomingTaras ? "−" : "+"}
              </span>
            </button>

            {showUpcomingTaras && (
              <div className="mt-2.5 max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {upcomingFavorableTaras.map((item) => (
                  <div
                    key={item.formattedDate}
                    className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          {item.formattedDate}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({item.dayName})
                        </span>
                        {item.isToday && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {item.currentNakshatra} • {item.significance}
                      </span>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.taraName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200/60">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-600 overflow-x-auto">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className={`hover:text-indigo-600 transition-colors cursor-pointer shrink-0 ${
                activeNavPath.length === 0 ? "font-bold text-indigo-600" : ""
              }`}
            >
              Mahadasha
            </button>
            {activeNavPath.map((code, idx) => (
              <React.Fragment key={idx}>
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-indigo-600 transition-colors cursor-pointer shrink-0 ${
                    activeNavPath.length === idx + 1
                      ? "font-bold text-indigo-600"
                      : ""
                  }`}
                >
                  {code}
                </button>
              </React.Fragment>
            ))}
          </div>

          {!isViewingDefaultActiveLevel3 && (
            <button
              onClick={() => setNavigationPath(defaultLevel3Path)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
            >
              Reset to Active L3
            </button>
          )}
        </div>

        {/* Sub-Period List Cards */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {LEVEL_LABELS[activeNavPath.length]} Periods
          </div>

          <div className="space-y-2">
            {currentPeriods.map((period) => {
              const isSameBranch = activeNavPath.every(
                (code, idx) => activePath[idx] === code,
              );
              const isCurrentlyActiveToday =
                isSameBranch &&
                activePath[activeNavPath.length] === period.planetCode;

              return (
                <div
                  key={period.planetCode}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isCurrentlyActiveToday
                      ? "bg-amber-50/70 border-amber-300 shadow-sm"
                      : "bg-white border-slate-200/80 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-slate-900 truncate">
                      {activeNavPath.length > 0
                        ? `${activeNavPath.join(" - ")} - `
                        : ""}
                      {period.planetCode}
                      <span className="font-normal text-slate-500 text-xs ml-1">
                        ({period.planetName})
                      </span>
                    </span>
                    {isCurrentlyActiveToday && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-sans text-slate-400 block">
                        From
                      </span>
                      <span>{formatDisplayDate(period.startDate)}</span>
                    </div>
                    <span className="text-slate-300">→</span>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-sans text-slate-400 block">
                        To
                      </span>
                      <span>{formatDisplayDate(period.endDate)}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    {activeNavPath.length < 3 ? (
                      <button
                        onClick={() => handleRowClick(period.planetCode)}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Drill Down</span>
                        <span>→</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium italic bg-slate-100 px-3 py-1.5 rounded-xl block text-center w-full">
                        Max Depth (Level 4 Sookshma)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
