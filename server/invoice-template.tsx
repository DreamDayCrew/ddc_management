import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Event, Requirement, Configuration } from '@shared/schema';

// Professional styles for PDF invoice
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800020',
    letterSpacing: 2,
  },
  headerDivider: {
    borderBottom: '3 solid #800020',
    marginBottom: 20,
  },
  
  // Business Info Section
  businessSection: {
    marginBottom: 25,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2c3e50',
  },
  businessDetails: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#555',
  },
  
  // Two Column Layout
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '1 solid #e0e0e0',
  },
  
  // Bill To Section
  billToSection: {
    flex: 1,
    marginRight: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientInfo: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333',
  },
  
  // Invoice Details Section
  invoiceDetailsSection: {
    width: 180,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 9,
    color: '#333',
  },
  
  // Table Styles
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottom: '2 solid #800020',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 35,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  
  // Column widths
  col1: { width: '8%' },   // S.No
  col2: { width: '40%' },  // Description
  col3: { width: '12%' },  // Qty
  col4: { width: '15%' },  // Rate
  col5: { width: '25%' },  // Amount
  
  // Summary Section
  summarySection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryTable: {
    width: 200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#800020',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#333',
  },
  summaryValue: {
    fontSize: 10,
    color: '#333',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Footer Section
  footer: {
    marginTop: 40,
    borderTop: '1 solid #e0e0e0',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.4,
  },
});

interface InvoiceTemplateProps {
  event: Event;
  requirements: Requirement[];
  config: Configuration;
  invoiceNumber: string;
}

export const ServerInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ 
  event, 
  requirements, 
  config, 
  invoiceNumber 
}) => {
  // Format number for currency display
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate totals
  const subtotal = requirements.reduce((sum, req) => sum + parseFloat(String(req.order || 0)), 0);
  const gstAmount = config.includeGst === "true" ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;
  
  // Calculate discount if applicable
  const discountAmount = requirements.reduce((sum, req) => sum + parseFloat(String(req.req_discount_amount || 0)), 0);
  const finalSubtotal = subtotal - discountAmount;
  const finalGstAmount = config.includeGst === "true" ? finalSubtotal * 0.18 : 0;
  const finalTotal = finalSubtotal + finalGstAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>
        <View style={styles.headerDivider} />
        
        {/* Business Information */}
        <View style={styles.businessSection}>
          <Text style={styles.businessName}>{config.businessName}</Text>
          <Text style={styles.businessDetails}>
            {config.address}{config.address && '\n'}
            {config.email && `Email: ${config.email}\n`}
            {config.phone && `Phone: ${config.phone}`}
          </Text>
        </View>
        
        {/* Two Column Layout - Bill To & Invoice Details */}
        <View style={styles.twoColumns}>
          {/* Bill To Section */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientInfo}>
              {event.clientName}{'\n'}
              {event.clientEmail && `${event.clientEmail}\n`}
              {event.clientPhone && `${event.clientPhone}\n`}
              {event.venue}
            </Text>
          </View>
          
          {/* Invoice Details */}
          <View style={styles.invoiceDetailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #</Text>
              <Text style={styles.detailValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{new Date().toLocaleDateString('en-GB')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Event Date</Text>
              <Text style={styles.detailValue}>{new Date(event.eventDate).toLocaleDateString('en-GB')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{event.providedService}</Text>
            </View>
          </View>
        </View>
        
        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>S.No</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>Amount</Text>
          </View>
          
          {/* Table Rows */}
          {requirements.map((req, index) => (
            <View key={req.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{req.requirement}</Text>
              <Text style={[styles.tableCell, styles.col3]}>1</Text>
              <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(parseFloat(String(req.order || 0)))}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(parseFloat(String(req.order || 0)))}</Text>
            </View>
          ))}
        </View>
        
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>-{formatCurrency(discountAmount)}</Text>
              </View>
            )}
            
            {config.includeGst === "true" && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (18%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(finalGstAmount)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        {config.termsAndConditions && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Terms & Conditions:{'\n'}
              {config.termsAndConditions}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};