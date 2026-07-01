"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatMonthParam, resolveMonthKey, shiftMonthKey } from "@/utils/month";

export function useMonth(initial?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlMonth = searchParams.get("month");
  const resolvedInitial = useMemo(() => resolveMonthKey(initial ?? urlMonth), [initial, urlMonth]);
  const [monthKey, setMonthKey] = useState(resolvedInitial);

  useEffect(() => {
    const nextMonth = resolveMonthKey(urlMonth);
    setMonthKey((current) => (current === nextMonth ? current : nextMonth));
  }, [urlMonth]);

  function updateMonth(nextMonthKey: string) {
    setMonthKey(nextMonthKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonthKey);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return {
    monthKey,
    setMonthKey: updateMonth,
    previousMonth: () => updateMonth(shiftMonthKey(monthKey, -1)),
    nextMonth: () => updateMonth(shiftMonthKey(monthKey, 1)),
    monthParam: formatMonthParam(new Date(monthKey + "-01"))
  };
}
