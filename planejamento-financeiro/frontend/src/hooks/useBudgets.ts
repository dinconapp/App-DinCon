"use client";

import { useEffect, useState } from "react";
import { deleteBudget, getBudgets, saveBudget } from "@/services/budgetService";
import type { Budget, BudgetPayload } from "@/types/budget";

export function useBudgets(userId: string) {
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await getBudgets(userId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  return {
    items,
    loading,
    reload: load,
    save: async (payload: BudgetPayload, id?: string) => {
      await saveBudget(payload, id);
      await load();
    },
    remove: async (id: string) => {
      await deleteBudget(id);
      await load();
    }
  };
}
