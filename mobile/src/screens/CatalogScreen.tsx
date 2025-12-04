import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView, TextInput, Modal, Linking, Share, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogItem, InsertCatalogItem, Configuration } from '../types';
import { useTheme } from '../contexts';
import { config as envConfig } from '../config/environment';
import AddCatalogItemModal from '../components/AddCatalogItemModal';

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

function getPackageIcon(pkg: string): { name: string; color: string } {
  switch (pkg.toLowerCase()) {
    case 'ultra':
      return { name: 'diamond', color: '#9333ea' };
    case 'premium':
      return { name: 'star', color: '#d97706' };
    case 'budget':
      return { name: 'leaf', color: '#16a34a' };
    default:
      return { name: 'pricetag', color: '#6b7280' };
  }
}

function getServiceIcon(service: string): string {
  const serviceLower = service.toLowerCase();
  if (serviceLower.includes('photo')) return 'camera';
  if (serviceLower.includes('video')) return 'videocam';
  if (serviceLower.includes('decor')) return 'flower';
  if (serviceLower.includes('cater') || serviceLower.includes('food')) return 'restaurant';
  if (serviceLower.includes('music') || serviceLower.includes('dj') || serviceLower.includes('entertain')) return 'musical-notes';
  if (serviceLower.includes('makeup') || serviceLower.includes('beauty')) return 'brush';
  if (serviceLower.includes('venue') || serviceLower.includes('hall')) return 'business';
  if (serviceLower.includes('transport') || serviceLower.includes('car')) return 'car';
  if (serviceLower.includes('invite') || serviceLower.includes('card')) return 'mail';
  if (serviceLower.includes('light')) return 'bulb';
  if (serviceLower.includes('sound') || serviceLower.includes('audio')) return 'volume-high';
  if (serviceLower.includes('anchor') || serviceLower.includes('host') || serviceLower.includes('emcee')) return 'mic';
  if (serviceLower.includes('mehendi') || serviceLower.includes('henna')) return 'hand-left';
  if (serviceLower.includes('jewel')) return 'diamond';
  if (serviceLower.includes('gift') || serviceLower.includes('favor')) return 'gift';
  if (serviceLower.includes('cake') || serviceLower.includes('sweet')) return 'ice-cream';
  if (serviceLower.includes('firework') || serviceLower.includes('pyro')) return 'sparkles';
  return 'heart';
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
  
  // Duplicate modals state
  const [duplicateItemModalVisible, setDuplicateItemModalVisible] = useState(false);
  const [duplicatingItem, setDuplicatingItem] = useState<CatalogItem | null>(null);
  const [duplicateTargetService, setDuplicateTargetService] = useState('');
  const [duplicateTargetPackage, setDuplicateTargetPackage] = useState('');
  const [showDuplicateServiceDropdown, setShowDuplicateServiceDropdown] = useState(false);
  const [showDuplicatePackageDropdown, setShowDuplicatePackageDropdown] = useState(false);
  
  // Service-level duplicate modal state
  const [duplicateServiceModalVisible, setDuplicateServiceModalVisible] = useState(false);
  const [sourceServiceForDuplicate, setSourceServiceForDuplicate] = useState('');
  const [targetServiceForDuplicate, setTargetServiceForDuplicate] = useState('');
  const [packageFilterForDuplicate, setPackageFilterForDuplicate] = useState('');
  const [showSourceServiceDropdown, setShowSourceServiceDropdown] = useState(false);
  const [showTargetServiceDropdown, setShowTargetServiceDropdown] = useState(false);
  const [showPackageFilterDropdown, setShowPackageFilterDropdown] = useState(false);

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

  const duplicateItemMutation = useMutation({
    mutationFn: (params: { id: string; overrides?: { serviceType?: string; package?: string } }) => 
      api.duplicateCatalogItem(params.id, params.overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Item duplicated successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to duplicate item: ${error.message}`);
    },
  });

  const duplicateServiceMutation = useMutation({
    mutationFn: (params: { sourceService: string; targetService: string; packageFilter?: string }) => 
      api.duplicateCatalogService(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', data.message);
      setDuplicateServiceModalVisible(false);
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to duplicate service: ${error.message}`);
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

  // Simple duplicate (same service & package)
  const handleQuickDuplicate = (item: CatalogItem) => {
    duplicateItemMutation.mutate({ id: item.id });
  };

  // Duplicate with options to change service/package
  const handleDuplicateWithOptions = (item: CatalogItem) => {
    setDuplicatingItem(item);
    setDuplicateTargetService(item.serviceType);
    setDuplicateTargetPackage(item.package);
    setDuplicateItemModalVisible(true);
  };

  const handleConfirmDuplicateItem = () => {
    if (!duplicatingItem) return;
    
    duplicateItemMutation.mutate({
      id: duplicatingItem.id,
      overrides: {
        serviceType: duplicateTargetService,
        package: duplicateTargetPackage,
      }
    });
    setDuplicateItemModalVisible(false);
    setDuplicatingItem(null);
  };

  // Open service-level duplicate modal
  const openDuplicateServiceModal = () => {
    setSourceServiceForDuplicate('');
    setTargetServiceForDuplicate('');
    setPackageFilterForDuplicate('');
    setDuplicateServiceModalVisible(true);
  };

  const handleConfirmDuplicateService = () => {
    if (!sourceServiceForDuplicate || !targetServiceForDuplicate) {
      Alert.alert('Error', 'Please select both source and target services');
      return;
    }
    if (sourceServiceForDuplicate === targetServiceForDuplicate) {
      Alert.alert('Error', 'Source and target services must be different');
      return;
    }
    
    duplicateServiceMutation.mutate({
      sourceService: sourceServiceForDuplicate,
      targetService: targetServiceForDuplicate,
      packageFilter: packageFilterForDuplicate || undefined,
    });
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
              onPress={() => handleQuickDuplicate(item)}
              style={styles.actionButton}
            >
              <Ionicons name="copy-outline" size={18} color={BRAND_MAROON} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDuplicateWithOptions(item)}
              style={styles.actionButton}
            >
              <Ionicons name="git-branch-outline" size={18} color={colors.text} />
            </TouchableOpacity>
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
              <Ionicons name="trash-outline" size={18} color={isDark ? '#f87171' : '#ef4444'} />
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
              <Ionicons name={getServiceIcon(service) as any} size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.serviceTitle}>{service}</Text>
            </View>
            
            <View style={styles.packageColumns}>
              {packages.map((pkg) => {
                const items = groupedByService[service]?.[pkg] || [];
                const pkgColors = getPackageColor(pkg, isDark);
                const pkgIcon = getPackageIcon(pkg);
                
                return (
                  <View key={pkg} style={styles.packageColumn}>
                    <View style={[styles.packageHeader, { backgroundColor: pkgColors.bg }]}>
                      <Ionicons name={pkgIcon.name as any} size={14} color={pkgColors.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.packageHeaderText, { color: pkgColors.text }]}>{pkg}</Text>
                    </View>
                    <View style={[styles.packageItems, { backgroundColor: isDark ? colors.surface : '#fafafa' }]}>
                      {items.length === 0 ? (
                        <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>No items</Text>
                      ) : (
                        items.map(item => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[styles.packageItem, { borderColor: colors.border, backgroundColor: colors.card }]}
                            onPress={() => handleEdit(item)}
                          >
                            <Text style={[styles.packageItemName, { color: colors.text }]} numberOfLines={1}>
                              {item.itemName}
                            </Text>
                            <Text style={[styles.packageItemPrice, { color: BRAND_MAROON }]}>
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
        <Ionicons name="alert-circle" size={48} color={isDark ? '#f87171' : '#ef4444'} />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load catalog</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: BRAND_MAROON }]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Section - matches Events and Expenses screens */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
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
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={openDuplicateServiceModal}>
            <Ionicons name="git-branch-outline" size={20} color={BRAND_MAROON} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openDownloadModal('share')}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openDownloadModal('download')}>
            <Ionicons name="download-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersSection}>

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
              style={[styles.clearFilterChip, { borderColor: isDark ? '#f87171' : '#ef4444' }]}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color={isDark ? '#f87171' : '#ef4444'} />
              <Text style={[styles.clearFilterText, { color: isDark ? '#f87171' : '#ef4444' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              { backgroundColor: viewMode === 'grouped' ? BRAND_MAROON : 'transparent' }
            ]}
            onPress={() => setViewMode('grouped')}
          >
            <Ionicons name="grid-outline" size={18} color={viewMode === 'grouped' ? '#fff' : colors.text} />
            <Text style={[styles.viewToggleText, { color: viewMode === 'grouped' ? '#fff' : colors.text }]}>By Service</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              { backgroundColor: viewMode === 'list' ? BRAND_MAROON : 'transparent' }
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

      {/* Duplicate Item Modal */}
      <Modal
        visible={duplicateItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDuplicateItemModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDuplicateItemModalVisible(false)}
        >
          <View style={[styles.downloadDialogContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.downloadDialogTitle, { color: colors.text }]}>
              Duplicate Item
            </Text>
            <Text style={[styles.downloadDialogSubtitle, { color: colors.textSecondary }]}>
              {duplicatingItem?.itemName}
            </Text>

            {/* Target Service */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>Target Service</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDuplicateServiceDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: duplicateTargetService ? colors.text : colors.textSecondary }]}>
                  {duplicateTargetService || 'Select Service'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Target Package */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>Target Package</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDuplicatePackageDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: duplicateTargetPackage ? colors.text : colors.textSecondary }]}>
                  {duplicateTargetPackage || 'Select Package'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.downloadDialogActions}>
              <TouchableOpacity 
                style={[styles.downloadDialogCancelButton, { borderColor: colors.border }]}
                onPress={() => setDuplicateItemModalVisible(false)}
              >
                <Text style={[styles.downloadDialogCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.downloadDialogConfirmButton, { backgroundColor: BRAND_MAROON }]}
                onPress={handleConfirmDuplicateItem}
                disabled={duplicateItemMutation.isPending}
              >
                {duplicateItemMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="copy-outline" size={18} color="#fff" />
                    <Text style={styles.downloadDialogConfirmText}>Duplicate</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Duplicate Item - Service Dropdown */}
      <Modal
        visible={showDuplicateServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicateServiceDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDuplicateServiceDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Target Service</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={styles.dropdownItem}
                onPress={() => {
                  setDuplicateTargetService(service);
                  setShowDuplicateServiceDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                {duplicateTargetService === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Duplicate Item - Package Dropdown */}
      <Modal
        visible={showDuplicatePackageDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicatePackageDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDuplicatePackageDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Target Package</Text>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg}
                style={styles.dropdownItem}
                onPress={() => {
                  setDuplicateTargetPackage(pkg);
                  setShowDuplicatePackageDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                {duplicateTargetPackage === pkg && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Duplicate Service Modal */}
      <Modal
        visible={duplicateServiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDuplicateServiceModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDuplicateServiceModalVisible(false)}
        >
          <View style={[styles.downloadDialogContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.downloadDialogTitle, { color: colors.text }]}>
              Duplicate Service Catalog
            </Text>
            <Text style={[styles.downloadDialogSubtitle, { color: colors.textSecondary }]}>
              Copy all items from one service to another
            </Text>

            {/* Source Service */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>From Service</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowSourceServiceDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: sourceServiceForDuplicate ? colors.text : colors.textSecondary }]}>
                  {sourceServiceForDuplicate || 'Select Source Service'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Target Service */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>To Service</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowTargetServiceDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: targetServiceForDuplicate ? colors.text : colors.textSecondary }]}>
                  {targetServiceForDuplicate || 'Select Target Service'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Package Filter (Optional) */}
            <View style={styles.downloadFilterGroup}>
              <Text style={[styles.downloadFilterLabel, { color: colors.text }]}>Package Filter (Optional)</Text>
              <TouchableOpacity 
                style={[styles.downloadFilterPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowPackageFilterDropdown(true)}
              >
                <Text style={[styles.downloadFilterPickerText, { color: packageFilterForDuplicate ? colors.text : colors.textSecondary }]}>
                  {packageFilterForDuplicate || 'All Packages'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.downloadDialogActions}>
              <TouchableOpacity 
                style={[styles.downloadDialogCancelButton, { borderColor: colors.border }]}
                onPress={() => setDuplicateServiceModalVisible(false)}
              >
                <Text style={[styles.downloadDialogCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.downloadDialogConfirmButton, { backgroundColor: BRAND_MAROON }]}
                onPress={handleConfirmDuplicateService}
                disabled={duplicateServiceMutation.isPending}
              >
                {duplicateServiceMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="git-branch-outline" size={18} color="#fff" />
                    <Text style={styles.downloadDialogConfirmText}>Duplicate</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Source Service Dropdown */}
      <Modal
        visible={showSourceServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourceServiceDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSourceServiceDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Source Service</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={styles.dropdownItem}
                onPress={() => {
                  setSourceServiceForDuplicate(service);
                  setShowSourceServiceDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                {sourceServiceForDuplicate === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Target Service Dropdown */}
      <Modal
        visible={showTargetServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTargetServiceDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTargetServiceDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Target Service</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service}
                style={styles.dropdownItem}
                onPress={() => {
                  setTargetServiceForDuplicate(service);
                  setShowTargetServiceDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                {targetServiceForDuplicate === service && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Package Filter Dropdown */}
      <Modal
        visible={showPackageFilterDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPackageFilterDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPackageFilterDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Package Filter</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setPackageFilterForDuplicate('');
                setShowPackageFilterDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Packages</Text>
              {!packageFilterForDuplicate && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
            </TouchableOpacity>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg}
                style={styles.dropdownItem}
                onPress={() => {
                  setPackageFilterForDuplicate(pkg);
                  setShowPackageFilterDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                {packageFilterForDuplicate === pkg && <Ionicons name="checkmark" size={20} color={BRAND_MAROON} />}
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
        catalogItem={editingItem}
      />
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
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
    fontSize: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
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
    borderBottomColor: 'rgba(128,128,128,0.2)',
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
