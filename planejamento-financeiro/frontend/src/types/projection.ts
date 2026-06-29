export type ProjectionPoint = {
  month_key: string;
  month_short: string;
  balance: number;
};

export type Projection = {
  items: ProjectionPoint[];
  markers: Record<string, number>;
};
