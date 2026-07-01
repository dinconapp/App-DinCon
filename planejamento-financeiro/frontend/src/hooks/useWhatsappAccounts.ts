"use client";

import { useEffect, useState } from "react";
import { createWhatsappAccount, deactivateWhatsappAccount, deleteWhatsappAccount, getWhatsappAccounts, updateWhatsappAccount } from "@/services/whatsappService";
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
    create: async (phoneNumber: string, alias: string) => {
      await createWhatsappAccount({ user_id: userId, phone_number: phoneNumber, alias, provider: "twilio" });
      await load();
    },
    update: async (id: string, payload: { alias?: string | null; phoneNumber?: string | null; active?: boolean | null }) => {
      await updateWhatsappAccount(id, {
        alias: payload.alias,
        phone_number: payload.phoneNumber,
        active: payload.active,
      });
      await load();
    },
    deactivate: async (id: string) => {
      await deactivateWhatsappAccount(id);
      await load();
    },
    remove: async (id: string) => {
      await deleteWhatsappAccount(id);
      await load();
    }
  };
}
