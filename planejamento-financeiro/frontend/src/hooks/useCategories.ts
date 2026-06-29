"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/services/categoryService";
import type { Category } from "@/types/category";

export function useCategories() {
  const [items, setItems] = useState<Category[]>([]);
  useEffect(() => {
    void getCategories().then(setItems);
  }, []);
  return { items, income: items.filter((item) => item.type === "income"), expense: items.filter((item) => item.type === "expense") };
}
