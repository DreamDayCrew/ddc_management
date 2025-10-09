import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2 } from "lucide-react";

interface AssetItemProps {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  purchasedAmount?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AssetItem({
  id,
  name,
  category,
  quantity,
  status,
  purchasedAmount,
  onEdit,
  onDelete,
}: AssetItemProps) {
  return (
    <Card data-testid={`asset-item-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" data-testid={`asset-name-${id}`}>{name}</h3>
              <p className="text-sm text-muted-foreground">{category}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm">Qty: <span className="font-medium" data-testid={`asset-quantity-${id}`}>{quantity}</span></span>
                {purchasedAmount && (
                  <span className="text-sm">Amount: <span className="font-medium font-mono">₹{purchasedAmount}</span></span>
                )}
                <Badge variant={status === "Active" ? "default" : "secondary"} data-testid={`asset-status-${id}`}>
                  {status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onEdit}
              data-testid={`button-edit-asset-${id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onDelete}
              data-testid={`button-delete-asset-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
