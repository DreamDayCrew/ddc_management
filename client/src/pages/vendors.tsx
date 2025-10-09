import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { VendorCard } from "@/components/vendor-card";

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");

  const vendorsData = [
    {
      id: "1",
      name: "Royal Decorators",
      category: "Decoration",
      specialization: "Wedding & Party Decoration",
      location: "Mumbai, Maharashtra",
      contactInfo: "9876543210",
      rating: 5,
    },
    {
      id: "2",
      name: "SnapMoments Photography",
      category: "Photography",
      specialization: "Event & Wedding Photography",
      location: "Delhi",
      contactInfo: "contact@snapmoments.com",
      rating: 4,
    },
    {
      id: "3",
      name: "Flavors Catering",
      category: "Catering",
      specialization: "Multi-cuisine Catering Services",
      location: "Bangalore",
      contactInfo: "7654321098",
      rating: 5,
    },
    {
      id: "4",
      name: "Sound & Light Pro",
      category: "Audio/Visual",
      specialization: "Professional Sound & Lighting",
      location: "Pune",
      contactInfo: "8765432109",
      rating: 4,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Vendors</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendor relationships and ratings
          </p>
        </div>
        <Button data-testid="button-add-vendor">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-vendors"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendorsData.map((vendor) => (
          <VendorCard
            key={vendor.id}
            {...vendor}
            onEdit={() => console.log(`Edit vendor ${vendor.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
