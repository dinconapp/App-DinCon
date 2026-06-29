"use client";

import { useEffect, useState } from "react";
import { deleteTransaction, getTransactions, saveTransaction, type TransactionFilters } from "@/services/transactionService";
import type { Transaction, TransactionPayload } from "@/types/transaction";

export function useTransactions(userId: string, monthKey: string) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ total_income: 0, total_expense: 0 });
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);

  async function load(nextFilters = filters) {
    setLoading(true);
    try {
      const data = await getTransactions(userId, monthKey, nextFilters);
      setItems(data.items);
      setTotals({ total_income: data.total_income, total_expense: data.total_expense });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId, monthKey]);

  return {
    items,
    totals,
    filters,
    loading,
    setFilters: (next: TransactionFilters) => {
      setFilters(next);
      void load(next);
    },
    reload: load,
    save: async (payload: TransactionPayload, id?: string) => {
      await saveTransaction(payload, id);
      await load();
    },
    remove: async (id: string) => {
      await deleteTransaction(id);
      await load();
    }
  };
}
