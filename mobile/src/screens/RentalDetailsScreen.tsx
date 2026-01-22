import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { config as envConfig } from '../config/environment';
import type { Rental, RentalItem, Asset, AssetRentalRate, Configuration } from '../types';
import { useTheme } from '../contexts';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '../components/DatePicker';

const BRAND_MAROON = '#800020';

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface RentalItemFormData {
  id?: string;
  assetId: string;
  quantity: number;
  duration: number;
  timeUnit: string;
  ratePerUnit: string;
  totalAmount: string;
  calculatePerQuantity: boolean;
}

export default function RentalDetailsScreen({ navigation, route }: any) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const rentalId = route.params?.id;
  const isNew = !rentalId;
  
  const accentColor = isDark ? '#4a5568' : BRAND_MAROON;

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    rentalDate: new Date(),
    returnDate: new Date(),
    status: 'Inquired',
    paymentStatus: 'Pending',
    paymentMode: '',
    notes: '',
    discount: false,
    discountAmount: '0',
  });

  const [items, setItems] = useState<RentalItemFormData[]>([]);
  const [newItem, setNewItem] = useState<RentalItemFormData>({
    assetId: '',
    quantity: 1,
    duration: 1,
    timeUnit: 'hrs',
    ratePerUnit: '0',
    totalAmount: '0',
    calculatePerQuantity: true,
  });

  const [showAddRateDialog, setShowAddRateDialog] = useState(false);
  const [newRateForm, setNewRateForm] = useState({
    duration: 1,
    timeUnit: 'hrs',
    amount: '',
  });

  // Dropdown states
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showRateDropdown, setShowRateDropdown] = useState(false);
  const [showTimeUnitDropdown, setShowTimeUnitDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);
  
  // Expense linking states
  const [showExpenseLinkModal, setShowExpenseLinkModal] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState('');
  const [expenseFormData, setExpenseFormData] = useState({
    amount: '',
    date: new Date(),
  });
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);

  const getExpenseIndicator = (paymentStatus: 'Paid' | 'Partial' | 'Pending' | string) => {
    switch (paymentStatus) {
      case 'Paid':
        return {
          icon: 'checkmark-done-circle-sharp',
          color: '#16a34a',
        };
      case 'Partial':
        return {
          icon: 'checkmark-circle',
          color: '#eab308',
        };
      default:
        return null;
    }
  };

  const { data: rental, isLoading: rentalLoading } = useQuery({
    queryKey: ['rental', rentalId],
    queryFn: () => api.getRental(rentalId),
    enabled: !!rentalId,
  });

  const { data: rentalItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['rental-items', rentalId],
    queryFn: () => api.getRentalItems(rentalId),
    enabled: !!rentalId,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  const { data: rentalRates = [] } = useQuery({
    queryKey: ['rental-rates'],
    queryFn: () => api.getRentalRates(),
  });

  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  // Fetch linked expense for rental
  const { data: rentalLinkedExpense } = useQuery({
    queryKey: ['/api/expenses/by-rental', rentalId],
    queryFn: async () => {
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-rental/${rentalId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!rentalId,
  });

  useEffect(() => {
    if (rental) {
      setFormData({
        customerName: rental.customerName || '',
        customerPhone: rental.customerPhone || '',
        customerEmail: rental.customerEmail || '',
        customerAddress: rental.customerAddress || '',
        rentalDate: rental.rentalDate ? parseISO(rental.rentalDate) : new Date(),
        returnDate: rental.returnDate ? parseISO(rental.returnDate) : new Date(),
        status: rental.status || 'Inquired',
        paymentStatus: rental.paymentStatus || 'Pending',
        paymentMode: rental.paymentMode || '',
        notes: rental.notes || '',
        discount: rental.discount === 'true',
        discountAmount: rental.discountAmount || '0',
      });
    }
  }, [rental]);

  useEffect(() => {
    if (rentalItems.length > 0) {
      setItems(rentalItems.map(item => ({
        id: item.id,
        assetId: item.assetId,
        quantity: item.quantity,
        duration: item.duration,
        timeUnit: item.timeUnit,
        ratePerUnit: item.ratePerUnit || '0',
        totalAmount: item.totalAmount || '0',
        calculatePerQuantity: true,
      })));
    }
  }, [rentalItems]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const rental = await api.createRental(data);
      for (const item of items) {
        const { calculatePerQuantity: _, ...itemData } = item;
        await api.createRentalItem({
          rentalId: rental.id,
          ...itemData,
        });
      }
      return rental;
    },
    onSuccess: (rental) => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      Alert.alert('Success', 'Service order created successfully');
      navigation.replace('RentalDetails', { id: rental.id });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateRental(rentalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['rental', rentalId] });
      Alert.alert('Success', 'Service order updated successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => api.createRentalItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-items', rentalId] });
      Alert.alert('Success', 'Item added successfully');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteRentalItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-items', rentalId] });
      Alert.alert('Success', 'Item removed');
    },
  });

  const createRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.createRentalRate(data);
      return response;
    },
    onSuccess: async (newRate) => {
      await queryClient.invalidateQueries({ queryKey: ['rental-rates'] });
      const total = calculateItemTotal(newItem.quantity, newRate.amount, newItem.calculatePerQuantity);
      setNewItem({
        ...newItem,
        duration: newRate.duration,
        timeUnit: newRate.timeUnit,
        ratePerUnit: newRate.amount,
        totalAmount: total,
      });
      setShowAddRateDialog(false);
      setNewRateForm({ duration: 1, timeUnit: 'hrs', amount: '' });
      Alert.alert('Success', 'Rental rate added successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-rental', rentalId] });
      setShowExpenseLinkModal(false);
      setIsCreatingExpense(false);
      Alert.alert('Success', 'Expense linked successfully');
    },
    onError: (error: Error) => {
      setIsCreatingExpense(false);
      Alert.alert('Error', 'Failed to link expense: ' + error.message);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => api.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-rental', rentalId] });
      Alert.alert('Success', 'Linked expense deleted and account balance reverted');
    },
    onError: (error: Error) => {
      Alert.alert('Error', 'Failed to delete expense: ' + error.message);
    },
  });

  const activeAssets = assets.filter(a => a.status === 'Active');

  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getRatesForAsset = (assetId: string) => {
    return rentalRates.filter(r => r.assetId === assetId);
  };

  const getAssetQuantity = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.quantity || 1;
  };

  const calculateItemTotal = (quantity: number, rate: string, calculatePerQuantity: boolean) => {
    if (calculatePerQuantity) {
      return (quantity * Number(rate)).toString();
    }
    return rate;
  };

  const handleAssetSelect = (assetId: string) => {
    const rates = getRatesForAsset(assetId);
    if (rates.length > 0) {
      const firstRate = rates[0];
      const total = calculateItemTotal(1, firstRate.amount, true);
      setNewItem({
        assetId,
        quantity: 1,
        duration: firstRate.duration,
        timeUnit: firstRate.timeUnit,
        ratePerUnit: firstRate.amount,
        totalAmount: total,
        calculatePerQuantity: true,
      });
    } else {
      setNewItem({
        ...newItem,
        assetId,
        ratePerUnit: '0',
        totalAmount: '0',
      });
    }
    setShowAssetDropdown(false);
  };

  const handleRateSelect = (rateId: string) => {
    if (rateId === 'add-new-rate') {
      setShowAddRateDialog(true);
      setShowRateDropdown(false);
      return;
    }
    const rate = rentalRates.find(r => r.id === rateId);
    if (rate) {
      const total = calculateItemTotal(newItem.quantity, rate.amount, newItem.calculatePerQuantity);
      setNewItem({
        ...newItem,
        duration: rate.duration,
        timeUnit: rate.timeUnit,
        ratePerUnit: rate.amount,
        totalAmount: total,
      });
    }
    setShowRateDropdown(false);
  };

  const handleQuantityChange = (quantity: number) => {
    const maxQty = getAssetQuantity(newItem.assetId);
    const validQty = Math.min(Math.max(1, quantity), maxQty);
    const total = calculateItemTotal(validQty, newItem.ratePerUnit, newItem.calculatePerQuantity);
    setNewItem({
      ...newItem,
      quantity: validQty,
      totalAmount: total,
    });
  };

  const handleCalculatePerQuantityChange = (checked: boolean) => {
    const total = calculateItemTotal(newItem.quantity, newItem.ratePerUnit, checked);
    setNewItem({
      ...newItem,
      calculatePerQuantity: checked,
      totalAmount: total,
    });
  };

  const handleAddRate = () => {
    if (!newItem.assetId) {
      Alert.alert('Error', 'Please select an asset first');
      return;
    }
    if (!newRateForm.amount || Number(newRateForm.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Check for duplicate rate
    const existingRates = getRatesForAsset(newItem.assetId);
    const isDuplicateRate = existingRates.some(
      r => r.duration === newRateForm.duration && r.timeUnit === newRateForm.timeUnit
    );
    
    if (isDuplicateRate) {
      Alert.alert('Error', `A rate for ${newRateForm.duration} ${newRateForm.timeUnit} already exists for this asset`);
      return;
    }
    
    createRateMutation.mutate({
      assetId: newItem.assetId,
      duration: newRateForm.duration,
      timeUnit: newRateForm.timeUnit,
      amount: newRateForm.amount,
    });
  };

  const addItem = async () => {
    if (!newItem.assetId) {
      Alert.alert('Error', 'Please select an asset');
      return;
    }

    const isDuplicateItem = items.some(
      item => item.assetId === newItem.assetId && 
              item.duration === newItem.duration && 
              item.timeUnit === newItem.timeUnit
    );

    if (isDuplicateItem) {
      Alert.alert('Error', 'This asset with the same duration is already added. Please edit the existing item or choose a different duration.');
      return;
    }

    if (isNew) {
      setItems([...items, { ...newItem }]);
    } else {
      const { calculatePerQuantity: _, ...itemData } = newItem;
      await createItemMutation.mutateAsync({
        rentalId,
        ...itemData,
      });
    }

    setNewItem({
      assetId: '',
      quantity: 1,
      duration: 1,
      timeUnit: 'hrs',
      ratePerUnit: '0',
      totalAmount: '0',
      calculatePerQuantity: true,
    });
  };

  const removeItem = async (index: number) => {
    if (isNew) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      const item = items[index];
      if (item.id) {
        await deleteItemMutation.mutateAsync(item.id);
        setItems(items.filter((_, i) => i !== index));
      }
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  }, [items]);

  const discountValue = formData.discount ? Number(formData.discountAmount || 0) : 0;
  const total = subtotal - discountValue;

  // Create expense and link to rental
  const createExpenseForRental = async (amount: string, status: string, dateStr?: string) => {
    if (!rentalId) {
      Alert.alert('Error', 'Cannot create expense: rental ID is required');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    setIsCreatingExpense(true);
    try {
      const expenseData = {
        type: 'Credit',
        category: 'Rental Service',
        from_account: 'Client Payment',
        to_account: 'DDC Fund',
        description: `Payment received for Service Order - ${formData.customerName}`,
        amount: String(paymentAmount),
        date: dateStr ? new Date(dateStr) : new Date(),
        status: 'Paid',
        rentalId: rentalId, // Link to rental via rentalId field
        contributor: [],
        contribution: [],
        contribution_status: [],
      };

      await createExpenseMutation.mutateAsync(expenseData);

      // Update rental with new payment status
      await updateMutation.mutateAsync({ paymentStatus: status });
    } catch (error: any) {
      setIsCreatingExpense(false);
      Alert.alert('Error', 'Failed to create expense: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePaymentStatusChange = (status: string) => {
    if (status === 'Partial' || status === 'Paid') {
      // Check if expense already exists for this rental
      const hasLinkedExpense = rentalLinkedExpense && rentalLinkedExpense.id;
      
      if (!hasLinkedExpense) {
        setPendingPaymentStatus(status);
        setExpenseFormData({
          amount: status === 'Paid' ? total.toString() : '',
          date: new Date(),
        });
        setShowExpenseLinkModal(true);
      } else {
        // Just update the payment status without creating expense
        setFormData({ ...formData, paymentStatus: status });
      }
    } else {
      // For 'Pending' status, just update without expense linking
      setFormData({ ...formData, paymentStatus: status });
    }
    setShowPaymentStatusDropdown(false);
  };

  const handleExpenseLinkConfirm = () => {
    const amount = pendingPaymentStatus === 'Paid' ? total.toString() : expenseFormData.amount;
    const dateStr = format(expenseFormData.date, 'yyyy-MM-dd');
    
    createExpenseForRental(amount, pendingPaymentStatus, dateStr);
  };

  const handleDeleteExpense = () => {
    if (rentalLinkedExpense && rentalLinkedExpense.id && !deleteExpenseMutation.isPending) {
      Alert.alert(
        'Delete Linked Expense',
        'This will delete the expense record and revert the account balance. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              if (!deleteExpenseMutation.isPending) {
                deleteExpenseMutation.mutate(rentalLinkedExpense.id);
              }
            }
          },
        ]
      );
    }
  };

  const handleSave = () => {
    if (!formData.customerName) {
      Alert.alert('Validation Error', 'Customer name is required');
      return;
    }

    const data = {
      ...formData,
      rentalDate: format(formData.rentalDate, 'yyyy-MM-dd'),
      returnDate: format(formData.returnDate, 'yyyy-MM-dd'),
      discount: formData.discount ? 'true' : 'false',
      totalAmount: total.toString(),
    };

    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleDownloadPdf = async (type: 'quote' | 'invoice') => {
    console.log(`📋 Starting ${type} download process for rental:`, rentalId);
    
    if (!rentalId) {
      Alert.alert('Error', 'No rental ID found');
      return;
    }
    
    try {
      // Create download URL for the rental PDF
      const baseUrl = envConfig.API_URL;
      const downloadUrl = `${baseUrl}/api/rentals/${rentalId}/pdf?type=${type}`;
            
      // Download PDF directly using browser
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        console.log(`🔗 Opening ${type} PDF URL:`, downloadUrl);
        Linking.openURL(downloadUrl)
          .then(() => console.log(`✅ Opened ${type} PDF URL in browser`))
          .catch((error) => {
            console.error(`❌ Failed to open ${type} PDF URL:`, error);
            Alert.alert('Error', 'Cannot open browser');
          });
      }
    } catch (error) {
      console.error(`💥 ${type} PDF download error:`, error);
      Alert.alert('Error', `Failed to download ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadReport = async () => {
    console.log('📊 Starting rental report download process for rental:', rentalId);
    
    if (!rentalId) {
      Alert.alert('Error', 'No rental ID found');
      return;
    }
    
    try {
      const baseUrl = envConfig.API_URL;
      const downloadUrl = `${baseUrl}/api/rentals/${rentalId}/report`;
      
      console.log('🔗 Opening rental report URL:', downloadUrl);
      
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
        console.log('✅ Opened in new tab (web)');
      } else {
        Linking.openURL(downloadUrl)
          .then(() => console.log('✅ Opened URL in browser'))
          .catch((error) => {
            console.error('❌ Failed to open URL:', error);
            Alert.alert('Error', 'Cannot open browser');
          });
      }
    } catch (error) {
      console.error('💥 Rental report download error:', error);
      Alert.alert('Error', `Failed to download rental report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if ((rentalLoading || itemsLoading) && !isNew) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
            {(() => {
              // Only show indicator if rental actually has a linked expense
              if (rentalLinkedExpense && rentalLinkedExpense.id) {
                const indicator = getExpenseIndicator(formData.paymentStatus);
                if (indicator) {
                  return (
                    <View style={[
                      styles.linkedExpenseIndicator, 
                      { backgroundColor: `${indicator.color}20`, borderColor: indicator.color }
                    ]}>
                      <Ionicons 
                        name={indicator.icon as any} 
                        size={14} 
                        color={indicator.color} 
                      />
                    </View>
                  );
                }
              }
              return null;
            })()}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Customer Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              placeholder="Enter customer name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={formData.customerPhone}
              onChangeText={(text) => setFormData({ ...formData, customerPhone: text })}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={formData.customerEmail}
              onChangeText={(text) => setFormData({ ...formData, customerEmail: text })}
              placeholder="Enter email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={formData.customerAddress}
              onChangeText={(text) => setFormData({ ...formData, customerAddress: text })}
              placeholder="Enter address"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Service Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Details</Text>
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <DatePicker
                label="Service Date *"
                value={formData.rentalDate}
                onChange={(date) => setFormData({ ...formData, rentalDate: date })}
              />
            </View>
            <View style={styles.halfField}>
              <DatePicker
                label="Return Date"
                value={formData.returnDate}
                onChange={(date) => setFormData({ ...formData, returnDate: date })}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.text }]}>Status</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setShowStatusDropdown(true);
                  setShowPaymentStatusDropdown(false);
                  setShowPaymentModeDropdown(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: colors.text }]}>{formData.status}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.text }]}>Payment</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setShowPaymentStatusDropdown(true);
                  setShowStatusDropdown(false);
                  setShowPaymentModeDropdown(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: colors.text }]}>{formData.paymentStatus}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Any additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Service Items */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Items</Text>
          
          {/* Add Item Form */}
          <View style={[styles.addItemForm, { backgroundColor: colors.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Asset</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowAssetDropdown(true)}
              >
                <Ionicons name="cube" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, { color: newItem.assetId ? colors.text : colors.textSecondary }]}>
                  {newItem.assetId ? getAssetName(newItem.assetId) : 'Select asset'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {newItem.assetId && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Rate</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowRateDropdown(true)}
                >
                  <Text style={[styles.dropdownText, { color: getRatesForAsset(newItem.assetId).length > 0 ? colors.text : colors.textSecondary }]}>
                    {getRatesForAsset(newItem.assetId).length > 0 
                      ? `${newItem.duration} ${newItem.timeUnit} - ${formatIndianCurrency(Number(newItem.ratePerUnit))}`
                      : 'Select rate'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={[styles.label, { color: colors.text }]}>Qty (max: {getAssetQuantity(newItem.assetId)})</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={newItem.quantity.toString()}
                  onChangeText={(text) => handleQuantityChange(parseInt(text) || 1)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.label, { color: colors.text }]}>Total</Text>
                <Text style={[styles.itemTotal, { color: accentColor }]}>
                  {formatIndianCurrency(Number(newItem.totalAmount))}
                </Text>
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleCalculatePerQuantityChange(!newItem.calculatePerQuantity)}
              >
                <View style={[styles.checkboxBox, { borderColor: colors.border }]}>
                  {newItem.calculatePerQuantity && <Ionicons name="checkmark" size={16} color={accentColor} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Calculate Per Quantity</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: accentColor }]}
              onPress={addItem}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Items List */}
          {items.map((item, index) => (
            <View key={index} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: colors.text }]}>{getAssetName(item.assetId)}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Ionicons name="trash-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
                {item.quantity} × {item.duration} {item.timeUnit} @ {formatIndianCurrency(Number(item.ratePerUnit))}
              </Text>
              <Text style={[styles.itemAmount, { color: accentColor }]}>
                {formatIndianCurrency(Number(item.totalAmount))}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatIndianCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, discount: !formData.discount })}
            >
              <View style={[styles.checkboxBox, { borderColor: colors.border }]}>
                {formData.discount && <Ionicons name="checkmark" size={16} color={accentColor} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Apply Discount</Text>
            </TouchableOpacity>
          </View>

          {formData.discount && (
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.discountAmount}
                onChangeText={(text) => setFormData({ ...formData, discountAmount: text })}
                placeholder="Discount amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          )}

          {formData.discount && discountValue > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#ef4444' : '#dc2626' }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#ef4444' : '#dc2626' }]}>
                -{formatIndianCurrency(discountValue)}
              </Text>
            </View>
          )}

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: accentColor }]}>
              {formatIndianCurrency(total)}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Payment Mode</Text>
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setShowPaymentModeDropdown(true);
                setShowStatusDropdown(false);
                setShowPaymentStatusDropdown(false);
              }}
            >
              <Text style={[styles.dropdownText, { color: formData.paymentMode ? colors.text : colors.textSecondary }]}>
                {formData.paymentMode || 'Select payment mode'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Linked Expense Section */}
          {rentalLinkedExpense && rentalLinkedExpense.id && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Linked Expense</Text>
              <View style={[styles.linkedExpenseContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.linkedExpenseInfo}>
                  <Text style={[styles.linkedExpenseText, { color: colors.text }]}>
                    {formatIndianCurrency(Number(rentalLinkedExpense.amount))} - {rentalLinkedExpense.description}
                  </Text>
                  <Text style={[styles.linkedExpenseDate, { color: colors.textSecondary }]}>
                    {format(new Date(rentalLinkedExpense.date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.deleteExpenseButton, { borderColor: '#dc2626' }]}
                  onPress={handleDeleteExpense}
                  disabled={deleteExpenseMutation.isPending}
                >
                  {deleteExpenseMutation.isPending ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {!isNew && (
          <View style={styles.pdfButtonsRow}>
            <TouchableOpacity 
              style={[styles.pdfButton, { borderColor: colors.border }]}
              onPress={() => handleDownloadPdf('quote')}
            >
              <Ionicons name="download-outline" size={20} color={colors.text} />
              <Text style={[styles.pdfButtonText, { color: colors.text }]}>Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pdfButton, { borderColor: colors.border }]}
              onPress={() => handleDownloadPdf('invoice')}
            >
              <Ionicons name="download-outline" size={20} color={colors.text} />
              <Text style={[styles.pdfButtonText, { color: colors.text }]}>Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pdfButton, { borderColor: colors.border }]}
              onPress={handleDownloadReport}
            >
              <Ionicons name="clipboard-outline" size={20} color={colors.text} />
              <Text style={[styles.pdfButtonText, { color: colors.text }]}>Report</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: accentColor }]}
          onPress={handleSave}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isNew ? 'Create Order' : 'Update Order'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Modals */}
      {/* Asset Dropdown */}
      <Modal visible={showAssetDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAssetDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Asset</Text>
            <ScrollView>
              {activeAssets.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleAssetSelect(asset.id)}
                >
                  <Ionicons name="cube" size={18} color={colors.textSecondary} />
                  <Text style={[styles.dropdownListItemText, { color: colors.text }]}>
                    {asset.name} ({asset.category})
                  </Text>
                  {newItem.assetId === asset.id && <Ionicons name="checkmark" size={20} color={accentColor} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rate Dropdown */}
      <Modal visible={showRateDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRateDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Rate</Text>
            <ScrollView>
              {getRatesForAsset(newItem.assetId).map((rate) => (
                <TouchableOpacity
                  key={rate.id}
                  style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleRateSelect(rate.id)}
                >
                  <Text style={[styles.dropdownListItemText, { color: colors.text }]}>
                    {rate.duration} {rate.timeUnit} - {formatIndianCurrency(Number(rate.amount))}
                  </Text>
                  {newItem.duration === rate.duration && newItem.timeUnit === rate.timeUnit && 
                    <Ionicons name="checkmark" size={20} color={accentColor} />
                  }
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                onPress={() => handleRateSelect('add-new-rate')}
              >
                <Ionicons name="add" size={18} color={accentColor} />
                <Text style={[styles.dropdownListItemText, { color: accentColor, fontWeight: '600' }]}>
                  Add Rental Rate
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Dropdown */}
      <Modal visible={showStatusDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatusDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Status</Text>
            {['Inquired', 'In Progress', 'Completed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setFormData({ ...formData, status });
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={[styles.dropdownListItemText, { color: colors.text }]}>{status}</Text>
                {formData.status === status && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Status Dropdown */}
      <Modal visible={showPaymentStatusDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPaymentStatusDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Payment Status</Text>
            {(config?.paymentStatuses || ['Pending', 'Partial', 'Paid']).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                onPress={() => handlePaymentStatusChange(status)}
              >
                <Text style={[styles.dropdownListItemText, { color: colors.text }]}>{status}</Text>
                {formData.paymentStatus === status && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Mode Dropdown */}
      <Modal visible={showPaymentModeDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPaymentModeDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Payment Mode</Text>
            {(config?.paymentModes || ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card']).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setFormData({ ...formData, paymentMode: mode });
                  setShowPaymentModeDropdown(false);
                }}
              >
                <Text style={[styles.dropdownListItemText, { color: colors.text }]}>{mode}</Text>
                {formData.paymentMode === mode && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Rate Dialog */}
      <Modal visible={showAddRateDialog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Add Rental Rate</Text>
              <TouchableOpacity onPress={() => setShowAddRateDialog(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.dialogSubtext, { color: colors.textSecondary }]}>
              Adding rate for: <Text style={{ fontWeight: '600' }}>{getAssetName(newItem.assetId)}</Text>
            </Text>

            <View style={styles.dialogContent}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={newRateForm.duration.toString()}
                    onChangeText={(text) => setNewRateForm({ ...newRateForm, duration: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.label, { color: colors.text }]}>Time Unit</Text>
                  <TouchableOpacity 
                    style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowTimeUnitDropdown(true)}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {newRateForm.timeUnit === 'hrs' ? 'Hours' : 'Days'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={newRateForm.amount}
                  onChangeText={(text) => setNewRateForm({ ...newRateForm, amount: text })}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {getRatesForAsset(newItem.assetId).length > 0 && (
                <View style={[styles.existingRatesContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.existingRatesTitle, { color: colors.text }]}>Existing rates for this asset:</Text>
                  {getRatesForAsset(newItem.assetId).map(rate => (
                    <Text key={rate.id} style={[styles.existingRateItem, { color: colors.textSecondary }]}>
                      {rate.duration} {rate.timeUnit} - {formatIndianCurrency(Number(rate.amount))}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dialogFooter}>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonSecondary, { borderColor: colors.border }]}
                onPress={() => setShowAddRateDialog(false)}
              >
                <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonPrimary, { backgroundColor: accentColor }]}
                onPress={handleAddRate}
              >
                <Text style={[styles.dialogButtonText, { color: '#fff' }]}>Save Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Unit Dropdown for Add Rate Dialog */}
      <Modal visible={showTimeUnitDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimeUnitDropdown(false)}>
          <View style={[styles.dropdownList, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownListTitle, { color: colors.text }]}>Select Time Unit</Text>
            {['hrs', 'days'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[styles.dropdownListItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setNewRateForm({ ...newRateForm, timeUnit: unit });
                  setShowTimeUnitDropdown(false);
                }}
              >
                <Text style={[styles.dropdownListItemText, { color: colors.text }]}>
                  {unit === 'hrs' ? 'Hours' : 'Days'}
                </Text>
                {newRateForm.timeUnit === unit && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Expense Link Modal */}
      <Modal visible={showExpenseLinkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Link Payment Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseLinkModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.dialogSubtext, { color: colors.textSecondary }]}>
              Creating expense record for payment status: <Text style={{ fontWeight: '600' }}>{pendingPaymentStatus}</Text>
            </Text>

            <View style={styles.dialogContent}>
              {pendingPaymentStatus === 'Partial' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Payment Amount (₹) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={expenseFormData.amount}
                    onChangeText={(text) => {
                      const amount = parseFloat(text) || 0;
                      if (amount <= total) {
                        setExpenseFormData({ ...expenseFormData, amount: text });
                      }
                    }}
                    keyboardType="numeric"
                    placeholder={`Max: ${formatIndianCurrency(total)}`}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    Maximum amount: {formatIndianCurrency(total)}
                  </Text>
                </View>
              )}

              {pendingPaymentStatus === 'Paid' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Payment Amount</Text>
                  <Text style={[styles.readOnlyAmount, { color: colors.text, backgroundColor: colors.surface }]}>
                    {formatIndianCurrency(total)}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Payment Date *</Text>
                <DatePicker
                  label="Payment Date *"
                  value={expenseFormData.date}
                  onChange={(date) => setExpenseFormData({ ...expenseFormData, date })}
                />
              </View>

              <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  This will create a credit expense record and update the account balance.
                </Text>
              </View>
            </View>

            <View style={styles.dialogFooter}>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonSecondary, { borderColor: colors.border }]}
                onPress={() => {
                  setShowExpenseLinkModal(false);
                  setIsCreatingExpense(false);
                }}
                disabled={isCreatingExpense}
              >
                <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonPrimary, { 
                  backgroundColor: accentColor,
                  opacity: isCreatingExpense ? 0.7 : 1
                }]}
                onPress={handleExpenseLinkConfirm}
                disabled={isCreatingExpense || (pendingPaymentStatus === 'Partial' && (!expenseFormData.amount || parseFloat(expenseFormData.amount) <= 0))}
              >
                {isCreatingExpense ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.dialogButtonText, { color: '#fff' }]}>Link Expense</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dropdownIcon: {
    marginRight: 4,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  addItemForm: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxRow: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  pdfButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 16,
  },
  dropdownListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  dropdownListItemText: {
    flex: 1,
    fontSize: 16,
  },
  dialogContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dialogSubtext: {
    fontSize: 14,
    marginBottom: 20,
  },
  dialogContent: {
    marginBottom: 20,
  },
  dialogFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogButtonSecondary: {
    borderWidth: 1,
  },
  dialogButtonPrimary: {
    // backgroundColor set dynamically
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  existingRatesContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  existingRatesTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  existingRateItem: {
    fontSize: 12,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  readOnlyAmount: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  linkedExpenseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkedExpenseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkedExpenseInfo: {
    flex: 1,
  },
  linkedExpenseText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  linkedExpenseDate: {
    fontSize: 12,
  },
  deleteExpenseButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
});
