export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const COLORS = {
  electricity: '#F59E0B',
  water: '#3B82F6',
  gas: '#EF4444',
  active: '#EF4444',
  planned: '#F59E0B',
  resolved: '#10B981',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  primary: '#2563EB',
};

export const TYPE_LABELS: Record<string, string> = {
  electricity: 'Elektrik',
  water: 'Su',
  gas: 'Doğalgaz',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif Arıza',
  planned: 'Planlı Kesinti',
  resolved: 'Giderildi',
};

export const TYPE_ICONS: Record<string, string> = {
  electricity: '⚡',
  water: '💧',
  gas: '🔥',
};
