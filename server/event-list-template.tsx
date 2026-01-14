import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Svg, Path, Circle, G } from '@react-pdf/renderer';
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
    marginTop: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  pieChartWrapper: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    color: '#333',
  },
  legendCount: {
    fontSize: 9,
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

// Pie chart colors
const PIE_COLORS = [
  '#800020', // Maroon
  '#4a90e2', // Blue
  '#f5a623', // Orange
  '#7ed321', // Green
  '#bd10e0', // Purple
  '#50e3c2', // Teal
  '#ff6b6b', // Red
  '#4ecdc4', // Cyan
  '#ffe66d', // Yellow
  '#a8e6cf', // Mint
];

const createPieChart = (data: ServiceStats[], size: number = 120) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return null;

  let currentAngle = -90; // Start from top
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 5;

  const slices = data.map((item, index) => {
    const percentage = item.count / total;
    const angle = percentage * 360;
    const startAngle = (currentAngle * Math.PI) / 180;
    const endAngle = ((currentAngle + angle) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    currentAngle += angle;

    return {
      path: pathData,
      color: PIE_COLORS[index % PIE_COLORS.length],
      service: item.service,
      count: item.count,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return slices;
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
    // Define base columns with relative weights (not percentages yet)
    const colDefs: { key: string; label: string; weight: number }[] = [
      { key: 'sno', label: '#', weight: 3 },
      { key: 'eventName', label: 'Event Name', weight: 18 },
      { key: 'service', label: 'Service', weight: 14 },
    ];

    if (options.includeCustomerInfo) {
      colDefs.push({ key: 'customerName', label: 'Customer', weight: 12 });
      colDefs.push({ key: 'customerPhone', label: 'Phone', weight: 11 });
    }

    if (options.includeEventInfo) {
      colDefs.push({ key: 'venue', label: 'Venue', weight: 15 });
      colDefs.push({ key: 'eventDate', label: 'Date', weight: 9 });
      colDefs.push({ key: 'status', label: 'Status', weight: 9 });
    }

    if (options.includePaymentInfo) {
      colDefs.push({ key: 'invoice', label: 'Invoice', weight: 10 });
      colDefs.push({ key: 'paymentStatus', label: 'Payment', weight: 9 });
      colDefs.push({ key: 'ddcSpent', label: 'DDC Spent', weight: 10 });
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
              Events Report
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
              {columns.map((col) => {
                let content = '-';
                
                switch (col.key) {
                  case 'sno':
                    content = String(index + 1);
                    break;
                  case 'eventName':
                    content = event.eventName;
                    break;
                  case 'service':
                    content = event.providedService;
                    break;
                  case 'customerName':
                    content = event.clientName || '-';
                    break;
                  case 'customerPhone':
                    content = event.clientPhone || '-';
                    break;
                  case 'venue':
                    content = event.venue;
                    break;
                  case 'eventDate':
                    content = formatDate(event.eventDate);
                    break;
                  case 'status':
                    content = event.eventStatus;
                    break;
                  case 'invoice':
                    content = formatCurrency(event.invoiceValue);
                    break;
                  case 'paymentStatus':
                    content = event.paymentStatus;
                    break;
                  case 'ddcSpent':
                    content = formatCurrency(event.ddcSpent);
                    break;
                }

                return (
                  <View key={col.key} style={col.style}>
                    <Text style={styles.tableCell}>{content}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {options.includeStats && serviceStats.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Events by Service Type</Text>
            <View style={styles.chartContainer}>
              <View style={styles.pieChartWrapper}>
                <Svg width={120} height={120}>
                  {createPieChart(serviceStats, 120)?.map((slice, index) => (
                    <Path
                      key={index}
                      d={slice.path}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Svg>
              </View>
              <View style={styles.legendContainer}>
                {createPieChart(serviceStats, 120)?.map((slice, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
                    <Text style={styles.legendText}>
                      {slice.service.length > 20 ? slice.service.substring(0, 20) + '...' : slice.service}:
                    </Text>
                    <Text style={styles.legendCount}>
                      {slice.count} ({slice.percentage}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

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
