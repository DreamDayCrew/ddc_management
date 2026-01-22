import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Rental, Configuration } from '@shared/schema';

const BRAND_MAROON = '#800020';

interface RentalWithExpenses extends Rental {
  linkedExpenses?: Array<{
    id: string;
    amount: string | number;
    date: string;
    description?: string;
  }>;
}

interface RentalListPdfOptions {
  customerInfo: boolean;
  rentalInfo: boolean;
  paymentInfo: boolean;
}

interface RentalListFilters {
  rentalStatus: string;
  paymentStatus: string;
  searchQuery: string;
  statusFilter: string;
  paymentStatusFilter: string;
  startDate: string;
  endDate: string;
}

interface RentalListTemplateProps {
  rentals: RentalWithExpenses[];
  config: Configuration;
  options: RentalListPdfOptions;
  filters: RentalListFilters;
  generatedDate: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: 2,
    borderBottomColor: BRAND_MAROON,
  },
  
  logoSection: {
    width: '40%',
  },
  
  companyInfo: {
    width: '60%',
    alignItems: 'flex-end',
  },
  
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 4,
  },
  
  companyDetails: {
    fontSize: 9,
    color: '#555',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  summarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 10,
  },
  
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  
  summaryItem: {
    width: '30%',
  },
  
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  
  filtersSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    border: 1,
    borderColor: '#e0e0e0',
  },
  
  filtersTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 8,
  },
  
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  
  filterLabel: {
    fontSize: 8,
    color: '#666',
  },
  
  filterValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  
  tableContainer: {
    marginTop: 15,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_MAROON,
    padding: 8,
    alignItems: 'center',
  },
  
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'flex-start',
  },
  
  tableRowEven: {
    backgroundColor: '#f8f9fa',
  },
  
  tableCell: {
    fontSize: 7,
    padding: 2,
    color: '#333',
  },
  
  tableCellBold: {
    fontWeight: 'bold',
  },
  
  statusBadge: {
    padding: 2,
    borderRadius: 3,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
  },
  
  statusInquired: { backgroundColor: '#3b82f6' },
  statusInProgress: { backgroundColor: '#f59e0b' },
  statusCompleted: { backgroundColor: '#10b981' },
  
  paymentPending: { backgroundColor: '#ef4444' },
  paymentPartial: { backgroundColor: '#f59e0b' },
  paymentPaid: { backgroundColor: '#10b981' },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#666',
  },
});

const RentalListTemplate: React.FC<RentalListTemplateProps> = ({ 
  rentals, 
  config, 
  options, 
  filters, 
  generatedDate 
}) => {
  const getTableColumns = () => {
    // Define base columns with relative weights (not percentages yet)
    const colDefs: { key: string; label: string; weight: number }[] = [];

    if (options.customerInfo) {
      colDefs.push({ key: 'customerName', label: 'Customer', weight: 18 });
      colDefs.push({ key: 'customerPhone', label: 'Phone', weight: 15 });
    }

    if (options.rentalInfo) {
      colDefs.push({ key: 'rentalDate', label: 'Rental Date', weight: 12 });
      colDefs.push({ key: 'returnDate', label: 'Return Date', weight: 12 });
    }

    if (options.paymentInfo) {
      colDefs.push({ key: 'totalAmount', label: 'Amount', weight: 12 });
    }

    colDefs.push({ key: 'status', label: 'Status', weight: 10 });
    colDefs.push({ key: 'paymentStatus', label: 'Payment', weight: 10 });

    if (options.paymentInfo) {
      colDefs.push({ key: 'paymentInfo', label: 'Payment Info', weight: 15 });
    }

    // Calculate total weight
    const totalWeight = colDefs.reduce((sum, col) => sum + col.weight, 0);

    // Convert weights to percentages
    return colDefs.map(col => ({
      key: col.key,
      label: col.label,
      style: { width: `${(col.weight / totalWeight * 100).toFixed(2)}%` },
    }));
  };

  const columns = getTableColumns();
  
  const getPaymentInfoFromExpenses = (rental: RentalWithExpenses) => {
    if (!rental.linkedExpenses || rental.linkedExpenses.length === 0) {
      return { paidAmount: 0, paidDate: null, hasPayment: false };
    }
    
    const totalPaidAmount = rental.linkedExpenses.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      return sum + (amount || 0);
    }, 0);
    
    // Get the most recent payment date
    const latestPaymentDate = rental.linkedExpenses
      .filter(expense => expense.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
    
    return {
      paidAmount: totalPaidAmount,
      paidDate: latestPaymentDate,
      hasPayment: totalPaidAmount > 0
    };
  };
  
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inquired': return styles.statusInquired;
      case 'in progress': return styles.statusInProgress;
      case 'completed': return styles.statusCompleted;
      default: return styles.statusInquired;
    }
  };

  const getPaymentStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return styles.paymentPending;
      case 'partial': return styles.paymentPartial;
      case 'paid': return styles.paymentPaid;
      default: return styles.paymentPending;
    }
  };

  const totalAmount = rentals.reduce((sum, rental) => sum + parseFloat(rental.totalAmount || '0'), 0);
  const totalPaidAmount = rentals.reduce((sum, rental) => {
    const paymentInfo = getPaymentInfoFromExpenses(rental);
    return sum + paymentInfo.paidAmount;
  }, 0);
  const completedRentals = rentals.filter(r => r.status.toLowerCase() === 'completed').length;
  const paidRentals = rentals.filter(r => r.paymentStatus.toLowerCase() === 'paid').length;

  return (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoSection}>
            {config.logo && (
              <Image src={config.logo} style={styles.logo} />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{config.businessName || 'Dream Day Crew'}</Text>
            <Text style={styles.companyDetails}>
              {config?.address && `${config.address}\n`}
              {config?.phone && `Phone: ${config.phone}\n`}
              {config?.email && `Email: ${config.email}`}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Rental Services Report</Text>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Rentals</Text>
              <Text style={styles.summaryValue}>{rentals.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={styles.summaryValue}>{completedRentals}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Fully Paid</Text>
              <Text style={styles.summaryValue}>{paidRentals}</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalPaidAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Generated</Text>
              <Text style={styles.summaryValue}>{generatedDate}</Text>
            </View>
          </View>
        </View>

        {/* Applied Filters */}
        {(filters.rentalStatus || filters.paymentStatus || filters.searchQuery || filters.startDate) && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>Applied Filters</Text>
            {filters.rentalStatus && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Rental Status:</Text>
                <Text style={styles.filterValue}>{filters.rentalStatus}</Text>
              </View>
            )}
            {filters.paymentStatus && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Payment Status:</Text>
                <Text style={styles.filterValue}>{filters.paymentStatus}</Text>
              </View>
            )}
            {filters.searchQuery && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Search:</Text>
                <Text style={styles.filterValue}>{filters.searchQuery}</Text>
              </View>
            )}
            {filters.startDate && filters.endDate && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Date Range:</Text>
                <Text style={styles.filterValue}>{formatDate(filters.startDate)} - {formatDate(filters.endDate)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {columns.map((col) => (
              <View key={col.key} style={col.style}>
                <Text style={styles.tableHeaderText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {rentals.map((rental, index) => (
            <View key={rental.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}>
              {columns.map((col) => {
                let content = '-';
                
                switch (col.key) {
                  case 'customerName':
                    content = rental.customerName;
                    break;
                  case 'customerPhone':
                    content = rental.customerPhone || '-';
                    break;
                  case 'rentalDate':
                    content = formatDate(rental.rentalDate);
                    break;
                  case 'returnDate':
                    content = rental.returnDate ? formatDate(rental.returnDate) : '-';
                    break;
                  case 'totalAmount':
                    content = formatCurrency(rental.totalAmount || 0);
                    break;
                  case 'status':
                    return (
                      <View key={col.key} style={[col.style, { alignItems: 'center', padding: 2 }]}>
                        <Text style={[styles.statusBadge, getStatusStyle(rental.status)]}>
                          {rental.status}
                        </Text>
                      </View>
                    );
                  case 'paymentStatus':
                    return (
                      <View key={col.key} style={[col.style, { alignItems: 'center', padding: 2 }]}>
                        <Text style={[styles.statusBadge, getPaymentStatusStyle(rental.paymentStatus)]}>
                          {rental.paymentStatus}
                        </Text>
                      </View>
                    );
                  case 'paymentInfo':
                    const paymentInfo = getPaymentInfoFromExpenses(rental);
                    if (paymentInfo.hasPayment) {
                      content = `Paid: ${formatCurrency(paymentInfo.paidAmount)}${paymentInfo.paidDate ? ` on ${formatDate(paymentInfo.paidDate)}` : ''}`;
                    } else {
                      content = '-';
                    }
                    break;
                }
                
                return (
                  <View key={col.key} style={col.style}>
                    <Text style={[
                      styles.tableCell, 
                      col.key === 'customerName' || col.key === 'totalAmount' ? styles.tableCellBold : {}
                    ]}>
                      {content}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated on {generatedDate} | {config.businessName || 'Dream Day Crew'}
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>
    </Document>
  );
};

export { RentalListTemplate };