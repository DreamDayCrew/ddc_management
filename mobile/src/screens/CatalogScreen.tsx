import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView, TextInput, Modal, Linking, Share, Platform, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogItem, InsertCatalogItem, Configuration } from '../types';
import { useTheme } from '../contexts';
import { config as envConfig } from '../config/environment';

const BRAND_MAROON = '#800020';

function formatIndianCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs.${formatter.format(amount)}`;
}

function getPackageColor(pkg: string, isDark: boolean) {
  switch (pkg.toLowerCase()) {
    case 'ultra':
      return { bg: isDark ? '#581c87' : '#f3e8ff', text: isDark ? '#e9d5ff' : '#9333ea' };
    case 'premium':
      return { bg: isDark ? '#78350f' : '#fef3c7', text: isDark ? '#fde68a' : '#d97706' };
    case 'budget':
      return { bg: isDark ? '#166534' : '#dcfce7', text: isDark ? '#86efac' : '#16a34a' };
    default:
      return { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#9ca3af' : '#6b7280' };
  }
}

export default function CatalogScreen() {
  const { colors, isDark } = useTheme();
  
  const { data: catalogItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['catalogItems'],
    queryFn: () => api.getCatalogItems(),
  });
  
  const { data: configuration } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadServiceFilter, setDownloadServiceFilter] = useState<string>('');
  const [downloadPackageFilter, setDownloadPackageFilter] = useState<string>('');
  const [downloadAvailabilityError, setDownloadAvailabilityError] = useState<string>('');
  const [showDownloadServiceDropdown, setShowDownloadServiceDropdown] = useState(false);
  const [showDownloadPackageDropdown, setShowDownloadPackageDropdown] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'download' | 'share'>('download');

  const queryClient = useQueryClient();

  const services = configuration?.servicesProvided || [];
  const packages = configuration?.packages || ['Ultra', 'Premium', 'Budget'];

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

  const filteredItems = useMemo(() => {
    return catalogItems.filter(item => {
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesService = !selectedService || item.serviceType === selectedService;
      const matchesPackage = !selectedPackage || item.package === selectedPackage;
      return matchesSearch && matchesService && matchesPackage;
    });
  }, [catalogItems, searchQuery, selectedService, selectedPackage]);

  const groupedByService = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.serviceType]) {
        acc[item.serviceType] = {};
      }
      if (!acc[item.serviceType][item.package]) {
        acc[item.serviceType][item.package] = [];
      }
      acc[item.serviceType][item.package].push(item);
      return acc;
    }, {} as Record<string, Record<string, CatalogItem[]>>);
  }, [filteredItems]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedService('');
    setSelectedPackage('');
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Catalog item deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete item: ${error.message}`);
    },
  });

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = (item: CatalogItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.id)
        },
      ]
    );
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const openDownloadModal = (mode: 'download' | 'share') => {
    setDownloadMode(mode);
    setDownloadServiceFilter('');
    setDownloadPackageFilter('');
    setDownloadAvailabilityError('');
    setDownloadModalVisible(true);
  };

  const getFilteredDownloadItems = () => {
    return catalogItems.filter((item) => {
      const matchesService = !downloadServiceFilter || item.serviceType === downloadServiceFilter;
      const matchesPackage = !downloadPackageFilter || item.package === downloadPackageFilter;
      return matchesService && matchesPackage;
    });
  };

  const checkAvailabilityForFilters = (serviceFilter: string, packageFilter: string): string => {
    const filtered = catalogItems.filter((item) => {
      const matchesService = !serviceFilter || item.serviceType === serviceFilter;
      const matchesPackage = !packageFilter || item.package === packageFilter;
      return matchesService && matchesPackage;
    });
    
    if (filtered.length === 0) {
      const serviceText = serviceFilter ? `"${serviceFilter}"` : "selected";
      const packageText = packageFilter ? `"${packageFilter}"` : "selected";
      return `No catalog items found for ${serviceText} service and ${packageText} package. Please select different filters.`;
    }
    return '';
  };

  const checkDownloadAvailability = (): boolean => {
    const error = checkAvailabilityForFilters(downloadServiceFilter, downloadPackageFilter);
    setDownloadAvailabilityError(error);
    return error === '';
  };

  const handleDownloadServiceChange = (service: string) => {
    setDownloadServiceFilter(service);
    const error = checkAvailabilityForFilters(service, downloadPackageFilter);
    setDownloadAvailabilityError(error);
    setShowDownloadServiceDropdown(false);
  };

  const handleDownloadPackageChange = (pkg: string) => {
    setDownloadPackageFilter(pkg);
    const error = checkAvailabilityForFilters(downloadServiceFilter, pkg);
    setDownloadAvailabilityError(error);
    setShowDownloadPackageDropdown(false);
  };

  const handleDownloadPDF = async () => {
    if (!checkDownloadAvailability()) {
      return;
    }

    try {
      const params = new URLSearchParams();
      if (downloadServiceFilter) {
        params.append('serviceType', downloadServiceFilter);
      }
      if (downloadPackageFilter) {
        params.append('package', downloadPackageFilter);
      }
      
      const pdfUrl = `${envConfig.API_URL}/api/catalog/pdf${params.toString() ? '?' + params.toString() : ''}`;
      
      setDownloadModalVisible(false);
      
      if (Platform.OS === 'web') {
        window.open(pdfUrl, '_blank');
      } else {
        const supported = await Linking.canOpenURL(pdfUrl);
        if (supported) {
          await Linking.openURL(pdfUrl);
        } else {
          Alert.alert('Error', 'Cannot open PDF download link');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download catalog PDF');
    }
  };

  const handleShare = async () => {
    if (!checkDownloadAvailability()) {
      return;
    }

    try {
      const params = new URLSearchParams();
      if (downloadServiceFilter) {
        params.append('serviceType', downloadServiceFilter);
      }
      if (downloadPackageFilter) {
        params.append('package', downloadPackageFilter);
      }
      
      const pdfUrl = `${envConfig.API_URL}/api/catalog/pdf${params.toString() ? '?' + params.toString() : ''}`;
      
      setDownloadModalVisible(false);
      
      await Share.share({
        message: `Check out our service catalog: ${pdfUrl}`,
        title: 'Dream Day Crew Service Catalog',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPackageBadge = (pkg: string) => {
    const pkgColors = getPackageColor(pkg, isDark);
    return (
      <View style={[styles.packageBadge, { backgroundColor: pkgColors.bg }]}>
        <Text style={[styles.packageBadgeText, { color: pkgColors.text }]}>{pkg}</Text>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: CatalogItem }) => {
    const pkgColors = getPackageColor(item.package, isDark);
    
    return (
      <TouchableOpacity 
        style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleEdit(item)}
      >
        <View style={styles.listItemHeader}>
          <View style={styles.listItemTitleRow}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.itemName}</Text>
            <View style={[styles.packageBadge, { backgroundColor: pkgColors.bg }]}>
              <Text style={[styles.packageBadgeText, { color: pkgColors.text }]}>{item.package}</Text>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity 
              onPress={() => handleEdit(item)}
              style={styles.actionButton}
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(item)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.serviceText, { color: colors.textSecondary }]}>{item.serviceType}</Text>
        {item.description && (
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.priceText}>{formatIndianCurrency(parseFloat(item.price || '0'))}</Text>
      </TouchableOpacity>
    );
  };

  const renderGroupedView = () => {
    const serviceKeys = Object.keys(groupedByService);
    
    if (serviceKeys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No catalog items found</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: BRAND_MAROON }]}
            onPress={handleAddNew}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {serviceKeys.map(service => (
          <View key={service} style={[styles.serviceSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.serviceTitleRow, { backgroundColor: BRAND_MAROON }]}>
              <Text style={styles.serviceTitle}>{service}</Text>
            </View>
            
            <View style={styles.packageColumns}>
              {packages.map((pkg) => {
                const items = groupedByService[service]?.[pkg] || [];
                const pkgColors = getPackageColor(pkg, isDark);
                
                return (
                  <View key={pkg} style={styles.packageColumn}>
                    <View style={[styles.packageHeader, { backgroundColor: pkgColors.bg }]}>
                      <Text style={[styles.packageHeaderText, { color: pkgColors.text }]}>{pkg}</Text>
                    </View>
                    <View style={styles.packageItems}>
                      {items.length === 0 ? (
                        <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>No items</Text>
                      ) : (
                        items.map(item => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[styles.packageItem, { borderColor: colors.border }]}
                            onPress={() => handleEdit(item)}
                          >
                            <Text style={[styles.packageItemName, { color: colors.text }]} numberOfLines={1}>
                              {item.itemName}
                            </Text>
                            <Text style={styles.packageItemPrice}>
                              {formatIndianCurrency(parseFloat(item.price || '0'))}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading catalog...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load catalog</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Service Catalog</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => openDownloadModal('share')}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => openDownloadModal('download')}>
            <Ionicons name="download-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search catalog..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedService && { backgroundColor: BRAND_MAROON }
            ]}
            onPress={() => setShowServiceDropdown(true)}
          >
            <Text style={[
              styles.filterChipText, 
              { color: selectedService ? '#fff' : colors.text }
            ]}>
              {selectedService || 'All Services'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={selectedService ? '#fff' : colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedPackage && { backgroundColor: BRAND_MAROON }
            ]}
            onPress={() => setShowPackageDropdown(true)}
          >
            <Text style={[
              styles.filterChipText, 
              { color: selectedPackage ? '#fff' : colors.text }
            ]}>
              {selectedPackage || 'All Packages'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={selectedPackage ? '#fff' : colors.text} />
          </TouchableOpacity>

          {(selectedService || selectedPackage || searchQuery) && (
            <TouchableOpacity 
              style={[styles.clearFilterChip, { borderColor: '#ef4444' }]}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              viewMode === 'grouped' && { backgroundColor: BRAND_MAROON }
            ]}
            onPress={() => setViewMode('grouped')}
          >
            <Ionicons name="grid-outline" size={18} color={viewMode === 'grouped' ? '#fff' : colors.text} />
            <Text style={[styles.viewToggleText, { color: viewMode === 'grouped' ? '#fff' : colors.text }]}>By Service</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              viewMode === 'list' && { backgroundColor: BRAND_MAROON }
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#fff' : colors.text} />
            <Text style={[styles.viewToggleText, { color: viewMode === 'list' ? '#fff' : colors.text }]}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'grouped' ? (
        renderGroupedView()
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No catalog items found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: BRAND_MAROON }]} 
        onPress={handleAddNew}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServiceDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowServiceDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Service</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedService('');
                setShowServiceDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Services</Text>
              {!selectedService && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
            </TouchableOpacity>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedService(service);
                  setShowServiceDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                {selectedService === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPackageDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPackageDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPackageDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Package</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedPackage('');
                setShowPackageDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Packages</Text>
              {!selectedPackage && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
            </TouchableOpacity>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedPackage(pkg);
                  setShowPackageDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                {selectedPackage === pkg && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Download/Share Modal */}
      <Modal
        visible={downloadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDownloadModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDownloadModalVisible(false)}
        >
          <View style={[styles.downloadDialogContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.downloadDialogTitle, { color: colors.text }]}>
              {downloadMode === 'download' ? 'Download Catalog PDF' : 'Share Catalog'}
            </Text>
            <Text style={[styles.downloadDialogSubtitle, { color: colors.textSecondary }]}>
              Select which services and packages to include
            </Text>

            {/* Service Filter */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>Service Type</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDownloadServiceDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: downloadServiceFilter ? colors.text : colors.textSecondary }]}>
                  {downloadServiceFilter || 'All Services'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Package Filter */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>Package Tier</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDownloadPackageDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: downloadPackageFilter ? colors.text : colors.textSecondary }]}>
                  {downloadPackageFilter || 'All Packages'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Availability Error */}
            {downloadAvailabilityError !== '' && (
              <View style={styles.downloadErrorContainer}>
                <Text style={styles.downloadErrorText}>{downloadAvailabilityError}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.downloadDialogActions}>
              <TouchableOpacity 
                style={[styles.downloadDialogCancelButton, { borderColor: colors.border }]}
                onPress={() => setDownloadModalVisible(false)}
              >
                <Text style={[styles.downloadDialogCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.downloadDialogConfirmButton, { backgroundColor: BRAND_MAROON }]}
                onPress={downloadMode === 'download' ? handleDownloadPDF : handleShare}
              >
                <Ionicons 
                  name={downloadMode === 'download' ? 'download-outline' : 'share-outline'} 
                  size={18} 
                  color="#fff" 
                />
                <Text style={styles.downloadDialogConfirmText}>
                  {downloadMode === 'download' ? 'Download' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Download Service Dropdown Modal */}
      <Modal
        visible={showDownloadServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadServiceDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDownloadServiceDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Service</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleDownloadServiceChange('')}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Services</Text>
              {!downloadServiceFilter && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
            </TouchableOpacity>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={styles.dropdownItem}
                onPress={() => handleDownloadServiceChange(service)}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                {downloadServiceFilter === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Download Package Dropdown Modal */}
      <Modal
        visible={showDownloadPackageDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadPackageDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDownloadPackageDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Package</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleDownloadPackageChange('')}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Packages</Text>
              {!downloadPackageFilter && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
            </TouchableOpacity>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg}
                style={styles.dropdownItem}
                onPress={() => handleDownloadPackageChange(pkg)}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                {downloadPackageFilter === pkg && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <AddCatalogItemModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        services={services}
        packages={packages}
      />
    </View>
  );
}

interface AddCatalogItemModalProps {
  visible: boolean;
  onClose: () => void;
  editingItem: CatalogItem | null;
  services: string[];
  packages: string[];
}

function AddCatalogItemModal({ visible, onClose, editingItem, services, packages }: AddCatalogItemModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  
  const [serviceType, setServiceType] = useState('');
  const [packageName, setPackageName] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showPackagePicker, setShowPackagePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (editingItem) {
        setServiceType(editingItem.serviceType);
        setPackageName(editingItem.package);
        setItemName(editingItem.itemName);
        setDescription(editingItem.description || '');
        setPrice(editingItem.price || '0');
      } else {
        setServiceType('');
        setPackageName('');
        setItemName('');
        setDescription('');
        setPrice('');
      }
    }, [editingItem])
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertCatalogItem) => api.createCatalogItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Catalog item created successfully');
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to create item: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCatalogItem> }) => 
      api.updateCatalogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Catalog item updated successfully');
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to update item: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!serviceType || !packageName || !itemName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data: InsertCatalogItem = {
      serviceType,
      package: packageName,
      itemName,
      description: description || null,
      price: price || '0',
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleBackPress = () => {
    if (showServicePicker) {
      setShowServicePicker(false);
    } else if (showPackagePicker) {
      setShowPackagePicker(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleBackPress}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingItem ? 'Edit Catalog Item' : 'Add Catalog Item'}
          </Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Service Type *</Text>
            <TouchableOpacity 
              style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowServicePicker(true)}
            >
              <Text style={[styles.pickerText, { color: serviceType ? colors.text : colors.textSecondary }]}>
                {serviceType || 'Select a service'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Package *</Text>
            <TouchableOpacity 
              style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowPackagePicker(true)}
            >
              <Text style={[styles.pickerText, { color: packageName ? colors.text : colors.textSecondary }]}>
                {packageName || 'Select a package'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter item name"
              placeholderTextColor={colors.textSecondary}
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Price</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter price"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <Modal
          visible={showServicePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowServicePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowServicePicker(false)}
          >
            <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Service</Text>
              <ScrollView style={styles.dropdownScroll}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setServiceType(service);
                      setShowServicePicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                    {serviceType === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showPackagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPackagePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPackagePicker(false)}
          >
            <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Package</Text>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPackageName(pkg);
                    setShowPackagePicker(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                  {packageName === pkg && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      </KeyboardAvoidingView>
    </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: BRAND_MAROON,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 14,
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  clearFilterText: {
    color: '#ef4444',
    fontSize: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  listItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceText: {
    fontSize: 14,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_MAROON,
  },
  packageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  serviceSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  serviceTitleRow: {
    padding: 10,
  },
  serviceTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  packageColumns: {
    flexDirection: 'row',
  },
  packageColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  packageHeader: {
    padding: 8,
    alignItems: 'center',
  },
  packageHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  packageItems: {
    padding: 8,
    minHeight: 60,
  },
  packageItem: {
    padding: 6,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  packageItemName: {
    fontSize: 12,
    fontWeight: '500',
  },
  packageItemPrice: {
    fontSize: 11,
    color: BRAND_MAROON,
    fontWeight: '600',
    marginTop: 2,
  },
  noItemsText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: BRAND_MAROON,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
  },
  downloadDialogContainer: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
  },
  downloadDialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  downloadDialogSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  downloadFilterGroup: {
    marginBottom: 16,
  },
  downloadFilterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  downloadFilterPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  downloadFilterPickerText: {
    fontSize: 16,
  },
  downloadErrorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  downloadErrorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  downloadDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  downloadDialogCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  downloadDialogCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  downloadDialogConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  downloadDialogConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
