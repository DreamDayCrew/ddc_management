import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ExpenseRowProps {
  id: string;
  type: "Credit" | "Debit" | "Transfer";
  description: string;
  amount: string;
  category?: string | null;
  mode?: string | null;
  date: string;
  status: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseRow({
  id,
  type,
  description,
  amount,
  category,
  mode,
  date,
  status,
  onEdit,
  onDelete,
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
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
              data-testid={`expense-type-${id}`}
            >
              {type}
            </span>
            {category && (
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                data-testid={`expense-category-${id}`}
              >
                {category}
              </span>
            )}
          </div>
          <h4 className="font-medium truncate mb-1" data-testid={`expense-description-${id}`}>
            {description}
          </h4>
          <div className="flex items-center gap-3">
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
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                data-testid={`button-edit-expense-${id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                data-testid={`button-delete-expense-${id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
