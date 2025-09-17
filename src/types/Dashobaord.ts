export interface MarketData {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  date:string;
}

export interface ApiResponse {
  meta: {
    symbol: string;
    interval: string;
    exchange: string;
  };
  values: MarketData[];
  status: string;
}

export interface VolatilityData {
  date: string;
  close: number;
  lnReturn: number | null;
  lnSquared: number | null;
  
}

export interface GannLevel {
  degree: number;
  factor: number;
  resistance: number;
  support: number;
  resistancePrice: number;
  supportPrice: number;
}

// Define the SelectedAsset interface to match ApiFetchCard expectations
export interface SelectedAsset {
  type: "metal" | "stock" |"category";
  symbol: string;
  name: string;
}

