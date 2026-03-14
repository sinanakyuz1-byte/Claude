import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { getProvinces, getDistricts } from '../services/api';
import { Province } from '../types';
import { COLORS } from '../constants';

interface Props {
  onSelect: (province: string, district: string) => void;
  initialProvince?: string;
  initialDistrict?: string;
}

type Step = 'province' | 'district';

export function LocationPicker({ onSelect, initialProvince, initialDistrict }: Props) {
  const [step, setStep] = useState<Step>('province');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince || '');
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict || '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (err) {
      console.error('İller yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (province: string) => {
    setLoading(true);
    try {
      const data = await getDistricts(province);
      setDistricts(data);
    } catch (err) {
      console.error('İlçeler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = async (province: Province) => {
    setSelectedProvince(province.name);
    setSelectedDistrict('');
    setSearch('');
    await loadDistricts(province.name);
    setStep('district');
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setModalVisible(false);
    onSelect(selectedProvince, district);
  };

  const filteredItems =
    step === 'province'
      ? provinces.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      : districts.filter((d) => d.toLowerCase().includes(search.toLowerCase()));

  const buttonLabel =
    selectedProvince && selectedDistrict
      ? `${selectedProvince} / ${selectedDistrict}`
      : selectedProvince
      ? `${selectedProvince} - İlçe seçin`
      : 'Konum seçin';

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setStep(selectedProvince && !selectedDistrict ? 'district' : 'province');
          setSearch('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>📍 {buttonLabel}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (step === 'district') {
                  setStep('province');
                  setSearch('');
                } else {
                  setModalVisible(false);
                }
              }}
            >
              <Text style={styles.backText}>← {step === 'district' ? selectedProvince : 'İptal'}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 'province' ? 'İl Seçin' : 'İlçe Seçin'}
            </Text>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder={step === 'province' ? 'İl ara...' : 'İlçe ara...'}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          {loading ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : (
            <FlatList
              data={filteredItems as any[]}
              keyExtractor={(item, i) => (typeof item === 'string' ? item : item.code) + i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() =>
                    step === 'province'
                      ? handleProvinceSelect(item as Province)
                      : handleDistrictSelect(item as string)
                  }
                >
                  <Text style={styles.listItemText}>
                    {typeof item === 'string' ? item : item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loader: {
    marginTop: 40,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  listItemText: {
    fontSize: 15,
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
