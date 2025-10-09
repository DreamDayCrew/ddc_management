import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { AssetItem } from "@/components/asset-item";

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");

  const assetsData = [
    {
      id: "1",
      name: "LED Stage Lights (Set of 10)",
      category: "Audio System",
      quantity: 10,
      status: "Active",
      purchasedAmount: "45,000",
    },
    {
      id: "2",
      name: "Portable Sound System",
      category: "Audio System",
      quantity: 2,
      status: "Active",
      purchasedAmount: "85,000",
    },
    {
      id: "3",
      name: "Decorative Backdrop Panels",
      category: "Decoration",
      quantity: 15,
      status: "Active",
      purchasedAmount: "12,500",
    },
    {
      id: "4",
      name: "Folding Chairs (Set of 50)",
      category: "Furniture",
      quantity: 50,
      status: "Active",
      purchasedAmount: "30,000",
    },
    {
      id: "5",
      name: "Photography Equipment Kit",
      category: "Photography",
      quantity: 1,
      status: "Inactive",
      purchasedAmount: "1,25,000",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your assets
          </p>
        </div>
        <Button data-testid="button-add-asset">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-assets"
        />
      </div>

      <div className="space-y-3">
        {assetsData.map((asset) => (
          <AssetItem
            key={asset.id}
            {...asset}
            onEdit={() => console.log(`Edit asset ${asset.id}`)}
            onDelete={() => console.log(`Delete asset ${asset.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
