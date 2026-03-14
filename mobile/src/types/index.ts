export type OutageType = 'electricity' | 'water' | 'gas';
export type OutageStatus = 'active' | 'planned' | 'resolved';

export interface Outage {
  id: string;
  type: OutageType;
  status: OutageStatus;
  provider: string;
  province: string;
  districts: string[];
  neighborhoods: string[];
  startTime: string;
  endTime: string | null;
  description: string | null;
  scrapedAt: string;
}

export interface Province {
  code: string;
  name: string;
}

export interface UserLocation {
  province: string;
  district: string;
  neighborhood?: string;
}

export interface OutagesResponse {
  count: number;
  lastUpdated: string | null;
  data: Outage[];
}
