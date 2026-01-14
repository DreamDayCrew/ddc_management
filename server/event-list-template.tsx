import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Event, Configuration } from '@shared/schema';

const BRAND_MAROON = '#800020';

interface EventWithFinancials extends Event {
  invoiceValue?: number;
  ddcSpent?: number;
}

interface ServiceStats {
  service: string;
  count: number;
}

interface EventListPdfOptions {
  includeCustomerInfo: boolean;
  includeEventInfo: boolean;
  includePaymentInfo: boolean;
  includeStats: boolean;
}

interface EventListFilters {
  serviceType: string;
  eventStatus: string;
  paymentStatus: string;
}

interface EventListTemplateProps {
  events: EventWithFinancials[];
  config: Configuration;
  options: EventListPdfOptions;
  filters: EventListFilters;
  serviceStats: ServiceStats[];
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
    marginBottom: 15,
  },
  headerLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 15,
  },
  logoContainer: {
    width: 60,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  businessInfoCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 8,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  documentTitleContainer: {
    width: 120,
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  documentSubtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  
  summarySection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#555',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  statsSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '33%',
    marginBottom: 6,
    paddingRight: 8,
  },
  statService: {
    fontSize: 8,
    color: '#555',
  },
  statCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BRAND_MAROON,
  },
  
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_MAROON,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 20,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  
  colSno: { width: '4%' },
  colEventName: { width: '15%' },
  colService: { width: '12%' },
  colCustomerName: { width: '10%' },
  colCustomerPhone: { width: '10%' },
  colCustomerEmail: { width: '12%' },
  colVenue: { width: '12%' },
  colEventDate: { width: '8%' },
  colStatus: { width: '8%' },
  colInvoice: { width: '9%' },
  colPaymentStatus: { width: '8%' },
  colDdcSpent: { width: '9%' },
  
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#666',
  },
  pageNumber: {
    fontSize: 7,
    color: '#666',
  },
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '-';
  return `Rs.${amount.toLocaleString('en-IN')}`;
};

export function EventListTemplate({
  events,
  config,
  options,
  filters,
  serviceStats,
  generatedDate,
}: EventListTemplateProps) {
  const totalEvents = events.length;
  const totalInvoiceValue = events.reduce((sum, e) => sum + (e.invoiceValue || 0), 0);
  const totalDdcSpent = events.reduce((sum, e) => sum + (e.ddcSpent || 0), 0);
  const paidEvents = events.filter(e => e.paymentStatus === 'Paid').length;
  const pendingEvents = events.filter(e => e.paymentStatus === 'Pending').length;
  const partialEvents = events.filter(e => e.paymentStatus === 'Partial').length;

  const getTableColumns = () => {
    const cols: { key: string; label: string; style: any }[] = [
      { key: 'sno', label: '#', style: styles.colSno },
      { key: 'eventName', label: 'Event Name', style: styles.colEventName },
      { key: 'service', label: 'Service', style: styles.colService },
    ];

    if (options.includeCustomerInfo) {
      cols.push({ key: 'customerName', label: 'Customer', style: styles.colCustomerName });
      cols.push({ key: 'customerPhone', label: 'Phone', style: styles.colCustomerPhone });
    }

    if (options.includeEventInfo) {
      cols.push({ key: 'venue', label: 'Venue', style: styles.colVenue });
      cols.push({ key: 'eventDate', label: 'Date', style: styles.colEventDate });
      cols.push({ key: 'status', label: 'Status', style: styles.colStatus });
    }

    if (options.includePaymentInfo) {
      cols.push({ key: 'invoice', label: 'Invoice', style: styles.colInvoice });
      cols.push({ key: 'paymentStatus', label: 'Payment', style: styles.colPaymentStatus });
      cols.push({ key: 'ddcSpent', label: 'DDC Spent', style: styles.colDdcSpent });
    }

    return cols;
  };

  const columns = getTableColumns();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            {config.logo && <Image src={config.logo} style={styles.logo} />}
          </View>
          <View style={styles.businessInfoCenter}>
            <Text style={styles.businessName}>{config.businessName || 'Dream Day Crew'}</Text>
            <Text style={styles.businessAddress}>{config.address}</Text>
          </View>
          <View style={styles.documentTitleContainer}>
            <Text style={styles.documentTitle}>
              {filters.eventStatus === 'all' ? 'ALL EVENTS' : `${filters.eventStatus.toUpperCase()} EVENTS`}
            </Text>
            <Text style={styles.documentSubtitle}>Generated: {generatedDate}</Text>
            {(filters.serviceType !== 'all' || filters.paymentStatus !== 'all') && (
              <Text style={styles.documentSubtitle}>
                {filters.serviceType !== 'all' ? `Service: ${filters.serviceType.substring(0, 20)}...` : ''}
                {filters.paymentStatus !== 'all' ? ` | Payment: ${filters.paymentStatus}` : ''}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.headerLine} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Events:</Text>
            <Text style={styles.summaryValue}>{totalEvents}</Text>
          </View>
          {options.includePaymentInfo && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Invoice Value:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalInvoiceValue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total DDC Spent:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalDdcSpent)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Status:</Text>
                <Text style={styles.summaryValue}>
                  Paid: {paidEvents} | Partial: {partialEvents} | Pending: {pendingEvents}
                </Text>
              </View>
            </>
          )}
        </View>

        {options.includeStats && serviceStats.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Events by Service Type</Text>
            <View style={styles.statsGrid}>
              {serviceStats.map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <Text style={styles.statService}>{stat.service}</Text>
                  <Text style={styles.statCount}>{stat.count} events</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {columns.map((col) => (
              <View key={col.key} style={col.style}>
                <Text style={styles.tableHeaderText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {events.map((event, index) => (
            <View
              key={event.id}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <View style={styles.colSno}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.colEventName}>
                <Text style={styles.tableCell}>{event.eventName}</Text>
              </View>
              <View style={styles.colService}>
                <Text style={styles.tableCell}>{event.providedService}</Text>
              </View>

              {options.includeCustomerInfo && (
                <>
                  <View style={styles.colCustomerName}>
                    <Text style={styles.tableCell}>{event.clientName || '-'}</Text>
                  </View>
                  <View style={styles.colCustomerPhone}>
                    <Text style={styles.tableCell}>{event.clientPhone || '-'}</Text>
                  </View>
                </>
              )}

              {options.includeEventInfo && (
                <>
                  <View style={styles.colVenue}>
                    <Text style={styles.tableCell}>{event.venue}</Text>
                  </View>
                  <View style={styles.colEventDate}>
                    <Text style={styles.tableCell}>{formatDate(event.eventDate)}</Text>
                  </View>
                  <View style={styles.colStatus}>
                    <Text style={styles.tableCell}>{event.eventStatus}</Text>
                  </View>
                </>
              )}

              {options.includePaymentInfo && (
                <>
                  <View style={styles.colInvoice}>
                    <Text style={styles.tableCell}>{formatCurrency(event.invoiceValue)}</Text>
                  </View>
                  <View style={styles.colPaymentStatus}>
                    <Text style={styles.tableCell}>{event.paymentStatus}</Text>
                  </View>
                  <View style={styles.colDdcSpent}>
                    <Text style={styles.tableCell}>{formatCurrency(event.ddcSpent)}</Text>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{config.businessName || 'Dream Day Crew'}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
