import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Rental, RentalItem, Asset, Configuration } from '@shared/schema';

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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 15,
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
  businessContact: {
    fontSize: 9,
    color: '#333',
    marginTop: 4,
  },
  documentTitleContainer: {
    width: 120,
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  toSection: {
    flex: 1,
  },
  toLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: 10,
    color: '#333',
    marginBottom: 1,
  },
  rentalDetails: {
    alignItems: 'flex-end',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 10,
  },
  
  table: {
    width: '100%',
    marginBottom: 0,
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
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 30,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    fontSize: 10,
    color: '#333',
  },
  
  colNum: { width: '6%', textAlign: 'center' },
  colAsset: { width: '34%', paddingRight: 8 },
  colDuration: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right', paddingRight: 8 },
  colQty: { width: '10%', textAlign: 'center' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  grandTotalLabel: {
    width: '80%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  grandTotalValue: {
    width: '20%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  
  summarySection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 4,
    width: 200,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 10,
    textAlign: 'right',
    paddingRight: 10,
  },
  summaryValue: {
    width: 80,
    fontSize: 10,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  discountValue: {
    width: 80,
    fontSize: 10,
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#991b1b',
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    width: 200,
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    color: BRAND_MAROON,
  },
  
  notesSection: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.4,
  },
  
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  termsColumn: {
    width: '55%',
    paddingRight: 20,
  },
  paymentColumn: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: '#333',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  paymentValue: {
    fontSize: 9,
    color: '#333',
    flex: 1,
  },
  
  signatureSection: {
    marginTop: 40,
    alignItems: 'flex-end',
  },
  forCompany: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  signatureImage: {
    width: 80,
    height: 35,
    marginBottom: 5,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    width: 120,
    paddingTop: 5,
  },
  authorizedText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#333',
  },
});

const formatCurrency = (amount: number): string => {
  const fixedAmount = Math.abs(amount).toFixed(2);
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  let result = '';
  const len = integerPart.length;
  
  if (len <= 3) {
    result = integerPart;
  } else {
    result = integerPart.slice(-3);
    let remaining = integerPart.slice(0, -3);
    while (remaining.length > 0) {
      const chunk = remaining.slice(-2);
      result = chunk + ',' + result;
      remaining = remaining.slice(0, -2);
    }
  }
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rs.${result}.${decimalPart}`;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric', 
  });
};

type DocumentType = 'quote' | 'invoice';

interface RentalTemplateProps {
  rental: Rental;
  items: RentalItem[];
  assets: Asset[];
  config: Configuration;
  documentType: DocumentType;
}

export const RentalTemplate: React.FC<RentalTemplateProps> = ({ 
  rental, 
  items,
  assets,
  config, 
  documentType
}) => {
  const getAssetName = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };
  
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  const discountValue = rental.discount === 'true' ? Number(rental.discountAmount || 0) : 0;
  const total = subtotal - discountValue;
  
  const documentTitle = documentType === 'quote' ? 'RENTAL QUOTE' : 'RENTAL INVOICE';
  const documentNumber = `R${documentType === 'quote' ? 'Q' : 'I'}-${rental.id.slice(0, 8).toUpperCase()}`;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            {config?.logo && (
              <Image src={config.logo} style={styles.logo} />
            )}
          </View>
          <View style={styles.businessInfoCenter}>
            <Text style={styles.businessName}>{config?.businessName || 'Dream Day Crew'}</Text>
            {config?.address && <Text style={styles.businessAddress}>{config.address}</Text>}
            {config?.phone && <Text style={styles.businessContact}>Contact: {config.phone}</Text>}
            {config?.gstNumber && <Text style={styles.businessContact}>GST: {config.gstNumber}</Text>}
          </View>
          <View style={styles.documentTitleContainer}>
            <Text style={styles.documentTitle}>{documentTitle}</Text>
            <Text style={styles.documentSubtitle}>{documentNumber}</Text>
          </View>
        </View>
        
        <View style={styles.headerLine} />
        
        <View style={styles.clientSection}>
          <View style={styles.toSection}>
            <Text style={styles.toLabel}>BILL TO:</Text>
            <Text style={styles.clientName}>{rental.customerName}</Text>
            {rental.customerPhone && <Text style={styles.clientInfo}>{rental.customerPhone}</Text>}
            {rental.customerEmail && <Text style={styles.clientInfo}>{rental.customerEmail}</Text>}
            {rental.customerAddress && <Text style={styles.clientInfo}>{rental.customerAddress}</Text>}
          </View>
          <View style={styles.rentalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(new Date())}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rental Date:</Text>
              <Text style={styles.detailValue}>{formatDate(rental.rentalDate)}</Text>
            </View>
            {rental.returnDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Return Date:</Text>
                <Text style={styles.detailValue}>{formatDate(rental.returnDate)}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>{rental.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colAsset]}>ITEM</Text>
            <Text style={[styles.tableHeaderCell, styles.colDuration]}>DURATION</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>RATE</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>TOTAL</Text>
          </View>
          
          {items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.colAsset]}>{getAssetName(item.assetId)}</Text>
              <Text style={[styles.tableCell, styles.colDuration]}>{item.duration} {item.timeUnit}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(Number(item.ratePerUnit))}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(Number(item.totalAmount))}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          
          {rental.discount === 'true' && discountValue > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.discountValue}>-{formatCurrency(discountValue)}</Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>
        
        {rental.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{rental.notes}</Text>
          </View>
        )}
        
        <View style={styles.footerSection}>
          <View style={styles.termsColumn}>
            <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
            <Text style={styles.termsText}>
              {config?.termsAndConditions || 
                '1. Equipment must be returned in the same condition as received.\n' +
                '2. Customer is responsible for any damage during rental period.\n' +
                '3. Late returns may incur additional charges.\n' +
                '4. Full payment required before equipment release.'}
            </Text>
          </View>
          {documentType === 'invoice' && (
            <View style={styles.paymentColumn}>
              <Text style={styles.sectionTitle}>Payment Information:</Text>
              {config?.accountHolderName && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Account Name:</Text>
                  <Text style={styles.paymentValue}>{config.accountHolderName}</Text>
                </View>
              )}
              {config?.bankName && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Bank:</Text>
                  <Text style={styles.paymentValue}>{config.bankName}</Text>
                </View>
              )}
              {config?.accountNumber && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Account No:</Text>
                  <Text style={styles.paymentValue}>{config.accountNumber}</Text>
                </View>
              )}
              {config?.ifscCode && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>IFSC:</Text>
                  <Text style={styles.paymentValue}>{config.ifscCode}</Text>
                </View>
              )}
              {config?.upiId && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>UPI:</Text>
                  <Text style={styles.paymentValue}>{config.upiId}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.forCompany}>For {config?.businessName || 'Dream Day Crew'}</Text>
          {config?.signatureImage && (
            <Image src={config.signatureImage} style={styles.signatureImage} />
          )}
          <View style={styles.signatureLine}>
            <Text style={styles.authorizedText}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
