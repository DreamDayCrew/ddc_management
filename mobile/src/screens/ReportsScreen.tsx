import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useEvents, useExpenses, useAssets } from '../hooks/useApi';
import { useTheme } from '../contexts';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseISODate = (dateStr: string): { month: number; year: number } | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  if (isNaN(year) || isNaN(month)) return null;
  return { month, year };
};

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [leftMonth, setLeftMonth] = useState<number>(lastMonth);
  const [leftYear, setLeftYear] = useState<number>(lastMonthYear);
  const [rightMonth, setRightMonth] = useState<number>(currentMonth);
  const [rightYear, setRightYear] = useState<number>(currentYear);

  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();

  const isLoading = eventsLoading || expensesLoading || assetsLoading;

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(currentYear);
    events.forEach((e: any) => {
      if (e.eventDate) {
        const parsed = parseISODate(e.eventDate);
        if (parsed) yearSet.add(parsed.year);
      }
    });
    expenses.forEach((e: any) => {
      if (e.date) {
        const parsed = parseISODate(e.date);
        if (parsed) yearSet.add(parsed.year);
      }
    });
    assets.forEach((a: any) => {
      if (a.purchaseDate) {
        const parsed = parseISODate(a.purchaseDate);
        if (parsed) yearSet.add(parsed.year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [events, expenses, assets, currentYear]);

  const filterByMonthYear = <T extends { date?: string; eventDate?: string; purchaseDate?: string | null }>(
    items: T[],
    month: number,
    year: number,
    dateField: keyof T
  ) => {
    return items.filter((item) => {
      const dateValue = item[dateField];
      if (!dateValue) return false;
      const parsed = parseISODate(dateValue as string);
      if (!parsed) return false;
      return parsed.month === month && parsed.year === year;
    });
  };

  const getEventStats = (month: number, year: number) => {
    const filtered = filterByMonthYear(events, month, year, "eventDate");
    const completed = filtered.filter((e: any) => e.eventStatus === "Completed").length;
    const inProgress = filtered.filter((e: any) => e.eventStatus === "In Progress").length;
    const missed = filtered.filter((e: any) => e.eventStatus === "Inquiry").length;
    return { completed, inProgress, missed, total: filtered.length };
  };

  const getFinancialStats = (month: number, year: number) => {
    const filteredExpenses = filterByMonthYear(expenses, month, year, "date");
    const income = filteredExpenses
      .filter((e: any) => e.to_account === "DDC Fund")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const eventExpenses = filteredExpenses
      .filter((e: any) => e.from_account === "DDC Fund" && e.category === "Event")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const assetExpenses = filteredExpenses
      .filter((e: any) => e.from_account === "DDC Fund" && e.category === "Asset")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const officeExpenses = filteredExpenses
      .filter((e: any) => e.from_account === "DDC Fund" && e.category === "Office")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const totalExpenses = eventExpenses + assetExpenses + officeExpenses;
    return { income, eventExpenses, assetExpenses, officeExpenses, totalExpenses };
  };

  const getAssetStats = (month: number, year: number) => {
    const filtered = filterByMonthYear(assets, month, year, "purchaseDate");
    const count = filtered.length;
    const totalInvestment = filtered.reduce((sum: number, a: any) => sum + Number(a.purchasedAmount || 0), 0);
    return { count, totalInvestment };
  };

  const eventStats = getEventStats(selectedMonth, selectedYear);
  const financialStats = getFinancialStats(selectedMonth, selectedYear);
  const assetStats = getAssetStats(selectedMonth, selectedYear);

  const leftEventStats = getEventStats(leftMonth, leftYear);
  const leftFinancialStats = getFinancialStats(leftMonth, leftYear);
  const leftAssetStats = getAssetStats(leftMonth, leftYear);

  const rightEventStats = getEventStats(rightMonth, rightYear);
  const rightFinancialStats = getFinancialStats(rightMonth, rightYear);
  const rightAssetStats = getAssetStats(rightMonth, rightYear);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month/Year Filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={(value) => setSelectedMonth(value)}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
          >
            {MONTHS.map((month, index) => (
              <Picker.Item key={index} label={month} value={index} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={(value) => setSelectedYear(value)}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
          >
            {availableYears.map((year) => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Events Overview */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Events Overview</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(0,184,148,0.1)' : '#e6fff5' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#00b894" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{eventStats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(0,123,255,0.1)' : '#e7f3ff' }]}>
            <Ionicons name="time" size={24} color="#007bff" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{eventStats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,193,7,0.1)' : '#fff8e6' }]}>
            <Ionicons name="alert-circle" size={24} color="#ffc107" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{eventStats.missed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inquiry</Text>
          </View>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="currency-inr" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Financial Summary</Text>
        </View>
        <View style={styles.financialRow}>
          <View style={[styles.financialBox, { backgroundColor: isDark ? 'rgba(0,184,148,0.1)' : '#e6fff5' }]}>
            <Ionicons name="trending-up" size={20} color="#00b894" />
            <Text style={[styles.financialAmount, { color: '#00b894' }]}>{formatCurrency(financialStats.income)}</Text>
            <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Total Income</Text>
          </View>
          <View style={[styles.financialBox, { backgroundColor: isDark ? 'rgba(225,112,85,0.1)' : '#ffebe6' }]}>
            <Ionicons name="trending-down" size={20} color="#e17055" />
            <Text style={[styles.financialAmount, { color: '#e17055' }]}>{formatCurrency(financialStats.totalExpenses)}</Text>
            <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
          </View>
        </View>
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text }]}>Event Expenses</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatCurrency(financialStats.eventExpenses)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text }]}>Asset Expenses</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatCurrency(financialStats.assetExpenses)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text }]}>Office Expenses</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatCurrency(financialStats.officeExpenses)}</Text>
          </View>
        </View>
      </View>

      {/* Asset Investments */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="cube" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Asset Investments</Text>
        </View>
        <View style={styles.assetRow}>
          <View style={styles.assetStat}>
            <Text style={[styles.assetNumber, { color: colors.primary }]}>{assetStats.count}</Text>
            <Text style={[styles.assetLabel, { color: colors.textSecondary }]}>Assets Purchased</Text>
          </View>
          <View style={styles.assetStat}>
            <Text style={[styles.assetNumber, { color: colors.primary }]}>{formatCurrency(assetStats.totalInvestment)}</Text>
            <Text style={[styles.assetLabel, { color: colors.textSecondary }]}>Total Investment</Text>
          </View>
        </View>
      </View>

      {/* Period Comparison */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Period Comparison</Text>
        </View>
        
        {/* Left Period Selector */}
        <View style={styles.comparisonPickers}>
          <View style={styles.periodSection}>
            <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>Period 1</Text>
            <View style={styles.periodPickerRow}>
              <View style={styles.miniPickerContainer}>
                <Picker
                  selectedValue={leftMonth}
                  onValueChange={(value) => setLeftMonth(value)}
                  style={[styles.miniPicker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  {MONTHS.map((month, index) => (
                    <Picker.Item key={index} label={month.slice(0, 3)} value={index} />
                  ))}
                </Picker>
              </View>
              <View style={styles.miniPickerContainer}>
                <Picker
                  selectedValue={leftYear}
                  onValueChange={(value) => setLeftYear(value)}
                  style={[styles.miniPicker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  {availableYears.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.periodSection}>
            <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>Period 2</Text>
            <View style={styles.periodPickerRow}>
              <View style={styles.miniPickerContainer}>
                <Picker
                  selectedValue={rightMonth}
                  onValueChange={(value) => setRightMonth(value)}
                  style={[styles.miniPicker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  {MONTHS.map((month, index) => (
                    <Picker.Item key={index} label={month.slice(0, 3)} value={index} />
                  ))}
                </Picker>
              </View>
              <View style={styles.miniPickerContainer}>
                <Picker
                  selectedValue={rightYear}
                  onValueChange={(value) => setRightYear(value)}
                  style={[styles.miniPicker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  {availableYears.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Comparison Data */}
        <View style={styles.comparisonGrid}>
          <View style={styles.comparisonColumn}>
            <Text style={[styles.comparisonHeader, { color: colors.text }]}>{MONTHS[leftMonth].slice(0, 3)} {leftYear}</Text>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Events</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{leftEventStats.total}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{formatCurrency(leftFinancialStats.income)}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{formatCurrency(leftFinancialStats.totalExpenses)}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Assets</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{leftAssetStats.count}</Text>
            </View>
          </View>
          <View style={styles.comparisonColumn}>
            <Text style={[styles.comparisonHeader, { color: colors.text }]}>{MONTHS[rightMonth].slice(0, 3)} {rightYear}</Text>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Events</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{rightEventStats.total}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{formatCurrency(rightFinancialStats.income)}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{formatCurrency(rightFinancialStats.totalExpenses)}</Text>
            </View>
            <View style={[styles.comparisonItem, { backgroundColor: isDark ? colors.surface : '#f8f9fa' }]}>
              <Text style={[styles.comparisonItemLabel, { color: colors.textSecondary }]}>Assets</Text>
              <Text style={[styles.comparisonItemValue, { color: colors.text }]}>{rightAssetStats.count}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    height: 50,
  },
  card: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  financialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  financialBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  financialAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  financialLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  breakdownSection: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 6,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  assetRow: {
    flexDirection: 'row',
    gap: 16,
  },
  assetStat: {
    flex: 1,
    alignItems: 'center',
  },
  assetNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  assetLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonPickers: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodSection: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  periodPickerRow: {
    flexDirection: 'row',
    gap: 4,
  },
  miniPickerContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  miniPicker: {
    height: 40,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  comparisonItem: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  comparisonItemLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  comparisonItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
