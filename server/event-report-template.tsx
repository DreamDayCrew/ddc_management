import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Event, Requirement, FulfillmentPlan, Configuration, Expense } from '@shared/schema';

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
  
  colNum: { width: '5%', textAlign: 'center' },
  colReq: { width: '30%', paddingRight: 4 },
  colPlans: { width: '25%', paddingRight: 4 },
  colInvoice: { width: '20%', textAlign: 'right', paddingRight: 4 },
  colSpent: { width: '20%', textAlign: 'right' },
  
  planDetail: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },
  
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
    fontWeight: 'bold',
    color: '#333',
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND_MAROON,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_MAROON,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_MAROON,
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  
  variancePositive: {
    color: '#16a34a',
  },
  varianceNegative: {
    color: '#dc2626',
  },
});

const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed': return '#16a34a';
    case 'In Progress': return '#2563eb';
    case 'Inquired': return '#f59e0b';
    case 'Paid': return '#16a34a';
    case 'Partial': return '#f59e0b';
    default: return '#6b7280';
  }
};

interface RequirementWithPlans extends Requirement {
  plans: FulfillmentPlan[];
}

interface EventReportProps {
  event: Event;
  requirements: RequirementWithPlans[];
  configuration: Configuration | null;
  eventExpense: Expense | null;
}

export const EventReportTemplate: React.FC<EventReportProps> = ({
  event,
  requirements,
  configuration,
  eventExpense,
}) => {
  const totalInvoiceAmount = requirements.reduce((sum, req) => {
    const price = Number(req.price || 0);
    const quantity = Number(req.quantity || 1);
    const discount = Number(req.req_discount_amount || 0);
    const lineTotal = Math.max((price * quantity) - discount, 0);
    return sum + lineTotal;
  }, 0);
  
  const totalSpentAmount = requirements.reduce((sum, req) => {
    return sum + req.plans.reduce((planSum, plan) => {
      return planSum + Number(plan.payment || 0);
    }, 0);
  }, 0);
  
  const eventDiscount = Number(event.discount_amount || 0);
  const finalizedQuote = Number(event.finalizedQuote || 0);
  const paidAmount = Number(eventExpense?.amount || 0);
  const balanceDue = finalizedQuote - paidAmount;
  const variance = finalizedQuote - totalSpentAmount;
  
  const getPlanDescription = (plan: FulfillmentPlan): string => {
    if (plan.planType === 'Vendor') {
      return `Vendor: ${plan.vendorCategory || 'N/A'}`;
    } else if (plan.planType === 'Team') {
      return `Team: ${plan.teamRole || 'N/A'}`;
    } else if (plan.planType === 'Asset') {
      return `Asset: ${plan.assetName || plan.assetCategory || 'N/A'}`;
    }
    return plan.planType;
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
            <Text style={styles.reportTitle}>EVENT REPORT</Text>
            <Text style={styles.reportSubtitle}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>
        
        <View style={styles.headerLine} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Event Name</Text>
              <Text style={styles.infoValue}>{event.eventName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{event.providedService}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Event Date</Text>
              <Text style={styles.infoValue}>{formatDate(event.eventDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{event.venue}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Event Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.eventStatus) }]}>
                <Text style={styles.statusText}>{event.eventStatus}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Registered On</Text>
              <Text style={styles.infoValue}>{formatDate(event.registeredOn)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Client Name</Text>
              <Text style={styles.infoValue}>{event.clientName || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{event.clientPhone || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{event.clientEmail || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{event.clientAddress || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Source</Text>
              <Text style={styles.infoValue}>{event.source || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Finalized Quote</Text>
              <Text style={styles.infoValue}>{formatCurrency(finalizedQuote)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.paymentStatus) }]}>
                <Text style={styles.statusText}>{event.paymentStatus}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Amount Received</Text>
              <Text style={styles.infoValue}>{formatCurrency(paidAmount)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Balance Due</Text>
              <Text style={[styles.infoValue, balanceDue > 0 ? styles.varianceNegative : {}]}>
                {formatCurrency(balanceDue)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Mode</Text>
              <Text style={styles.infoValue}>{event.paymentMode || 'N/A'}</Text>
            </View>
            {eventDiscount > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Discount Applied</Text>
                <Text style={styles.infoValue}>{formatCurrency(eventDiscount)}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements & Planning</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colReq]}>Requirement</Text>
              <Text style={[styles.tableHeaderCell, styles.colPlans]}>Plans</Text>
              <Text style={[styles.tableHeaderCell, styles.colInvoice]}>Invoice Amt</Text>
              <Text style={[styles.tableHeaderCell, styles.colSpent]}>Spent Amt</Text>
            </View>
            
            {requirements.map((req, index) => {
              const price = Number(req.price || 0);
              const quantity = Number(req.quantity || 1);
              const discount = Number(req.req_discount_amount || 0);
              const reqInvoice = Math.max((price * quantity) - discount, 0);
              const reqSpent = req.plans.reduce((sum, p) => sum + Number(p.payment || 0), 0);
              
              return (
                <View key={req.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
                  <View style={styles.colReq}>
                    <Text style={styles.tableCell}>{req.requirement}</Text>
                    {req.description && (
                      <Text style={styles.planDetail}>{req.description}</Text>
                    )}
                  </View>
                  <View style={styles.colPlans}>
                    {req.plans.length > 0 ? (
                      req.plans.map((plan, pIndex) => (
                        <Text key={plan.id} style={styles.planDetail}>
                          {getPlanDescription(plan)} - {formatCurrency(plan.payment)}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.planDetail}>No plans</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCell, styles.colInvoice]}>{formatCurrency(reqInvoice)}</Text>
                  <Text style={[styles.tableCell, styles.colSpent]}>{formatCurrency(reqSpent)}</Text>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Summary</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Invoice Amount (Requirements)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalInvoiceAmount)}</Text>
            </View>
            {eventDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Event Discount</Text>
                <Text style={[styles.summaryValue, styles.varianceNegative]}>-{formatCurrency(eventDiscount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Finalized Quote</Text>
              <Text style={styles.summaryValue}>{formatCurrency(finalizedQuote)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Spent (Fulfillment Plans)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSpentAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Received from Client</Text>
              <Text style={styles.summaryValue}>{formatCurrency(paidAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Profit / Loss (Quote - Spent)</Text>
              <Text style={[styles.totalValue, variance >= 0 ? styles.variancePositive : styles.varianceNegative]}>
                {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
              </Text>
            </View>
          </View>
        </View>
        
        {event.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 10, color: '#333', lineHeight: 1.5 }}>{event.notes}</Text>
          </View>
        )}
        
        <Text style={styles.footer}>
          Generated on {formatDate(new Date().toISOString())} | {configuration?.businessName || 'Dream Day Crew'} | Confidential
        </Text>
      </Page>
    </Document>
  );
};

export const ServerEventReportTemplate = EventReportTemplate;
