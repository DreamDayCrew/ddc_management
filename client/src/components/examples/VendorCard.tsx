import { VendorCard } from "../vendor-card";

export default function VendorCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
      <VendorCard
        id="1"
        name="Royal Decorators"
        category="Decoration"
        specialization="Wedding & Party Decoration"
        location="Mumbai, Maharashtra"
        contactInfo="9876543210"
        rating={5}
        onEdit={() => console.log("Edit vendor 1")}
      />
      <VendorCard
        id="2"
        name="SnapMoments Photography"
        category="Photography"
        specialization="Event & Wedding Photography"
        location="Delhi"
        contactInfo="contact@snapmoments.com"
        rating={4}
        onEdit={() => console.log("Edit vendor 2")}
      />
      <VendorCard
        id="3"
        name="Flavors Catering"
        category="Catering"
        specialization="Multi-cuisine Catering Services"
        location="Bangalore"
        contactInfo="7654321098"
        rating={5}
        onEdit={() => console.log("Edit vendor 3")}
      />
    </div>
  );
}
