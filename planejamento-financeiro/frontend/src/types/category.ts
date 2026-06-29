export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon_key?: string;
  color?: string;
  active: boolean;
};
