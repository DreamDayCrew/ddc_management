import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Package, Briefcase, Users as UsersIcon, DollarSign, CheckCircle } from "lucide-react";

export default function Configuration() {
  const configData = {
    assetCategories: ["Audio System", "Decoration", "Furniture", "Photography", "Lighting"],
    servicesProvided: ["Wedding Planning", "Corporate Event", "Birthday Party", "Product Launch"],
    planStatuses: ["To Do", "In Progress", "Completed"],
    roles: ["Designer", "Coordinator", "Manager", "Technical Support"],
    paymentModes: ["Cash", "Gray", "Bank Transfer", "UPI"],
    paymentStatuses: ["Pending", "Partial", "Completed"],
    vendorCategories: ["Decoration", "Photography", "Catering", "Audio/Visual", "Venue"],
  };

  const ConfigSection = ({ 
    title, 
    icon: Icon, 
    items, 
    addButtonId 
  }: { 
    title: string; 
    icon: React.ElementType; 
    items: string[]; 
    addButtonId: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
        <Button variant="ghost" size="sm" data-testid={addButtonId}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer hover-elevate">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Manage system settings and dropdown options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Business Name</p>
            <p className="text-muted-foreground">Dream Day Crew</p>
          </div>
          <div>
            <p className="text-sm font-medium">Contact</p>
            <p className="text-muted-foreground">contact@dreamdaycrew.com | +91 98765 43210</p>
          </div>
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-muted-foreground">123 Event Plaza, Mumbai, Maharashtra 400001</p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-edit-business-info">
            Edit Information
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ConfigSection
          title="Asset Categories"
          icon={Package}
          items={configData.assetCategories}
          addButtonId="button-add-asset-category"
        />
        <ConfigSection
          title="Services Provided"
          icon={Briefcase}
          items={configData.servicesProvided}
          addButtonId="button-add-service"
        />
        <ConfigSection
          title="Plan Statuses"
          icon={CheckCircle}
          items={configData.planStatuses}
          addButtonId="button-add-plan-status"
        />
        <ConfigSection
          title="Team Roles"
          icon={UsersIcon}
          items={configData.roles}
          addButtonId="button-add-role"
        />
        <ConfigSection
          title="Payment Modes"
          icon={DollarSign}
          items={configData.paymentModes}
          addButtonId="button-add-payment-mode"
        />
        <ConfigSection
          title="Payment Statuses"
          icon={CheckCircle}
          items={configData.paymentStatuses}
          addButtonId="button-add-payment-status"
        />
        <ConfigSection
          title="Vendor Categories"
          icon={Briefcase}
          items={configData.vendorCategories}
          addButtonId="button-add-vendor-category"
        />
      </div>
    </div>
  );
}
