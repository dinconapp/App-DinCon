"use client";

import { useEffect, useState } from "react";
import { getHealth, getUser, updateUser } from "@/services/userService";
import type { User } from "@/types/user";

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<User | null>(null);
  const [health, setHealth] = useState<{ database_connected: boolean; database_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [user, db] = await Promise.all([getUser(userId), getHealth()]);
      setProfile(user);
      setHealth(db);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  return {
    profile,
    health,
    loading,
    reload: load,
    save: async (payload: Pick<User, "name" | "email" | "phone"> & Partial<Pick<User, "initial_balance" | "base_month">>) => {
      const updated = await updateUser(userId, payload);
      setProfile(updated);
      return updated;
    }
  };
}
