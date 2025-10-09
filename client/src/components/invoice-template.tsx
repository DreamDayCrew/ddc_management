import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { type Configuration, type Event, type Requirement } from '@shared/schema';

// Define styles matching the uploaded template
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  businessInfo: {
    marginBottom: 30,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  businessText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billToSection: {
    flex: 1,
    marginRight: 20,
  },
  invoiceDetailsSection: {
    width: 200,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  clientText: {
    fontSize: 10,
    lineHeight: 1.3,
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 10,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #000',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1 solid #ddd',
  },
  colDescription: {
    width: '45%',
  },
  colQty: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '20%',
    textAlign: 'right',
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
  },
  totalValue: {
    fontSize: 11,
  },
  grandTotal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  divider: {
    borderTop: '1 solid #000',
    marginVertical: 8,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
  },
  signatureLabel: {
    fontSize: 10,
    marginBottom: 40,
  },
  signatureLine: {
    borderTop: '1 solid #000',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 9,
    textAlign: 'center',
  },
  signatureImage: {
    width: 100,
    height: 50,
    marginBottom: 5,
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
});

interface InvoiceTemplateProps {
  config: Configuration;
  event: Event;
  requirements: Requirement[];
  invoiceNumber?: string;
}

export const InvoiceTemplate = ({ config, event, requirements, invoiceNumber = 'INV00001' }: InvoiceTemplateProps) => {
  const invoiceDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  // Calculate due date (7 days from invoice date)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const dueDateStr = dueDate.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Get client info from separate fields or fallback to clientInfo
  const clientName = event.clientName || '';
  const clientPhone = event.clientPhone || '';
  const clientAddress = event.clientAddress || '';
  const clientEmail = event.clientEmail || '';

  // Calculate totals
  const subtotal = parseFloat(event.finalizedQuote || event.initialQuote || "0");
  const includeGst = config.includeGst === "true";
  const gstRate = 0.18; // 18% GST
  const gstAmount = includeGst ? subtotal * gstRate : 0;
  const total = subtotal + gstAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Business Info */}
        <View style={styles.businessInfo}>
          {config.logo && (
            <Image style={styles.logo} src={config.logo} />
          )}
          <Text style={styles.businessName}>{config.businessName}</Text>
          <Text style={styles.businessText}>
            {config.address && `${config.address}\n`}
            {config.phone && `${config.phone}\n`}
            {config.email && `${config.email}\n`}
            {config.website && `${config.website}`}
          </Text>
        </View>

        {/* Bill To and Invoice Details */}
        <View style={styles.twoColumns}>
          {/* Bill To */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            {clientName && <Text style={styles.clientText}>{clientName}</Text>}
            {clientAddress && <Text style={styles.clientText}>{clientAddress}</Text>}
            {clientPhone && <Text style={styles.clientText}>{clientPhone}</Text>}
            {clientEmail && <Text style={styles.clientText}>{clientEmail}</Text>}
          </View>

          {/* Invoice Details */}
          <View style={styles.invoiceDetailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>INVOICE #</Text>
              <Text style={styles.detailValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE</Text>
              <Text style={styles.detailValue}>{invoiceDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DUE DATE</Text>
              <Text style={styles.detailValue}>{dueDateStr}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.headerText]}>Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>QTY</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
            <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          </View>

          {/* If no requirements, show the event as a single line */}
          {requirements.length === 0 ? (
            <View style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text style={{ fontWeight: 'bold' }}>{event.eventName}</Text>
                <Text style={{ fontSize: 9, marginTop: 2 }}>{event.providedService}</Text>
              </View>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colPrice}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.colAmount}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          ) : (
            // Show each requirement as a line item
            requirements.map((req, index) => {
              const amount = parseFloat(String(req.order) || "0");
              return (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.colDescription}>
                    <Text>{req.requirement}</Text>
                  </View>
                  <Text style={styles.colQty}>1</Text>
                  <Text style={styles.colPrice}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  <Text style={styles.colAmount}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          
          {includeGst && config.gstNumber && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST (18%):</Text>
                <Text style={styles.totalValue}>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 9 }}>GST No: {config.gstNumber}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total:</Text>
            <Text style={styles.grandTotal}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        {config.termsAndConditions && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{config.termsAndConditions}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Date: _______________</Text>
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
      </Page>
    </Document>
  );
};
