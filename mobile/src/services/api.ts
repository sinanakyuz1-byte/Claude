import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { Outage, OutagesResponse, Province } from '../types';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export async function getOutages(params: {
  province?: string;
  district?: string;
  neighborhood?: string;
  type?: string;
}): Promise<OutagesResponse> {
  const res = await client.get<OutagesResponse>('/api/outages', { params });
  return res.data;
}

export async function getProvinces(): Promise<Province[]> {
  const res = await client.get<Province[]>('/api/provinces');
  return res.data;
}

export async function getDistricts(province: string): Promise<string[]> {
  const res = await client.get<string[]>('/api/districts', { params: { province } });
  return res.data;
}

export async function subscribeNotifications(payload: {
  expoPushToken: string;
  province: string;
  district: string;
  neighborhood?: string;
  types: string[];
}): Promise<void> {
  await client.post('/api/notifications/subscribe', payload);
}

export async function unsubscribeNotifications(expoPushToken: string): Promise<void> {
  await client.delete('/api/notifications/unsubscribe', { data: { expoPushToken } });
}
