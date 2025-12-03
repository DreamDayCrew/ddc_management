import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Event, Requirement, Configuration } from '@shared/schema';

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
  invoiceTitleContainer: {
    width: 100,
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  clientPhone: {
    fontSize: 10,
    color: '#333',
  },
  invoiceDetails: {
    alignItems: 'flex-end',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  invoiceLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
  },
  invoiceValue: {
    fontSize: 10,
  },
  
  greeting: {
    fontSize: 10,
    marginBottom: 8,
  },
  introText: {
    fontSize: 10,
    marginBottom: 15,
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
  colDesc: { width: '44%', paddingRight: 8 },
  colQty: { width: '12%', textAlign: 'center' },
  colPrice: { width: '19%', textAlign: 'right', paddingRight: 8 },
  colTotal: { width: '19%', textAlign: 'right' },
  
  colNumWithDiscount: { width: '5%', textAlign: 'center' },
  colDescWithDiscount: { width: '37%', paddingRight: 8 },
  colQtyWithDiscount: { width: '10%', textAlign: 'center' },
  colPriceWithDiscount: { width: '16%', textAlign: 'right', paddingRight: 4 },
  colDiscountWithDiscount: { width: '16%', textAlign: 'right', paddingRight: 4 },
  colTotalWithDiscount: { width: '16%', textAlign: 'right' },
  
  descriptionMain: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  descriptionSub: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.4,
  },
  
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
    width: '81%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  grandTotalLabelWithDiscount: {
    width: '84%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  grandTotalValue: {
    width: '19%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  grandTotalValueWithDiscount: {
    width: '16%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  
  closingMessage: {
    marginTop: 20,
    fontSize: 10,
    marginBottom: 25,
  },
  
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  
  // Indian number system: last 3 digits, then groups of 2
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
  return `${sign}₹${result}.${decimalPart}`;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric', 
  });
};

type DocumentType = 'Invoice' | 'Quotation';

interface InvoiceTemplateProps {
  event: Event;
  requirements: Requirement[];
  config: Configuration;
  invoiceNumber: string;
  documentType?: DocumentType;
}

export const ServerInvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ 
  event, 
  requirements, 
  config, 
  invoiceNumber,
  documentType = 'Invoice'
}) => {
  const invoiceDate = new Date();
  
  const clientName = event.clientName || 'Customer';
  const clientPhone = event.clientPhone || '';
  
  let subtotal = 0;
  if (requirements && requirements.length > 0) {
    subtotal = requirements.reduce((sum, req) => {
      const price = Number(req.price ?? 0);
      const quantity = Number(req.quantity ?? 1);
      const reqDiscount = req.req_discount === 'true' ? Number(req.req_discount_amount ?? 0) : 0;
      const validPrice = isNaN(price) ? 0 : price;
      const validQuantity = isNaN(quantity) ? 1 : quantity;
      const validReqDiscount = isNaN(reqDiscount) ? 0 : reqDiscount;
      const lineTotal = Math.max((validPrice * validQuantity) - validReqDiscount, 0);
      return sum + lineTotal;
    }, 0);
  } else {
    const fallbackQuote = Number(event.finalizedQuote ?? event.initialQuote ?? 0);
    subtotal = isNaN(fallbackQuote) ? 0 : fallbackQuote;
  }
  
  const eventDiscountAmount = event?.discount === 'true' && event.discount_amount ? 
    Number(event.discount_amount) : 0;
  const afterEventDiscount = subtotal - (isNaN(eventDiscountAmount) ? 0 : eventDiscountAmount);
  
  const includeGst = config.includeGst === 'true';
  const gstRate = 0.18;
  const gstAmount = includeGst ? afterEventDiscount * gstRate : 0;
  const grandTotal = afterEventDiscount + gstAmount;
  
  const hasAnyReqDiscount = requirements && requirements.some(req => 
    req.req_discount === 'true' && Number(req.req_discount_amount ?? 0) > 0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            {config.logo && (
              <Image style={styles.logo} src={config.logo} />
            )}
          </View>
          
          <View style={styles.businessInfoCenter}>
            <Text style={styles.businessName}>{config.businessName}</Text>
            <Text style={styles.businessAddress}>
              {config.address}
            </Text>
            <Text style={styles.businessContact}>
              {config.phone && `${config.phone}`}
              {config.phone && config.email && ' | '}
              {config.email && `${config.email}`}
            </Text>
          </View>
          
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>{documentType}</Text>
          </View>
        </View>
        
        <View style={styles.headerLine} />
        
        <View style={styles.clientSection}>
          <View style={styles.toSection}>
            <Text style={styles.toLabel}>To,</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            {clientPhone && <Text style={styles.clientPhone}>{clientPhone}</Text>}
          </View>
          
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceLabel}>{documentType === 'Quotation' ? 'Quotation#' : 'Invoice#'}</Text>
              <Text style={styles.invoiceValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceLabel}>Date:</Text>
              <Text style={styles.invoiceValue}>{formatDate(invoiceDate)}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.greeting}>Dear Sir/Mam,</Text>
        <Text style={styles.introText}>
          {documentType === 'Quotation' 
            ? 'Thank you for your valuable inquiry. We are pleased to offer the following quotation:' 
            : 'Thank you for your valuable inquiry. We are pleased to invoice as below'}
        </Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, hasAnyReqDiscount ? styles.colNumWithDiscount : styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderCell, hasAnyReqDiscount ? styles.colDescWithDiscount : styles.colDesc]}>DESCRIPTION</Text>
            <Text style={[styles.tableHeaderCell, hasAnyReqDiscount ? styles.colQtyWithDiscount : styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, hasAnyReqDiscount ? styles.colPriceWithDiscount : styles.colPrice]}>PRICE</Text>
            {hasAnyReqDiscount && (
              <Text style={[styles.tableHeaderCell, styles.colDiscountWithDiscount]}>DISCOUNT</Text>
            )}
            <Text style={[styles.tableHeaderCell, hasAnyReqDiscount ? styles.colTotalWithDiscount : styles.colTotal]}>TOTAL</Text>
          </View>
          
          {requirements && requirements.length > 0 ? (
            requirements.map((req, index) => {
              const price = Number(req.price ?? 0);
              const quantity = Number(req.quantity ?? 1);
              const reqDiscountAmount = req.req_discount === 'true' ? Number(req.req_discount_amount ?? 0) : 0;
              
              const validPrice = isNaN(price) ? 0 : price;
              const validQuantity = isNaN(quantity) ? 1 : quantity;
              const validReqDiscount = isNaN(reqDiscountAmount) ? 0 : reqDiscountAmount;
              const validLineTotal = Math.max((validPrice * validQuantity) - validReqDiscount, 0);
              
              return (
                <View key={req.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colNumWithDiscount : styles.colNum]}>{index + 1}</Text>
                  <View style={hasAnyReqDiscount ? styles.colDescWithDiscount : styles.colDesc}>
                    <Text style={styles.descriptionMain}>{req.requirement}</Text>
                    {req.description && (
                      <Text style={styles.descriptionSub}>{req.description}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colQtyWithDiscount : styles.colQty]}>{validQuantity}</Text>
                  <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colPriceWithDiscount : styles.colPrice]}>{formatCurrency(validPrice)}</Text>
                  {hasAnyReqDiscount && (
                    <Text style={[styles.tableCell, styles.colDiscountWithDiscount]}>
                      {validReqDiscount > 0 ? formatCurrency(validReqDiscount) : '-'}
                    </Text>
                  )}
                  <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colTotalWithDiscount : styles.colTotal]}>{formatCurrency(validLineTotal)}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colNumWithDiscount : styles.colNum]}>1</Text>
              <View style={hasAnyReqDiscount ? styles.colDescWithDiscount : styles.colDesc}>
                <Text style={styles.descriptionMain}>{event.eventName}</Text>
                <Text style={styles.descriptionSub}>{event.providedService}</Text>
              </View>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colQtyWithDiscount : styles.colQty]}>1</Text>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colPriceWithDiscount : styles.colPrice]}>{formatCurrency(subtotal)}</Text>
              {hasAnyReqDiscount && (
                <Text style={[styles.tableCell, styles.colDiscountWithDiscount]}>-</Text>
              )}
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colTotalWithDiscount : styles.colTotal]}>{formatCurrency(subtotal)}</Text>
            </View>
          )}
          
          {eventDiscountAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colNumWithDiscount : styles.colNum]}></Text>
              <View style={hasAnyReqDiscount ? styles.colDescWithDiscount : styles.colDesc}>
                <Text style={styles.descriptionMain}>Event Discount</Text>
              </View>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colQtyWithDiscount : styles.colQty]}></Text>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colPriceWithDiscount : styles.colPrice]}></Text>
              {hasAnyReqDiscount && (
                <Text style={[styles.tableCell, styles.colDiscountWithDiscount]}></Text>
              )}
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colTotalWithDiscount : styles.colTotal]}>-{formatCurrency(eventDiscountAmount)}</Text>
            </View>
          )}
          
          {includeGst && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colNumWithDiscount : styles.colNum]}></Text>
              <View style={hasAnyReqDiscount ? styles.colDescWithDiscount : styles.colDesc}>
                <Text style={styles.descriptionMain}>GST (18%)</Text>
                {config.gstNumber && (
                  <Text style={styles.descriptionSub}>GST No: {config.gstNumber}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colQtyWithDiscount : styles.colQty]}></Text>
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colPriceWithDiscount : styles.colPrice]}></Text>
              {hasAnyReqDiscount && (
                <Text style={[styles.tableCell, styles.colDiscountWithDiscount]}></Text>
              )}
              <Text style={[styles.tableCell, hasAnyReqDiscount ? styles.colTotalWithDiscount : styles.colTotal]}>{formatCurrency(gstAmount)}</Text>
            </View>
          )}
          
          <View style={styles.grandTotalRow}>
            <Text style={hasAnyReqDiscount ? styles.grandTotalLabelWithDiscount : styles.grandTotalLabel}>GRAND TOTAL</Text>
            <Text style={hasAnyReqDiscount ? styles.grandTotalValueWithDiscount : styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>
        
        <Text style={styles.closingMessage}>
          We hope you find our offer to be in line with your requirement.
        </Text>
        
        <View style={styles.footerSection}>
          <View style={documentType === 'Quotation' ? { width: '100%' } : styles.termsColumn}>
            <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
            <Text style={styles.termsText}>
              {config.termsAndConditions || 
                'This quote is valid for 7 days, and a non-refundable 50% deposit is required to confirm your booking. The remaining balance is due 3 days before the event. Cancellations made within 48 hours of the event will be charged the full amount.'}
            </Text>
          </View>
          
          {documentType !== 'Quotation' && (
            <View style={styles.paymentColumn}>
              <Text style={styles.sectionTitle}>Payment Instructions</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentValue}>EBENESAR PAUL P</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentValue}>BANK OF MAHARASTRA</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentValue}>60223941368</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentValue}>MAHB0001206</Text>
              </View>
              {config.phone && (
                <View style={[styles.paymentRow, { marginTop: 6 }]}>
                  <Text style={styles.paymentLabel}>UPI ID:</Text>
                  <Text style={styles.paymentValue}>{config.phone}@okicici</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.forCompany}>For, {config.businessName?.toUpperCase() || 'DREAM DAY CREW'}</Text>
          {config.signatureImage && (
            <Image style={styles.signatureImage} src={config.signatureImage} />
          )}
          <View style={styles.signatureLine}>
            <Text style={styles.authorizedText}>AUTHORIZED SIGNATURE</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
