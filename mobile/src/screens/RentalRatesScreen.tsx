import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, RefreshControl, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRentalRates, useAssets, useCreateRentalRate, useUpdateRentalRate, useDeleteRentalRate } from '../hooks/useApi';
import type { AssetRentalRate } from '../types';
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';

interface RateFormData {
  assetId: string;
  duration: string;
  timeUnit: string;
  amount: string;
}

export default function RentalRatesScreen() {
  const { colors, isDark } = useTheme();
  const { data: rentalRates = [], isLoading, refetch } = useRentalRates();
  const { data: assets = [] } = useAssets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState<AssetRentalRate | null>(null);
  const [formData, setFormData] = useState<RateFormData>({
    assetId: '',
    duration: '',
    timeUnit: 'hrs',
    amount: '',
  });

  const createMutation = useCreateRentalRate();
  const updateMutation = useUpdateRentalRate();
  const deleteMutation = useDeleteRentalRate();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const activeAssets = useMemo(() => assets.filter(a => a.status === 'Active'), [assets]);

  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const existingRatesForAsset = useMemo(() => {
    if (!formData.assetId) return [];
    return rentalRates.filter(r => r.assetId === formData.assetId && (!editingRate || r.id !== editingRate.id));
  }, [formData.assetId, rentalRates, editingRate]);

  const isDuplicateRate = useMemo(() => {
    if (!formData.assetId || !formData.duration || !formData.timeUnit) return false;
    const duration = parseInt(formData.duration);
    return rentalRates.some(rate =>
      rate.assetId === formData.assetId &&
      rate.duration === duration &&
      rate.timeUnit === formData.timeUnit &&
      (!editingRate || rate.id !== editingRate.id)
    );
  }, [formData.assetId, formData.duration, formData.timeUnit, rentalRates, editingRate]);

  const rateAmountWarning = useMemo(() => {
    if (!formData.amount || Number(formData.amount) <= 0 || !formData.duration) return null;
    const currentAmount = Number(formData.amount);
    const currentDuration = parseInt(formData.duration);
    const currentUnit = formData.timeUnit;

    const lowerDurationRates = existingRatesForAsset.filter(r => {
      if (r.timeUnit === currentUnit) {
        return r.duration < currentDuration;
      }
      if (currentUnit === 'day' && r.timeUnit === 'hrs') {
        return true;
      }
      return false;
    });

    for (const rate of lowerDurationRates) {
      const rateAmount = Number(rate.amount);
      if (currentAmount <= rateAmount) {
        return `You already have ${rate.duration} ${rate.timeUnit} configured at Rs.${rateAmount}. Consider setting a higher amount.`;
      }
    }
    return null;
  }, [existingRatesForAsset, formData.amount, formData.duration, formData.timeUnit]);

  const groupedRates = useMemo(() => {
    const groups: Record<string, AssetRentalRate[]> = {};
    rentalRates.forEach(rate => {
      if (!groups[rate.assetId]) {
        groups[rate.assetId] = [];
      }
      groups[rate.assetId].push(rate);
    });
    Object.keys(groups).forEach(assetId => {
      groups[assetId].sort((a, b) => a.duration - b.duration);
    });
    return groups;
  }, [rentalRates]);

  const resetForm = () => {
    setFormData({ assetId: '', duration: '', timeUnit: 'hrs', amount: '' });
    setEditingRate(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (rate: AssetRentalRate) => {
    setEditingRate(rate);
    setFormData({
      assetId: rate.assetId,
      duration: rate.duration.toString(),
      timeUnit: rate.timeUnit,
      amount: rate.amount || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.assetId || !formData.duration || !formData.amount) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (isDuplicateRate) {
      Alert.alert('Duplicate Rate', `A rate for ${formData.duration} ${formData.timeUnit} already exists for this asset`);
      return;
    }

    try {
      if (editingRate) {
        await updateMutation.mutateAsync({
          id: editingRate.id,
          data: {
            assetId: formData.assetId,
            duration: parseInt(formData.duration),
            timeUnit: formData.timeUnit,
            amount: formData.amount,
          },
        });
        Alert.alert('Success', 'Rental rate updated');
      } else {
        await createMutation.mutateAsync({
          assetId: formData.assetId,
          duration: parseInt(formData.duration),
          timeUnit: formData.timeUnit,
          amount: formData.amount,
        });
        Alert.alert('Success', 'Rental rate created');
      }
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save rate');
    }
  };

  const handleDelete = (rate: AssetRentalRate) => {
    Alert.alert(
      'Delete Rate',
      `Delete ${rate.duration} ${rate.timeUnit} rate for ${getAssetName(rate.assetId)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(rate.id);
              Alert.alert('Success', 'Rate deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const assetIds = Object.keys(groupedRates);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={assetIds}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No rental rates configured</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap + to add pricing for assets</Text>
          </View>
        }
        renderItem={({ item: assetId }) => (
          <View style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.assetName, { color: colors.text }]}>{getAssetName(assetId)}</Text>
            {groupedRates[assetId].map((rate) => (
              <View key={rate.id} style={[styles.rateRow, { borderBottomColor: colors.border }]}>
                <View style={styles.rateInfo}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.rateDuration, { color: colors.text }]}>
                    {rate.duration} {rate.timeUnit}
                  </Text>
                </View>
                <View style={styles.rateActions}>
                  <Text style={[styles.rateAmount, { color: colors.primary }]}>
                    {formatCurrency(Number(rate.amount))}
                  </Text>
                  <TouchableOpacity onPress={() => openEditModal(rate)} style={styles.iconButton}>
                    <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(rate)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingRate ? 'Edit Rental Rate' : 'Add Rental Rate'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Asset *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Picker
                  selectedValue={formData.assetId}
                  onValueChange={(value: string) => setFormData({ ...formData, assetId: value })}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Select Asset" value="" color={colors.textSecondary} />
                  {activeAssets.map(a => (
                    <Picker.Item key={a.id} label={`${a.name} (${a.category})`} value={a.id} color={colors.text} />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={[styles.label, { color: colors.text }]}>Duration *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    keyboardType="numeric"
                    placeholder="e.g., 4"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.label, { color: colors.text }]}>Time Unit *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={formData.timeUnit}
                      onValueChange={(value: string) => setFormData({ ...formData, timeUnit: value })}
                      style={{ color: colors.text }}
                    >
                      <Picker.Item label="Hours" value="hrs" color={colors.text} />
                      <Picker.Item label="Days" value="day" color={colors.text} />
                    </Picker>
                  </View>
                </View>
              </View>

              {isDuplicateRate && (
                <Text style={styles.errorText}>
                  A rate for {formData.duration} {formData.timeUnit} already exists for this asset.
                </Text>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Amount (Rs.) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
                placeholder="e.g., 3000"
                placeholderTextColor={colors.textSecondary}
              />

              {rateAmountWarning && (
                <Text style={styles.warningText}>{rateAmountWarning}</Text>
              )}

              {existingRatesForAsset.length > 0 && (
                <View style={[styles.existingRatesBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.existingRatesTitle, { color: colors.textSecondary }]}>
                    Existing rates for this asset:
                  </Text>
                  <Text style={[styles.existingRatesList, { color: colors.textSecondary }]}>
                    {existingRatesForAsset.map(r => `${r.duration} ${r.timeUnit} - Rs.${r.amount}`).join(', ')}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary, opacity: isDuplicateRate ? 0.5 : 1 }]}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending || isDuplicateRate}
              >
                <Text style={styles.saveButtonText}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  assetCard: {
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateDuration: {
    fontSize: 14,
  },
  rateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  iconButton: {
    padding: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  warningText: {
    color: '#d97706',
    fontSize: 13,
    marginTop: 8,
  },
  existingRatesBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  existingRatesTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  existingRatesList: {
    fontSize: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
