"use client";

import { useEffect, useState } from "react";
import { createWhatsappAccount, deleteWhatsappAccount, getWhatsappAccounts } from "@/services/whatsappService";
import type { WhatsAppAccount } from "@/types/whatsapp";

export function useWhatsappAccounts(userId: string) {
  const [items, setItems] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await getWhatsappAccounts(userId));
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
    create: async (phoneNumber: string) => {
      await createWhatsappAccount({ user_id: userId, phone_number: phoneNumber, provider: "twilio" });
      await load();
    },
    remove: async (id: string) => {
      await deleteWhatsappAccount(id);
      await load();
    }
  };
}
