import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { type Configuration, type Event } from '@shared/schema';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 20,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
  },
  tableCol: {
    flex: 1,
  },
  tableColDescription: {
    flex: 3,
  },
  total: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.5,
  },
  divider: {
    borderTop: '1 solid #e5e7eb',
    marginVertical: 15,
  },
});

interface InvoiceTemplateProps {
  config: Configuration;
  event: Event;
  clientInfo: {
    name: string;
    contact: string;
    address: string;
    email: string;
  };
}

export const InvoiceTemplate = ({ config, event, clientInfo }: InvoiceTemplateProps) => {
  const invoiceDate = new Date().toLocaleDateString('en-IN');
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-IN');
  
  const subtotal = parseFloat(event.finalizedQuote || event.initialQuote || "0");
  const gstRate = 0.18; // 18% GST
  const gstAmount = subtotal * gstRate;
  const total = subtotal + gstAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Company Info */}
        <View style={styles.header}>
          {config.logo && (
            <Image style={styles.logo} src={config.logo} />
          )}
          <Text style={styles.companyName}>{config.businessName}</Text>
          <Text style={styles.companyInfo}>
            {config.address && `${config.address}\n`}
            {config.phone && `Phone: ${config.phone}\n`}
            {config.email && `Email: ${config.email}\n`}
            {config.gstNumber && `GST No: ${config.gstNumber}`}
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Invoice Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{invoiceDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Event Date:</Text>
            <Text style={styles.value}>{eventDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Venue:</Text>
            <Text style={styles.value}>{event.venue}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.value}>{clientInfo.name}</Text>
          <Text style={styles.label}>{clientInfo.address}</Text>
          <Text style={styles.label}>{clientInfo.contact}</Text>
          <Text style={styles.label}>{clientInfo.email}</Text>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableColDescription}>Description</Text>
              <Text style={styles.tableCol}>Service</Text>
              <Text style={styles.tableCol}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColDescription}>{event.eventName}</Text>
              <Text style={styles.tableCol}>{event.providedService}</Text>
              <Text style={styles.tableCol}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Total Calculation */}
        <View style={styles.total}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>GST (18%):</Text>
            <Text style={styles.value}>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        {config.termsAndConditions && (
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Terms & Conditions</Text>
            <Text style={styles.footerText}>{config.termsAndConditions}</Text>
          </View>
        )}

        {/* Footer Note */}
        <View style={{ marginTop: 20, paddingTop: 10, borderTop: '1 solid #e5e7eb' }}>
          <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
            Thank you for choosing {config.businessName}!
          </Text>
        </View>
      </Page>
    </Document>
  );
};
