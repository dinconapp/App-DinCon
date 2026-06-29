"use client";

import { useCallback, useEffect, useState } from "react";
import { createSavingsInvestment, deleteSavingsInvestment, getSavingsDashboard, updateSavingsInvestment } from "@/services/savingsService";
import type { SavingsDashboard, SavingsInvestment, SavingsInvestmentPayload } from "@/types/savings";

export function useSavings(userId: string, months = 12) {
  const [data, setData] = useState<SavingsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getSavingsDashboard(userId, months));
    } catch {
      setError("Nao foi possivel carregar o Cofrinho.");
    } finally {
      setLoading(false);
    }
  }, [userId, months]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(payload: SavingsInvestmentPayload, id?: string) {
    if (id) {
      const { user_id: _userId, ...updatePayload } = payload;
      void _userId;
      await updateSavingsInvestment(id, updatePayload);
    } else {
      await createSavingsInvestment(payload);
    }
    await load();
  }

  async function remove(item: SavingsInvestment) {
    await deleteSavingsInvestment(item.id);
    await load();
  }

  return { data, loading, error, save, remove, reload: load };
}
