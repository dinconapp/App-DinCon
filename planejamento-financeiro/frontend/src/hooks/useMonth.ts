"use client";

import { useState } from "react";

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  return toMonthKey(new Date(year, month - 1 + delta, 1));
}

export function useMonth(initial = toMonthKey(new Date())) {
  const [monthKey, setMonthKey] = useState(initial);
  return {
    monthKey,
    setMonthKey,
    previousMonth: () => setMonthKey((value) => shiftMonth(value, -1)),
    nextMonth: () => setMonthKey((value) => shiftMonth(value, 1))
  };
}
