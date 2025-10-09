import { AssetItem } from "../asset-item";

export default function AssetItemExample() {
  return (
    <div className="space-y-3 p-6 max-w-2xl">
      <AssetItem
        id="1"
        name="LED Stage Lights (Set of 10)"
        category="Audio System"
        quantity={10}
        status="Active"
        purchasedAmount="45,000"
        onEdit={() => console.log("Edit asset 1")}
        onDelete={() => console.log("Delete asset 1")}
      />
      <AssetItem
        id="2"
        name="Portable Sound System"
        category="Audio System"
        quantity={2}
        status="Active"
        purchasedAmount="85,000"
        onEdit={() => console.log("Edit asset 2")}
        onDelete={() => console.log("Delete asset 2")}
      />
      <AssetItem
        id="3"
        name="Decorative Backdrop Panels"
        category="Decoration"
        quantity={15}
        status="Inactive"
        purchasedAmount="12,500"
        onEdit={() => console.log("Edit asset 3")}
        onDelete={() => console.log("Delete asset 3")}
      />
    </div>
  );
}
