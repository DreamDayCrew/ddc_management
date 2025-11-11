import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { type Configuration, type Event, type Requirement } from '@shared/schema';

// Professional styles matching the reference PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff', // White background
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align logo and title on same line
    marginBottom: 20,
  },
  logoSection: {
    flex: 1,
  },
  invoiceTitleSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  
  // Items Table
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#800020',
    padding: 10,
    borderRadius: 3,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottom: '1 solid #e8e8e8',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  
  // Table Columns
  colDescription: {
    width: '48%',
    paddingRight: 10,
  },
  colQty: {
    width: '12%',
    textAlign: 'center',
  },
  colPrice: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5,
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
  },
  
  // Description Styling
  itemName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  
  // Totals Section
  totalsContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 250,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
  },
  totalRowWithBorder: {
    borderBottom: '1 solid #ddd',
  },
  totalLabel: {
    fontSize: 10,
    color: '#555',
  },
  totalValue: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  gstRow: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTop: '2 solid #800020',
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800020',
  },
  
  // Payment Information
  paymentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff9e6',
    borderLeft: '4 solid #f39c12',
    borderRadius: 3,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  paymentDetails: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#555',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  paymentValue: {
    flex: 1,
    color: '#333',
  },
  
  // Terms & Conditions
  termsSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  termsText: {
    fontSize: 8,
    lineHeight: 1.6,
    color: '#555',
  },
  
  // Signature Section
  signatureContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 35,
    color: '#555',
  },
  signatureLine: {
    borderTop: '1 solid #333',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#666',
  },
  signatureImage: {
    width: 100,
    height: 40,
    marginBottom: 5,
  },
  
  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #ddd',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
});

// Utility functions
const formatCurrency = (amount: number): string => {
  // Format number manually to avoid PDF rendering issues with toLocaleString
  const fixedAmount = amount.toFixed(2);
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  // Add thousand separators manually
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `₹${formattedInteger}.${decimalPart}`;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

interface InvoiceTemplateProps {
  config: Configuration;
  event: Event;
  requirements: Requirement[];
  invoiceNumber?: string;
}

export const InvoiceTemplate = ({ 
  config, 
  event, 
  requirements, 
  invoiceNumber = 'INV00001' 
}: InvoiceTemplateProps) => {
  // Date calculations
  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days payment term
  
  // Client information
  const clientName = event.clientName || 'Customer';
  const clientPhone = event.clientPhone || '';
  const clientAddress = event.clientAddress || '';
  const clientEmail = event.clientEmail || '';
  
  // Calculate totals from requirements
  let subtotal = 0;
  
  if (requirements && requirements.length > 0) {
    // Sum up all requirement amounts (price × quantity)
    subtotal = requirements.reduce((sum, req) => {
      const price = Number(req.price ?? 0);
      const quantity = Number(req.quantity ?? 1);
      // Guard against NaN
      const validPrice = isNaN(price) ? 0 : price;
      const validQuantity = isNaN(quantity) ? 1 : quantity;
      return sum + (validPrice * validQuantity);
    }, 0);
  } else {
    // If no requirements, use the finalized or initial quote
    const fallbackQuote = Number(event.finalizedQuote ?? event.initialQuote ?? 0);
    subtotal = isNaN(fallbackQuote) ? 0 : fallbackQuote;
  }
  
  // GST calculations - includeGst is stored as text in database
  const includeGst = config.includeGst === 'true';
  const gstRate = 0.18; // 18% GST
  const gstAmount = includeGst ? subtotal * gstRate : 0;
  const grandTotal = subtotal + gstAmount;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo on Left and Invoice Title on Right */}
        <View style={styles.header}>
          {/* Logo Section - Left */}
          <View style={styles.logoSection}>
            {config.logo && (
              <Image style={styles.logo} src={config.logo} />
            )}
          </View>
          
          {/* Invoice Title - Right */}
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
        </View>
        
        <View style={styles.headerDivider} />
        
        {/* Business Information */}
        <View style={styles.businessSection}>
          <Text style={styles.businessName}>{config.businessName}</Text>
          <Text style={styles.businessDetails}>
            {config.address && `${config.address}\n`}
            {config.phone && `Phone: ${config.phone}\n`}
            {config.email && `Email: ${config.email}\n`}
            {config.website && `Website: ${config.website}`}
          </Text>
        </View>
        
        {/* Bill To and Invoice Details */}
        <View style={styles.twoColumns}>
          {/* Bill To Section */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientInfo}>
              {clientName && `${clientName}\n`}
              {clientAddress && `${clientAddress}\n`}
              {clientPhone && `${clientPhone}\n`}
              {clientEmail && clientEmail}
            </Text>
          </View>
          
          {/* Invoice Details */}
          <View style={styles.invoiceDetailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #:</Text>
              <Text style={styles.detailValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoiceDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={styles.detailValue}>{formatDate(dueDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Event Date:</Text>
              <Text style={styles.detailValue}>{formatDate(event.eventDate)}</Text>
            </View>
          </View>
        </View>
        
        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Unit Price</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          
          {/* Table Rows */}
          {requirements && requirements.length > 0 ? (
            requirements.map((req, index) => {
              const price = Number(req.price ?? 0);
              const quantity = Number(req.quantity ?? 1);
              // Guard against NaN
              const validPrice = isNaN(price) ? 0 : price;
              const validQuantity = isNaN(quantity) ? 1 : quantity;
              const amount = validPrice * validQuantity;
              
              return (
                <View 
                  key={req.id || index} 
                  style={[
                    styles.tableRow, 
                    ...(index % 2 === 1 ? [styles.tableRowAlt] : [])
                  ]}
                >
                  <View style={styles.colDescription}>
                    <Text style={styles.itemName}>{req.requirement}</Text>
                    {req.description && (
                      <Text style={styles.itemDescription}>{req.description}</Text>
                    )}
                  </View>
                  <Text style={styles.colQty}>{validQuantity}</Text>
                  <Text style={styles.colPrice}>{formatCurrency(validPrice)}</Text>
                  <Text style={styles.colAmount}>{formatCurrency(amount)}</Text>
                </View>
              );
            })
          ) : (
            // Fallback: Show event as single line item
            <View style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text style={styles.itemName}>{event.eventName}</Text>
                <Text style={styles.itemDescription}>{event.providedService}</Text>
              </View>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colPrice}>{formatCurrency(subtotal)}</Text>
              <Text style={styles.colAmount}>{formatCurrency(subtotal)}</Text>
            </View>
          )}
        </View>
        
        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={[styles.totalRow, styles.totalRowWithBorder]}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {includeGst && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST (18%):</Text>
                  <Text style={styles.totalValue}>{formatCurrency(gstAmount)}</Text>
                </View>
                {config.gstNumber && (
                  <Text style={styles.gstRow}>GST No: {config.gstNumber}</Text>
                )}
              </>
            )}
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>
        
        {/* Payment Information - Keep on same page */}
        <View style={styles.paymentSection} wrap={false}>
          <Text style={styles.paymentTitle}>Payment Information</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Mode:</Text>
              <Text style={styles.paymentValue}>
                {event.paymentMode || 'Bank Transfer / UPI / Cash'}
              </Text>
            </View>
            {config.phone && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>UPI ID:</Text>
                <Text style={styles.paymentValue}>{config.phone}@paytm</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Terms:</Text>
              <Text style={styles.paymentValue}>Payment due within 7 days</Text>
            </View>
            <Text style={{ fontSize: 8, marginTop: 8, color: '#e67e22', fontWeight: 'bold' }}>
              Please make payment by {formatDate(dueDate)}
            </Text>
          </View>
        </View>
        
        {/* Terms & Conditions */}
        {config.termsAndConditions && (
          <View style={styles.termsSection} wrap={false}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{config.termsAndConditions}</Text>
          </View>
        )}
        
        {/* Signature Section */}
        <View style={styles.signatureContainer} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Signature & Date</Text>
            </View>
          </View>
          
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            {config.signatureImage && (
              <Image style={styles.signatureImage} src={config.signatureImage} />
            )}
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>{config.businessName}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! | {config.businessName}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
