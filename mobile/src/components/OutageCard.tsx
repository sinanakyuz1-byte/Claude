import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Outage } from '../types';
import { COLORS, TYPE_LABELS, STATUS_LABELS, TYPE_ICONS } from '../constants';

interface Props {
  outage: Outage;
}

export function OutageCard({ outage }: Props) {
  const typeColor = COLORS[outage.type] || COLORS.text;
  const statusColor = COLORS[outage.status] || COLORS.textMuted;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const districts = outage.districts.slice(0, 4).join(', ');
  const moreDistricts = outage.districts.length > 4 ? ` +${outage.districts.length - 4}` : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <Text style={[styles.typeIcon]}>{TYPE_ICONS[outage.type]}</Text>
          <Text style={[styles.typeText, { color: typeColor }]}>
            {TYPE_LABELS[outage.type]}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[outage.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.provider}>{outage.provider}</Text>

      {districts ? (
        <Text style={styles.districts}>
          {districts}{moreDistricts}
        </Text>
      ) : null}

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Başlangıç:</Text>
        <Text style={styles.timeValue}>{formatDate(outage.startTime)}</Text>
      </View>

      {outage.endTime ? (
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Tahmini Bitiş:</Text>
          <Text style={styles.timeValue}>{formatDate(outage.endTime)}</Text>
        </View>
      ) : null}

      {outage.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {outage.description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  provider: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  districts: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
});
