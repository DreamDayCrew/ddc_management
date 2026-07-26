import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const INR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 16, borderBottom: "2 solid #1a1a2e" },
  headerLeft: { flex: 1 },
  logo: { width: 52, height: 52, marginBottom: 8 },
  businessName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  businessMeta: { fontSize: 9, lineHeight: 1.5, color: "#555" },
  headerRight: { alignItems: "flex-end" },
  reportTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 2, color: "#1a1a2e" },
  periodLabel: { fontSize: 10, color: "#555", marginTop: 4, textAlign: "right" },
  generatedLabel: { fontSize: 8, color: "#888", marginTop: 4, textAlign: "right" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingBottom: 5, borderBottom: "1 solid #ddd" },
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: "#f5f7fa", borderRadius: 6, padding: 12, border: "1 solid #e2e8f0" },
  summaryCardDark: { flex: 1, backgroundColor: "#1a1a2e", borderRadius: 6, padding: 12 },
  summaryCardLabel: { fontSize: 8, color: "#666", marginBottom: 6, textTransform: "uppercase" },
  summaryCardLabelLight: { fontSize: 8, color: "#aaa", marginBottom: 6, textTransform: "uppercase" },
  summaryCardValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  summaryCardValueLight: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#fff" },
  summaryCardSub: { fontSize: 8, color: "#888", marginTop: 4 },
  summaryCardSubLight: { fontSize: 8, color: "#aaa", marginTop: 4 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  statusPill: { flex: 1, borderRadius: 4, padding: 10, alignItems: "center" },
  statusPillLabel: { fontSize: 8, textTransform: "uppercase", marginBottom: 4 },
  statusPillValue: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  tableSection: { marginBottom: 28 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a1a2e", padding: "8 10", borderRadius: "3 3 0 0" },
  tableRow: { flexDirection: "row", padding: "7 10", borderBottom: "1 solid #eee" },
  tableRowAlt: { flexDirection: "row", padding: "7 10", backgroundColor: "#f9fafb", borderBottom: "1 solid #eee" },
  thText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#fff" },
  tdText: { fontSize: 9, color: "#333" },
  colEvent: { width: "30%" }, colDate: { width: "14%" }, colService: { width: "20%" },
  colStatus: { width: "14%" }, colAmount: { width: "14%", textAlign: "right" }, colPayment: { width: "8%", textAlign: "center" },
  statusCompleted: { color: "#16a34a" }, statusInProgress: { color: "#d97706" }, statusInquired: { color: "#2563eb" },
  serviceSection: { marginBottom: 28 },
  serviceRow: { flexDirection: "row", alignItems: "center", padding: "7 10", borderBottom: "1 solid #eee" },
  serviceRowAlt: { flexDirection: "row", alignItems: "center", padding: "7 10", backgroundColor: "#f9fafb", borderBottom: "1 solid #eee" },
  serviceBar: { height: 6, borderRadius: 3, marginTop: 4 },
  colSvcName: { width: "30%" }, colSvcCount: { width: "12%", textAlign: "center" }, colSvcRev: { width: "22%", textAlign: "right" }, colSvcPct: { width: "36%" },
  expenseRow: { flexDirection: "row", justifyContent: "space-between", padding: "8 12", borderBottom: "1 solid #eee" },
  expenseNetRow: { flexDirection: "row", justifyContent: "space-between", padding: "10 12", backgroundColor: "#f0fdf4" },
  expenseValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 8 },
  footerText: { fontSize: 8, color: "#aaa" },
});

export type PeriodReportServerData = {
  period: { start: string | null; end: string | null };
  summary: {
    totalEvents: number; completedEvents: number; inquiredEvents: number; inProgressEvents: number;
    totalRevenue: number; totalCredits: number; totalDebits: number; netProfit: number;
  };
  events: { id: string; eventName: string; eventDate: string; venue: string; service: string; status: string; quote: number; paymentStatus: string }[];
  expenseSummary: { totalCredits: number; totalDebits: number; totalTransfers: number };
  topServices: { service: string; count: number; revenue: number }[];
};

type Config = { businessName: string; logo?: string | null; address?: string | null; phone?: string | null; email?: string | null; signatureImage?: string | null };

export function PeriodReportServerTemplate({ data, config, periodLabel }: { data: PeriodReportServerData; config: Config; periodLabel: string }) {
  const { summary, events, expenseSummary, topServices } = data;
  const generatedOn = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const maxRevenue = Math.max(...topServices.map((s) => s.revenue), 1);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const statusStyle = (s: string) => s === "Completed" ? styles.statusCompleted : s === "In Progress" ? styles.statusInProgress : styles.statusInquired;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {config.logo && <Image style={styles.logo} src={config.logo} />}
            <Text style={styles.businessName}>{config.businessName}</Text>
            <Text style={styles.businessMeta}>{[config.address, config.phone, config.email].filter(Boolean).join("  •  ")}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Period Report</Text>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <Text style={styles.generatedLabel}>Generated: {generatedOn}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryCardLabel}>Total Revenue</Text><Text style={styles.summaryCardValue}>{INR(summary.totalRevenue)}</Text><Text style={styles.summaryCardSub}>from completed events</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryCardLabel}>Total Income</Text><Text style={styles.summaryCardValue}>{INR(summary.totalCredits)}</Text><Text style={styles.summaryCardSub}>credits received</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryCardLabel}>Total Expenses</Text><Text style={styles.summaryCardValue}>{INR(summary.totalDebits)}</Text><Text style={styles.summaryCardSub}>debits paid</Text></View>
          <View style={styles.summaryCardDark}><Text style={styles.summaryCardLabelLight}>Net Profit</Text><Text style={styles.summaryCardValueLight}>{INR(summary.netProfit)}</Text><Text style={styles.summaryCardSubLight}>income − expenses</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Event Summary</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: "#f0fdf4", border: "1 solid #bbf7d0" }]}><Text style={[styles.statusPillLabel, { color: "#16a34a" }]}>Completed</Text><Text style={[styles.statusPillValue, { color: "#16a34a" }]}>{summary.completedEvents}</Text></View>
          <View style={[styles.statusPill, { backgroundColor: "#fffbeb", border: "1 solid #fde68a" }]}><Text style={[styles.statusPillLabel, { color: "#d97706" }]}>In Progress</Text><Text style={[styles.statusPillValue, { color: "#d97706" }]}>{summary.inProgressEvents}</Text></View>
          <View style={[styles.statusPill, { backgroundColor: "#eff6ff", border: "1 solid #bfdbfe" }]}><Text style={[styles.statusPillLabel, { color: "#2563eb" }]}>Inquired</Text><Text style={[styles.statusPillValue, { color: "#2563eb" }]}>{summary.inquiredEvents}</Text></View>
          <View style={[styles.statusPill, { backgroundColor: "#f5f7fa", border: "1 solid #e2e8f0" }]}><Text style={[styles.statusPillLabel, { color: "#555" }]}>Total</Text><Text style={[styles.statusPillValue, { color: "#1a1a2e" }]}>{summary.totalEvents}</Text></View>
        </View>

        {events.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>Event Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colEvent]}>Event</Text>
              <Text style={[styles.thText, styles.colDate]}>Date</Text>
              <Text style={[styles.thText, styles.colService]}>Service</Text>
              <Text style={[styles.thText, styles.colStatus]}>Status</Text>
              <Text style={[styles.thText, styles.colAmount]}>Quote</Text>
              <Text style={[styles.thText, styles.colPayment]}>Paid</Text>
            </View>
            {events.map((ev, i) => (
              <View key={ev.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colEvent}><Text style={styles.tdText}>{ev.eventName}</Text><Text style={{ fontSize: 8, color: "#888" }}>{ev.venue}</Text></View>
                <Text style={[styles.tdText, styles.colDate]}>{fmtDate(ev.eventDate)}</Text>
                <Text style={[styles.tdText, styles.colService]}>{ev.service}</Text>
                <Text style={[styles.tdText, styles.colStatus, statusStyle(ev.status)]}>{ev.status}</Text>
                <Text style={[styles.tdText, styles.colAmount]}>{ev.quote > 0 ? INR(ev.quote) : "—"}</Text>
                <Text style={[styles.tdText, styles.colPayment, { color: ev.paymentStatus === "Completed" ? "#16a34a" : "#d97706" }]}>{ev.paymentStatus === "Completed" ? "✓" : "○"}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.footer} fixed><Text style={styles.footerText}>{config.businessName} • Period Report • {periodLabel}</Text><Text style={styles.footerText}>Confidential</Text></View>
      </Page>

      <Page size="A4" style={styles.page}>
        {topServices.length > 0 && (
          <View style={styles.serviceSection}>
            <Text style={styles.sectionTitle}>Services Breakdown</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colSvcName]}>Service</Text>
              <Text style={[styles.thText, styles.colSvcCount]}>Events</Text>
              <Text style={[styles.thText, styles.colSvcRev]}>Revenue</Text>
              <Text style={[styles.thText, styles.colSvcPct]}>Share</Text>
            </View>
            {topServices.map((svc, i) => {
              const pct = maxRevenue > 0 ? (svc.revenue / maxRevenue) * 100 : 0;
              return (
                <View key={svc.service} style={i % 2 === 0 ? styles.serviceRow : styles.serviceRowAlt}>
                  <Text style={[styles.tdText, styles.colSvcName]}>{svc.service}</Text>
                  <Text style={[styles.tdText, styles.colSvcCount]}>{svc.count}</Text>
                  <Text style={[styles.tdText, styles.colSvcRev]}>{svc.revenue > 0 ? INR(svc.revenue) : "—"}</Text>
                  <View style={styles.colSvcPct}><View style={[styles.serviceBar, { width: `${pct}%`, backgroundColor: "#1a1a2e" }]} /><Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>{pct.toFixed(0)}%</Text></View>
                </View>
              );
            })}
          </View>
        )}
        <View>
          <Text style={styles.sectionTitle}>Income & Expense Summary</Text>
          <View style={{ borderRadius: 6, overflow: "hidden", border: "1 solid #e2e8f0" }}>
            <View style={styles.expenseRow}><Text style={{ fontSize: 10, color: "#16a34a" }}>Total Credits (Income)</Text><Text style={[styles.expenseValue, { color: "#16a34a" }]}>{INR(expenseSummary.totalCredits)}</Text></View>
            <View style={styles.expenseRow}><Text style={{ fontSize: 10, color: "#dc2626" }}>Total Debits (Expenses)</Text><Text style={[styles.expenseValue, { color: "#dc2626" }]}>{INR(expenseSummary.totalDebits)}</Text></View>
            <View style={styles.expenseRow}><Text style={{ fontSize: 10, color: "#555" }}>Transfers</Text><Text style={styles.expenseValue}>{INR(expenseSummary.totalTransfers)}</Text></View>
            <View style={styles.expenseNetRow}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>Net Profit / Loss</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: summary.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>{summary.netProfit >= 0 ? "+" : ""}{INR(summary.netProfit)}</Text>
            </View>
          </View>
        </View>
        {config.signatureImage && (
          <View style={{ marginTop: 48, flexDirection: "row", justifyContent: "flex-end" }}>
            <View style={{ width: "40%", alignItems: "center" }}>
              <Image style={{ width: 100, height: 50, marginBottom: 6 }} src={config.signatureImage} />
              <View style={{ borderTop: "1 solid #000", width: "100%", paddingTop: 5 }}>
                <Text style={{ fontSize: 9, textAlign: "center" }}>{config.businessName}</Text>
                <Text style={{ fontSize: 8, textAlign: "center", color: "#888", marginTop: 2 }}>Authorized Signature</Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.footer} fixed><Text style={styles.footerText}>{config.businessName} • Period Report • {periodLabel}</Text><Text style={styles.footerText}>Confidential</Text></View>
      </Page>
    </Document>
  );
}
