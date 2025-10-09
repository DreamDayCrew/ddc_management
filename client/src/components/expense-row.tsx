import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

interface ExpenseRowProps {
  id: string;
  type: "Credit" | "Debit" | "Transfer";
  description: string;
  amount: string;
  mode?: string;
  date: string;
  status: string;
}

export function ExpenseRow({
  id,
  type,
  description,
  amount,
  mode,
  date,
  status,
}: ExpenseRowProps) {
  const typeConfig = {
    Credit: {
      icon: ArrowDownRight,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    Debit: {
      icon: ArrowUpRight,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    Transfer: {
      icon: ArrowLeftRight,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center justify-between p-4 hover-elevate rounded-lg border"
      data-testid={`expense-row-${id}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate" data-testid={`expense-description-${id}`}>
            {description}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground" data-testid={`expense-date-${id}`}>
              {format(new Date(date), "MMM dd, yyyy")}
            </span>
            {mode && (
              <span className="text-sm text-muted-foreground">• {mode}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span 
          className={`font-mono font-semibold ${config.color}`}
          data-testid={`expense-amount-${id}`}
        >
          {type === "Debit" ? "-" : "+"}₹{amount}
        </span>
        <Badge 
          variant={status === "Completed" ? "default" : "secondary"}
          data-testid={`expense-status-${id}`}
        >
          {status}
        </Badge>
      </div>
    </div>
  );
}
