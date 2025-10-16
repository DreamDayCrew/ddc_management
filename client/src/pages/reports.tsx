import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

type BudgetReport = {
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  finalizedQuote: number;
  totalRequirementInvoiceValue: number;
  totalActualSpent: number;
  variance: number;
  variancePercentage: number;
  requirements: {
    id: string;
    name: string;
    invoiceValue: number;
    actualSpent: number;
    variance: number;
  }[];
};

export default function Reports() {
  const { data: reportsData, isLoading } = useQuery<BudgetReport[]>({
    queryKey: ["/api/reports/budget"],
  });

  // Sort reports by event date in descending order (newest first)
  const reports = useMemo(() => {
    if (!reportsData) return [];
    return [...reportsData].sort((a, b) => {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    });
  }, [reportsData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Budget Reports</h1>
          <p className="text-muted-foreground">
            Analyzing budget performance for completed events
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Budget Reports</h1>
          <p className="text-muted-foreground">
            Analyzing budget performance for completed events
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground text-center">
              No completed events found. Budget reports will appear here once events are marked as
              completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-reports">
          Budget Reports
        </h1>
        <p className="text-muted-foreground">
          Analyzing budget performance for completed events
        </p>
      </div>

      <div className="space-y-6">
        {reports.map((report: BudgetReport) => (
          <Card key={report.eventId} data-testid={`report-${report.eventId}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{report.eventName}</CardTitle>
                  <CardDescription>
                    {new Date(report.eventDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    • {report.venue}
                  </CardDescription>
                </div>
                <Badge
                  variant={report.variance >= 0 ? "default" : "destructive"}
                  className="flex items-center gap-1"
                  data-testid={`badge-variance-${report.eventId}`}
                >
                  {report.variance >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {report.variance >= 0 ? "Under Budget" : "Over Budget"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Finalized Quote</p>
                  <p className="text-2xl font-bold" data-testid={`quote-${report.eventId}`}>
                    {formatCurrency(report.finalizedQuote)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Invoice Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.totalRequirementInvoiceValue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Actual Spent</p>
                  <p className="text-2xl font-bold" data-testid={`spent-${report.eventId}`}>
                    {formatCurrency(report.totalActualSpent)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p
                    className={`text-2xl font-bold ${
                      report.variance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                    data-testid={`variance-${report.eventId}`}
                  >
                    {formatCurrency(Math.abs(report.variance))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({Math.abs(report.variancePercentage).toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Requirement Breakdown */}
              {report.requirements.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Requirement Breakdown
                  </h3>
                  <div className="space-y-2">
                    {report.requirements.map((req: { id: string; name: string; invoiceValue: number; actualSpent: number; variance: number }) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        data-testid={`requirement-${req.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{req.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Invoice: {formatCurrency(req.invoiceValue)} • Spent:{" "}
                            {formatCurrency(req.actualSpent)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              req.variance >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {req.variance >= 0 ? "+" : ""}
                            {formatCurrency(req.variance)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.variance >= 0 ? "saved" : "over"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
