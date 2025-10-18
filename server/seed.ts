import { storage } from "./storage";

export async function seedDatabase() {
  // Create initial configuration
  const config = await storage.getConfiguration();
  if (!config) {
    await storage.createConfiguration({
      businessName: "Dream Day Crew",
      logo: null,
      gstNumber: "27AABCD1234E1Z5",
      address: "123 Event Plaza, Mumbai, Maharashtra 400001",
      phone: "+91 98765 43210",
      email: "contact@dreamdaycrew.com",
      website: "www.dreamdaycrew.com",
      socialLinks: ["https://facebook.com/dreamdaycrew", "https://instagram.com/dreamdaycrew"],
      assetCategories: ["Audio System", "Decoration", "Furniture", "Photography", "Lighting", "Stage Equipment"],
      assetPurchaseStatus: ["Existing", "New"],
      servicesProvided: ["Wedding Planning", "Corporate Event", "Birthday Party", "Product Launch", "Anniversary", "Conference"],
      investmentTypes: ["Office", "Equipment", "Marketing", "Inventory"],
      planStatuses: ["To Do", "In Progress", "Completed"],
      roles: ["Designer", "Coordinator", "Manager", "Technical Support", "Decorator"],
      paymentModes: ["Cash", "Gray", "Bank Transfer", "UPI", "Cheque"],
      paymentStatuses: ["Pending", "Partial", "Completed"],
      vendorCategories: ["Decoration", "Photography", "Catering", "Audio/Visual", "Venue", "Transportation"],
    });
  }

  // Create sample assets
  const assets = await storage.getAssets();
  if (assets.length === 0) {
    await storage.createAsset({
      name: "LED Stage Lights (Set of 10)",
      category: "Lighting",
      quantity: 10,
      purchaseDate: "2024-01-15",
      purchasedAmount: "45000",
      status: "Active",
    });

    await storage.createAsset({
      name: "Portable Sound System",
      category: "Audio System",
      quantity: 2,
      purchaseDate: "2024-02-20",
      purchasedAmount: "85000",
      status: "Active",
    });

    await storage.createAsset({
      name: "Decorative Backdrop Panels",
      category: "Decoration",
      quantity: 15,
      purchaseDate: "2024-03-10",
      purchasedAmount: "12500",
      status: "Active",
    });

    await storage.createAsset({
      name: "Folding Chairs (Set of 50)",
      category: "Furniture",
      quantity: 50,
      purchaseDate: "2024-01-05",
      purchasedAmount: "30000",
      status: "Active",
    });

    await storage.createAsset({
      name: "Photography Equipment Kit",
      category: "Photography",
      quantity: 1,
      purchaseDate: "2023-11-20",
      purchasedAmount: "125000",
      status: "Active",
    });
  }

  // Create sample vendors
  const vendors = await storage.getVendors();
  if (vendors.length === 0) {
    await storage.createVendor({
      name: "Royal Decorators",
      category: "Decoration",
      specialization: "Wedding & Party Decoration",
      location: "Mumbai, Maharashtra",
      contactInfo: "9876543210",
      rating: 5,
    });

    await storage.createVendor({
      name: "SnapMoments Photography",
      category: "Photography",
      specialization: "Event & Wedding Photography",
      location: "Delhi",
      contactInfo: "contact@snapmoments.com",
      rating: 4,
    });

    await storage.createVendor({
      name: "Flavors Catering",
      category: "Catering",
      specialization: "Multi-cuisine Catering Services",
      location: "Bangalore",
      contactInfo: "7654321098",
      rating: 5,
    });

    await storage.createVendor({
      name: "Sound & Light Pro",
      category: "Audio/Visual",
      specialization: "Professional Sound & Lighting",
      location: "Pune",
      contactInfo: "8765432109",
      rating: 4,
    });
  }

  // Create sample team members
  const team = await storage.getTeamMembers();
  if (team.length === 0) {
    await storage.createTeamMember({
      name: "Rajesh Kumar",
      designation: "Manager",
    });

    await storage.createTeamMember({
      name: "Priya Sharma",
      designation: "Designer",
    });

    await storage.createTeamMember({
      name: "Amit Patel",
      designation: "Coordinator",
    });

    await storage.createTeamMember({
      name: "Sneha Reddy",
      designation: "Decorator",
    });

    await storage.createTeamMember({
      name: "Vikram Singh",
      designation: "Technical Support",
    });
  }

  // Create sample expenses
  const expenses = await storage.getExpenses();
  if (expenses.length === 0) {
    await storage.createExpense({
      type: "Credit",
      description: "Payment received from Sharma Wedding",
      amount: "150000",
      mode: "Cash",
      date: "2025-10-05",
      status: "Completed",
    });

    await storage.createExpense({
      type: "Debit",
      description: "Payment to Royal Decorators for venue decoration",
      amount: "35000",
      mode: "Gray",
      date: "2025-10-03",
      status: "Completed",
    });

    await storage.createExpense({
      type: "Credit",
      description: "Advance payment - Corporate Event",
      amount: "80000",
      mode: "Cash",
      date: "2025-09-28",
      status: "Completed",
    });

    await storage.createExpense({
      type: "Debit",
      description: "Venue booking payment",
      amount: "45000",
      mode: "Cash",
      date: "2025-09-25",
      status: "Completed",
    });

    await storage.createExpense({
      type: "Transfer",
      description: "Internal fund transfer to operations account",
      amount: "50000",
      mode: "Bank Transfer",
      date: "2025-10-01",
      status: "Pending",
    });
  }

  // Create sample events
  const events = await storage.getEvents();
  if (events.length === 0) {
    const event1 = await storage.createEvent({
      providedService: "Wedding Planning",
      eventName: "Wedding Reception - Sharma Family",
      registeredOn: "2025-10-01",
      eventDate: "2025-11-15",
      venue: "Grand Palace Hotel, Mumbai",
      clientInfo: "Mr. Rajesh Sharma - 9876543210",
      eventStatus: "In Progress",
      initialQuote: "200000",
      finalizedQuote: "180000",
      ddcCost: "120000",
      profitLoss: "60000",
      paymentMode: "Cash",
      paymentStatus: "Partial",
    });

    const event2 = await storage.createEvent({
      providedService: "Corporate Event",
      eventName: "Corporate Annual Meet 2025",
      registeredOn: "2025-09-15",
      eventDate: "2025-12-10",
      venue: "Convention Center, Delhi",
      clientInfo: "TechCorp Solutions - contact@techcorp.com",
      eventStatus: "Inquired",
      initialQuote: "300000",
      finalizedQuote: null,
      ddcCost: null,
      profitLoss: null,
      paymentMode: null,
      paymentStatus: "Pending",
    });

    const event3 = await storage.createEvent({
      providedService: "Birthday Party",
      eventName: "Birthday Celebration - Priya",
      registeredOn: "2025-08-10",
      eventDate: "2025-09-20",
      venue: "Riverside Garden, Pune",
      clientInfo: "Mrs. Meena Patel - 9123456789",
      eventStatus: "Completed",
      initialQuote: "50000",
      finalizedQuote: "45000",
      ddcCost: "30000",
      profitLoss: "15000",
      paymentMode: "Cash",
      paymentStatus: "Completed",
    });

    // Add requirements for event1
    const req1 = await storage.createRequirement({
      eventId: event1.id,
      requirement: "Stage Decoration",
      requirementOwner: "Priya Sharma",
      requirementStatus: "In Progress",
      order: 1,
    });

    const req2 = await storage.createRequirement({
      eventId: event1.id,
      requirement: "Sound System Setup",
      requirementOwner: "Vikram Singh",
      requirementStatus: "Completed",
      order: 2,
    });

    // Add fulfillment plans for req1
    await storage.createFulfillmentPlan({
      requirementId: req1.id,
      planType: "Vendor",
      vendorId: vendors[0]?.id || null,
      vendorAmount: "35000",
      paymentStatus: "Completed",
      planStatus: "In Progress",
    });

    await storage.createFulfillmentPlan({
      requirementId: req1.id,
      planType: "Asset",
      assetId: assets[2]?.id || null,
      assetPurchaseStatus: "Existing",
      planStatus: "Completed",
    });

    // Add fulfillment plans for req2
    await storage.createFulfillmentPlan({
      requirementId: req2.id,
      planType: "Team",
      teamMemberId: team[4]?.id || null,
      teamRole: "Technical Support",
      planStatus: "Completed",
    });

    await storage.createFulfillmentPlan({
      requirementId: req2.id,
      planType: "Asset",
      assetId: assets[1]?.id || null,
      assetPurchaseStatus: "Existing",
      planStatus: "Completed",
    });
  }

  return { success: true, message: "Database seeded successfully" };
}
