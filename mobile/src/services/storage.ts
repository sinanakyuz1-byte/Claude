import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserLocation } from '../types';

const LOCATION_KEY = '@user_location';
const PUSH_TOKEN_KEY = '@expo_push_token';

export async function saveUserLocation(location: UserLocation): Promise<void> {
  await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}

export async function getUserLocation(): Promise<UserLocation | null> {
  const raw = await AsyncStorage.getItem(LOCATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function getPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}
