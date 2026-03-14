import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { OutageCard } from '../components/OutageCard';
import { EmptyState } from '../components/EmptyState';
import { useOutages } from '../hooks/useOutages';
import { UserLocation, OutageType, Outage } from '../types';
import { COLORS, TYPE_LABELS, TYPE_ICONS } from '../constants';

interface Props {
  location: UserLocation | null;
  type: OutageType;
}

export function OutageListScreen({ location, type }: Props) {
  const { outages, loading, error, refresh } = useOutages(location, type);

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="📍"
          title="Konum seçilmedi"
          subtitle="Ana ekrandan il ve ilçenizi seçin."
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState icon="⚠️" title="Hata" subtitle={error} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{TYPE_ICONS[type]}</Text>
        <Text style={styles.title}>{TYPE_LABELS[type]} Kesintileri</Text>
      </View>
      {loading && outages.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : (
        <FlatList<Outage>
          data={outages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OutageCard outage={item} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="✅"
              title="Kesinti yok"
              subtitle={`${location.province} / ${location.district} bölgesinde ${TYPE_LABELS[type].toLowerCase()} kesintisi bulunmuyor.`}
            />
          }
          contentContainerStyle={outages.length === 0 ? styles.emptyList : styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  loader: {
    marginTop: 80,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
  },
});
