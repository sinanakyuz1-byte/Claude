import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LocationPicker } from '../components/LocationPicker';
import { OutageCard } from '../components/OutageCard';
import { EmptyState } from '../components/EmptyState';
import { useOutages } from '../hooks/useOutages';
import { useNotifications } from '../hooks/useNotifications';
import { getUserLocation, saveUserLocation } from '../services/storage';
import { UserLocation, Outage } from '../types';
import { COLORS } from '../constants';

export function HomeScreen() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    getUserLocation().then((loc) => {
      if (loc) setLocation(loc);
      setLocationLoaded(true);
    });
  }, []);

  useNotifications(location);

  const { outages, loading, error, lastUpdated, refresh } = useOutages(location);

  const handleLocationSelect = async (province: string, district: string) => {
    const loc = { province, district };
    setLocation(loc);
    await saveUserLocation(loc);
  };

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!locationLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kesinti Takip</Text>
        {lastUpdated ? (
          <Text style={styles.updated}>Son güncelleme: {formatLastUpdated(lastUpdated)}</Text>
        ) : null}
      </View>

      <LocationPicker
        onSelect={handleLocationSelect}
        initialProvince={location?.province}
        initialDistrict={location?.district}
      />

      {!location ? (
        <EmptyState
          icon="📍"
          title="Konumunuzu seçin"
          subtitle="Bölgenizdeki elektrik, su ve doğalgaz kesintilerini görmek için yukarıdan il ve ilçenizi seçin."
        />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Bağlantı hatası"
          subtitle={`Veriler alınamadı: ${error}`}
        />
      ) : loading && outages.length === 0 ? (
        <ActivityIndicator style={styles.center} color={COLORS.primary} />
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
              subtitle={`${location.province} / ${location.district} bölgesinde aktif veya planlı kesinti bulunmuyor.`}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  updated: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignSelf: 'center',
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
