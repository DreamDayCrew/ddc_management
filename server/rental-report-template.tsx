import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Configuration, Expense } from '@shared/schema';

const BRAND_MAROON = '#800020';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_MAROON,
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: 'contain',
  },
  businessInfoCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  reportTitleContainer: {
    width: 100,
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_MAROON,
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  
  table: {
    width: '100%',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 24,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  
  // Column widths for rental items table
  colNum: { width: '6%', textAlign: 'center' },
  colItem: { width: '30%', paddingRight: 4 },
  colQty: { width: '8%', textAlign: 'center' },
  colDuration: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right', paddingRight: 4 },
  colTotal: { width: '15%', textAlign: 'right' },
  colStatus: { width: '11%', textAlign: 'center' },
  
  summaryBox: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#333',
  },
  summaryValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 6,
  },
  
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  notes: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.4,
    marginTop: 5,
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
});

// Utility functions
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

const getStatusColor = (status: string): { backgroundColor: string; color: string } => {
  switch (status) {
    case 'Quote':
      return { backgroundColor: '#fef3c7', color: '#d97706' };
    case 'Invoice':
      return { backgroundColor: '#dbeafe', color: '#2563eb' };
    case 'Paid':
      return { backgroundColor: '#dcfce7', color: '#16a34a' };
    case 'Returned':
      return { backgroundColor: '#e5e7eb', color: '#6b7280' };
    case 'Pending':
      return { backgroundColor: '#fee2e2', color: '#dc2626' };
    case 'Partial':
      return { backgroundColor: '#fef3c7', color: '#d97706' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#6b7280' };
  }
};

// Define interfaces for rental data
interface RentalItem {
  id: string;
  assetId: string;
  quantity: number;
  duration: number;
  timeUnit: string;
  ratePerUnit: string;
  totalAmount: string;
  // Asset details (joined)
  assetName?: string;
  assetCategory?: string;
}

interface Rental {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  rentalDate: string;
  returnDate?: string;
  status: string;
  paymentStatus: string;
  paymentMode?: string;
  notes?: string;
  totalAmount: string;
  discount: string;
  discountAmount: string;
  createdAt: string;
  updatedAt: string;
}

interface RentalWithItems extends Rental {
  items: RentalItem[];
}

interface RentalReportProps {
  rental: RentalWithItems;
  configuration: Configuration | null;
  rentalExpense: Expense | null;
}

export const RentalReportTemplate: React.FC<RentalReportProps> = ({
  rental,
  configuration,
  rentalExpense,
}) => {
  const totalItems = rental.items.length;
  const totalQuantity = rental.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = rental.items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const discountAmount = Number(rental.discountAmount || 0);
  const finalAmount = subtotalAmount - discountAmount;
  const paidAmount = Number(rentalExpense?.amount || 0);
  const balanceDue = finalAmount - paidAmount;
  
  const rentalDuration = rental.returnDate 
    ? Math.ceil((new Date(rental.returnDate).getTime() - new Date(rental.rentalDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          {configuration?.logo && (
            <View style={styles.logoContainer}>
              <Image src={configuration.logo} style={styles.logo} />
            </View>
          )}
          
          <View style={styles.businessInfoCenter}>
            <Text style={styles.businessName}>
              {configuration?.businessName || 'Dream Day Crew'}
            </Text>
            <Text style={styles.businessAddress}>
              {configuration?.address || ''}
            </Text>
          </View>
          
          <View style={styles.reportTitleContainer}>
            <Text style={styles.reportTitle}>RENTAL REPORT</Text>
            <Text style={styles.reportSubtitle}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>
        
        <View style={styles.headerLine} />
        
        {/* Rental Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rental ID</Text>
              <Text style={styles.infoValue}>{rental.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, getStatusColor(rental.status)]}>
                {rental.status}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rental Date</Text>
              <Text style={styles.infoValue}>{formatDate(rental.rentalDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Return Date</Text>
              <Text style={styles.infoValue}>{formatDate(rental.returnDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {rentalDuration ? `${rentalDuration} day${rentalDuration !== 1 ? 's' : ''}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text style={[styles.infoValue, getStatusColor(rental.paymentStatus)]}>
                {rental.paymentStatus}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{rental.customerName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{rental.customerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{rental.customerEmail || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{rental.customerAddress || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        {/* Rental Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Items ({totalItems} item{totalItems !== 1 ? 's' : ''})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colDuration]}>Duration</Text>
              <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>
            {rental.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
                <View style={styles.colItem}>
                  <Text style={styles.tableCell}>
                    {item.assetName || `Asset ID: ${item.assetId.slice(-6)}`}
                  </Text>
                  {item.assetCategory && (
                    <Text style={[styles.tableCell, { fontSize: 8, color: '#666' }]}>
                      {item.assetCategory}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colDuration]}>
                  {item.duration} {item.timeUnit}
                </Text>
                <Text style={[styles.tableCell, styles.colRate]}>
                  {formatCurrency(item.ratePerUnit)}/{item.timeUnit}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.totalAmount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Financial Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Quantity:</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal Amount:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotalAmount)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                -{formatCurrency(discountAmount)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Final Amount:</Text>
            <Text style={[styles.summaryValue, { fontWeight: 'bold', fontSize: 12 }]}>
              {formatCurrency(finalAmount)}
            </Text>
          </View>
          {paidAmount > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid Amount:</Text>
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                  {formatCurrency(paidAmount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Balance Due:</Text>
                <Text style={[styles.summaryValue, { color: balanceDue > 0 ? '#dc2626' : '#16a34a' }]}>
                  {formatCurrency(Math.abs(balanceDue))}
                  {balanceDue < 0 && ' (Overpaid)'}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Notes */}
        {rental.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{rental.notes}</Text>
          </View>
        )}
        
        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
        </Text>
      </Page>
    </Document>
  );
};

export default RentalReportTemplate;