import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView, TextInput, Modal, Linking, Share, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogItem, InsertCatalogItem, Configuration } from '../types';
import { useTheme } from '../contexts';
import { config as envConfig } from '../config/environment';
import AddCatalogModal from '../components/AddCatalogModal';

const BRAND_MAROON = '#800020';
const BRAND_GOLD = '#D4AF37';
const PREMIUM_DARK = '#1a1a2e';
const SUCCESS_GREEN = '#00b894';
const WARNING_ORANGE = '#fdcb6e';
const DANGER_RED = '#e17055';
const NEUTRAL_GRAY = '#636e72';
const LIGHT_GRAY = '#f8f9fa';

function formatIndianCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatter.format(amount)}`;
}

function getPackageColor(pkg: string, isDark: boolean) {
  switch (pkg.toLowerCase()) {
    case 'ultra':
      return { 
        bg: isDark ? 'rgba(147, 51, 234, 0.25)' : 'rgba(147, 51, 234, 0.1)',
        text: isDark ? '#c084fc' : '#9333ea',
        border: isDark ? '#9333ea' : '#e9d5ff',
        gradient: ['#9333ea', '#7c3aed']
      };
    case 'premium':
      return { 
        bg: isDark ? 'rgba(20, 184, 166, 0.25)' : 'rgba(20, 184, 166, 0.1)',
        text: isDark ? '#5eead4' : '#0d9488',
        border: isDark ? '#14b8a6' : '#a7f3d0',
        gradient: ['#14b8a6', '#0d9488']
      };
    case 'budget':
      return { 
        bg: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.1)',
        text: isDark ? '#4ade80' : '#16a34a',
        border: isDark ? '#22c55e' : '#bbf7d0',
        gradient: ['#22c55e', '#16a34a']
      };
    default:
      return { 
        bg: isDark ? 'rgba(120, 113, 108, 0.25)' : 'rgba(120, 113, 108, 0.1)',
        text: isDark ? '#a8a29e' : '#78716c',
        border: isDark ? '#78716c' : '#e7e5e4',
        gradient: ['#78716c', '#57534e']
      };
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
  const [showDownloadServiceDropdown, setShowDownloadServiceDropdown] = useState(false);
  const [showDownloadPackageDropdown, setShowDownloadPackageDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [showDownloadFilter, setShowDownloadFilter] = useState(false);
  const [downloadAction, setDownloadAction] = useState<'share' | 'download'>('download');
  const [downloadFilters, setDownloadFilters] = useState({
    service: '',
    package: ''
  });
  const [downloadValidationError, setDownloadValidationError] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

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
    setItemToDelete(item);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const showDownloadFilterModal = (action: 'share' | 'download') => {
    // Close any existing dropdowns
    setShowServiceDropdown(false);
    setShowPackageDropdown(false);
    setShowDownloadServiceDropdown(false);
    setShowDownloadPackageDropdown(false);
    
    setDownloadAction(action);
    setDownloadFilters({ service: '', package: '' });
    setDownloadValidationError('');
    setShowDownloadFilter(true);
  };

  const processFilteredAction = async () => {
    const { service, package: pkg } = downloadFilters;
    
    console.log('Processing filtered action - Service:', service, 'Package:', pkg);
    console.log('Download filters object:', downloadFilters);
    
    // Clear previous validation error
    setDownloadValidationError('');
    
    // Validate if data exists for the selected filters
    const filteredData = catalogItems.filter(item => {
      const matchesService = !service || item.serviceType === service;
      const matchesPackage = !pkg || item.package === pkg;
      return matchesService && matchesPackage;
    });
    
    console.log('Filtered data count:', filteredData.length);
    
    if (filteredData.length === 0) {
      const errorMessage = `No catalog items found for ${service ? `service "${service}"` : 'all services'}${service && pkg ? ' and ' : ''}${pkg ? `package "${pkg}"` : pkg === '' && service ? '' : 'all packages'}.`;
      setDownloadValidationError(errorMessage);
      return;
    }
    
    setShowDownloadFilter(false);
    
    if (downloadAction === 'share') {
      await handleShare(service, pkg);
    } else {
      await handleDownloadPDF(service, pkg);
    }
  };

  const handleDownloadPDF = async (service?: string, packageType?: string) => {
    try {
      console.log('Download PDF - Service:', service, 'Package:', packageType);
      
      let pdfUrl = `${envConfig.API_URL}/api/catalog/pdf`;
      const params = new URLSearchParams();
      
      if (service && service.trim() !== '') {
        params.append('service', service.trim());
      }
      if (packageType && packageType.trim() !== '') {
        params.append('package', packageType.trim());
      }
      
      if (params.toString()) {
        pdfUrl += `?${params.toString()}`;
      }
      
      console.log('Final PDF URL:', pdfUrl);
      
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
      console.error('Download PDF error:', error);
      Alert.alert('Error', 'Failed to download catalog PDF');
    }
  };

  const handleShare = async (service?: string, packageType?: string) => {
    try {
      console.log('Share - Service:', service, 'Package:', packageType);
      
      let pdfUrl = `${envConfig.API_URL}/api/catalog/pdf`;
      const params = new URLSearchParams();
      
      if (service && service.trim() !== '') {
        params.append('service', service.trim());
      }
      if (packageType && packageType.trim() !== '') {
        params.append('package', packageType.trim());
      }
      
      if (params.toString()) {
        pdfUrl += `?${params.toString()}`;
      }
      
      console.log('Final Share URL:', pdfUrl);
      
      const title = service || packageType ? 
        `Dream Day Crew - ${service ? service + ' ' : ''}${packageType ? packageType + ' ' : ''}Catalog` :
        'Dream Day Crew Service Catalog';
      
      await Share.share({
        message: `Check out our service catalog: ${pdfUrl}`,
        title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderPackageBadge = (pkg: string) => {
    const pkgColors = getPackageColor(pkg, isDark);
    return (
      <View style={[styles.packageBadge, { 
        backgroundColor: pkgColors.bg,
        borderColor: pkgColors.border,
        borderWidth: 1
      }]}>
        <View style={[styles.packageBadgeGlow, { backgroundColor: pkgColors.text, opacity: 0.3 }]} />
        <Text style={[styles.packageBadgeText, { color: pkgColors.text }]}>{pkg}</Text>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: CatalogItem }) => {
    const pkgColors = getPackageColor(item.package, isDark);
    
    return (
      <View 
        style={[styles.listItem, { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
        }]}
      >
        <View style={[styles.listItemGradient, { 
          backgroundColor: `${pkgColors.text}10`,
          borderLeftColor: pkgColors.text,
          borderLeftWidth: 4
        }]}>
          <View style={styles.listItemHeader}>
            <TouchableOpacity 
              style={styles.listItemTitleRow}
              onPress={() => handleEdit(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.itemName}</Text>
            </TouchableOpacity>
            <View style={styles.listItemBadgeActions}>
              <View style={[styles.packageBadge, { 
                backgroundColor: pkgColors.bg,
                borderColor: pkgColors.border,
                borderWidth: 1
              }]}>
                <Text style={[styles.packageBadgeText, { color: pkgColors.text }]}>{item.package}</Text>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  style={[styles.listActionButton, { backgroundColor: colors.textSecondary + '30' }]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  style={[styles.listActionButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)'  }]}
                >
                  <Ionicons name="trash-outline" size={18} color={DANGER_RED} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.serviceTypeContainer}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>{item.serviceType}</Text>
          </View>
          {item.description && (
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: pkgColors.text }]}>
              {formatIndianCurrency(parseFloat(item.price || '0'))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGroupedView = () => {
    const serviceKeys = Object.keys(groupedByService);
    
    if (serviceKeys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.textSecondary + '30' }]}>
            <Ionicons name="book-outline" size={48} color={colors.text} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>No catalog items found</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Start building your service catalog
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON  }]}
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
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {serviceKeys.map(service => (
          <View key={service} style={[styles.serviceSection, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 16,
            elevation: 8,
          }]}>
            <View style={[styles.serviceTitleRow, { 
              backgroundColor: isDark ? '#374151' : BRAND_MAROON,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }]}>
              <View style={styles.serviceTitleContainer}>
                <Ionicons name="briefcase" size={20} color="#fff" style={styles.serviceTitleIcon} />
                <Text style={styles.serviceTitle}>{service}</Text>
              </View>
            </View>
            
            <View style={styles.packageColumns}>
              {packages.map((pkg) => {
                const items = groupedByService[service]?.[pkg] || [];
                const pkgColors = getPackageColor(pkg, isDark);
                
                return (
                  <View key={pkg} style={styles.packageColumn}>
                    <View style={[styles.packageHeader, { 
                      backgroundColor: pkgColors.bg,
                      borderColor: pkgColors.border,
                      borderWidth: 1,
                      borderBottomWidth: 0,
                    }]}>
                      <Text style={[styles.packageHeaderText, { color: pkgColors.text }]}>{pkg}</Text>
                      <View style={[styles.packageHeaderIcon, { backgroundColor: pkgColors.text }]}>
                        <Ionicons 
                          name={pkg.toLowerCase() === 'ultra' ? 'diamond' : pkg.toLowerCase() === 'premium' ? 'star' : 'heart'} 
                          size={12} 
                          color="#fff" 
                        />
                      </View>
                    </View>
                    <View style={[styles.packageItems, { backgroundColor: `${pkgColors.text}05` }]}>
                      {items.length === 0 ? (
                        <View style={styles.noItemsContainer}>
                          <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                          <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>No items</Text>
                        </View>
                      ) : (
                        items.map(item => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[styles.packageItem, { 
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                              shadowColor: isDark ? '#000' : '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isDark ? 0.3 : 0.08,
                              shadowRadius: 8,
                              elevation: 3,
                            }]}
                            onPress={() => handleEdit(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.packageItemName, { color: colors.text }]} numberOfLines={1}>
                              {item.itemName}
                            </Text>
                            <Text style={[styles.packageItemPrice, { color: pkgColors.text }]}>
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
        <View style={[styles.loadingSpinner, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading catalog...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error || DANGER_RED} />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load catalog</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON }]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        <View style={[styles.filtersSection, { backgroundColor: colors.background }]}>
          <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search catalog..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionIconButton, { backgroundColor: colors.background }]} 
              onPress={() => showDownloadFilterModal('share')}
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionIconButton, { backgroundColor: colors.background }]} 
              onPress={() => showDownloadFilterModal('download')}
            >
              <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedService && { backgroundColor: isDark ? '#374151' : BRAND_MAROON, borderColor: isDark ? '#374151' : BRAND_MAROON }
              ]}
              onPress={() => setShowServiceDropdown(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="briefcase-outline" size={16} color={selectedService ? '#fff' : colors.text} />
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
                selectedPackage && { backgroundColor: isDark ? '#374151' : BRAND_MAROON, borderColor: isDark ? '#374151' : BRAND_MAROON }
              ]}
              onPress={() => setShowPackageDropdown(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pricetag-outline" size={16} color={selectedPackage ? '#fff' : colors.text} />
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
                style={[styles.clearFilterChip, { borderColor: DANGER_RED, backgroundColor: `${DANGER_RED}15` }]}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={16} color={DANGER_RED} />
                <Text style={[styles.clearFilterText, { color: DANGER_RED }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton, 
                viewMode === 'grouped' && { backgroundColor: isDark ? '#374151' : BRAND_MAROON }
              ]}
              onPress={() => setViewMode('grouped')}
              activeOpacity={0.8}
            >
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grouped' ? '#fff' : colors.text} />
              <Text style={[styles.viewToggleText, { color: viewMode === 'grouped' ? '#fff' : colors.text }]}>By Service</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton, 
                viewMode === 'list' && { backgroundColor: isDark ? '#374151' : BRAND_MAROON }
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
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
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.textSecondary + '30' }]}>
                  <Ionicons name="book-outline" size={48} color={colors.text} />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>No catalog items found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Start building your service catalog
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON }]} 
          onPress={handleAddNew}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

      <Modal
        visible={showServiceDropdown && !showDownloadFilter}
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
              {!selectedService && <Ionicons name="checkmark" size={20} color={colors.text} />}
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
                {selectedService === service && <Ionicons name="checkmark" size={20} color={colors.text} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPackageDropdown && !showDownloadFilter}
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
              {!selectedPackage && <Ionicons name="checkmark" size={20} color={colors.text} />}
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
                {selectedPackage === pkg && <Ionicons name="checkmark" size={20} color={colors.text} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <AddCatalogModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        services={services}
        packages={packages}
      />

      {/* Download Filter Modal */}
      <Modal
        visible={showDownloadFilter}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDownloadFilter(false);
          setShowDownloadServiceDropdown(false);
          setShowDownloadPackageDropdown(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.downloadFilterModal, { backgroundColor: colors.card }]}>
            <View style={[styles.downloadFilterHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.downloadFilterTitle, { color: colors.text }]}>
                {downloadAction === 'share' ? 'Share Catalog' : 'Download Catalog'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowDownloadFilter(false);
                  setShowDownloadServiceDropdown(false);
                  setShowDownloadPackageDropdown(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.downloadFilterContent}>
              <Text style={[styles.downloadFilterSubtext, { color: colors.textSecondary }]}>
                Select service and package to filter the catalog
              </Text>
              
              {/* Service Selection */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Service Type</Text>
                <TouchableOpacity 
                  style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDownloadServiceDropdown(true)}
                >
                  <Text style={[styles.filterDropdownText, { color: downloadFilters.service ? colors.text : colors.textSecondary }]}>
                    {downloadFilters.service || 'All Services'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Package Selection */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Package Type</Text>
                <TouchableOpacity 
                  style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDownloadPackageDropdown(true)}
                >
                  <Text style={[styles.filterDropdownText, { color: downloadFilters.package ? colors.text : colors.textSecondary }]}>
                    {downloadFilters.package || 'All Packages'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Validation Error Message */}
              {downloadValidationError ? (
                <View style={[styles.validationErrorContainer, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  <Text style={[styles.validationErrorText, { color: '#dc2626' }]}>
                    {downloadValidationError}
                  </Text>
                </View>
              ) : null}
            </View>
            
            <View style={[styles.downloadFilterFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.downloadFilterButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowDownloadFilter(false);
                  setShowDownloadServiceDropdown(false);
                  setShowDownloadPackageDropdown(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.downloadFilterButton, styles.modalActionButton, { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON }]}
                onPress={processFilteredAction}
              >
                <Ionicons 
                  name={downloadAction === 'share' ? 'share' : 'download'} 
                  size={18} 
                  color="#fff" 
                />
                <Text style={styles.actionButtonText}>
                  {downloadAction === 'share' ? 'Share' : 'Download'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download Filter Service Dropdown */}
      <Modal
        visible={showDownloadServiceDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadServiceDropdown(false)}
      >
        <View style={[styles.modalOverlay, { zIndex: 1000 }]}>
          <TouchableOpacity 
            style={[styles.modalOverlay, { zIndex: 1000 }]}
            activeOpacity={1}
            onPress={() => setShowDownloadServiceDropdown(false)}
          >
            <View style={[styles.dropdownContainer, { backgroundColor: colors.card, zIndex: 1001 }]}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Service</Text>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDownloadFilters(prev => ({ ...prev, service: '' }));
                  setShowDownloadServiceDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Services</Text>
                {!downloadFilters.service && <Ionicons name="checkmark" size={20} color={colors.text} />}
              </TouchableOpacity>
              {services.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDownloadFilters(prev => ({ ...prev, service }));
                    setDownloadValidationError('');
                    setShowDownloadServiceDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>{service}</Text>
                  {downloadFilters.service === service && <Ionicons name="checkmark" size={20} color={colors.text} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Download Filter Package Dropdown */}
      <Modal
        visible={showDownloadPackageDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadPackageDropdown(false)}
      >
        <View style={[styles.modalOverlay, { zIndex: 1000 }]}>
          <TouchableOpacity 
            style={[styles.modalOverlay, { zIndex: 1000 }]}
            activeOpacity={1}
            onPress={() => setShowDownloadPackageDropdown(false)}
          >
            <View style={[styles.dropdownContainer, { backgroundColor: colors.card, zIndex: 1001 }]}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Package</Text>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDownloadFilters(prev => ({ ...prev, package: '' }));
                  setShowDownloadPackageDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Packages</Text>
                {!downloadFilters.package && <Ionicons name="checkmark" size={20} color={colors.text} />}
              </TouchableOpacity>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDownloadFilters(prev => ({ ...prev, package: pkg }));
                    setDownloadValidationError('');
                    setShowDownloadPackageDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>{pkg}</Text>
                  {downloadFilters.package === pkg && <Ionicons name="checkmark" size={20} color={colors.text} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteConfirmModal, { backgroundColor: colors.card }]}>
            <View style={styles.deleteConfirmHeader}>
              <Ionicons name="alert-circle" size={32} color={colors.error || DANGER_RED} />
              <Text style={[styles.deleteConfirmTitle, { color: colors.text }]}>Delete Item</Text>
            </View>
            <Text style={[styles.deleteConfirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete "{itemToDelete?.itemName}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteConfirmActions}>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, styles.cancelDeleteButton, { borderColor: colors.border }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelDeleteText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, styles.confirmDeleteButton, { backgroundColor: colors.error || DANGER_RED }]}
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
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
    padding: 20,
  },
  loadingSpinner: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 12,
    borderRadius: 12,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
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
  actionIconButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listItem: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listItemGradient: {
    padding: 20,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listItemTitleRow: {
    flex: 1,
    marginRight: 16,
  },
  listItemBadgeActions: {
    alignItems: 'flex-end',
    gap: 12,
    minWidth: 120,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  listActionButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  packageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  packageBadgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  serviceSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  serviceTitleRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceTitleIcon: {
    marginRight: 12,
  },
  serviceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
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
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  packageHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packageHeaderIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageItems: {
    padding: 12,
    minHeight: 100,
    gap: 8,
  },
  packageItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  packageItemName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  packageItemPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noItemsText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    minHeight: 50,
  },
  dropdownItemText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    flexWrap: 'wrap',
  },
  downloadFilterModal: {
    marginHorizontal: 16,
    marginVertical: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 420,
    maxHeight: '85%',
    width: '90%',
    alignSelf: 'center',
  },
  downloadFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  downloadFilterTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  downloadFilterContent: {
    padding: 24,
    flex: 1,
  },
  downloadFilterSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
  },
  filterDropdownText: {
    fontSize: 16,
  },
  downloadFilterFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  downloadFilterButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  validationErrorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmModal: {
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteConfirmHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  deleteConfirmMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteButton: {
    borderWidth: 1,
  },
  confirmDeleteButton: {
    // backgroundColor set dynamically
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
