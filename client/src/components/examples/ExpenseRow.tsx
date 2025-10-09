import { ExpenseRow } from "../expense-row";

export default function ExpenseRowExample() {
  return (
    <div className="space-y-3 p-6 max-w-4xl">
      <ExpenseRow
        id="1"
        type="Credit"
        description="Payment received from Sharma Wedding"
        amount="1,50,000"
        mode="Cash"
        date="2025-10-05"
        status="Completed"
      />
      <ExpenseRow
        id="2"
        type="Debit"
        description="Payment to Royal Decorators for venue decoration"
        amount="35,000"
        mode="Gray"
        date="2025-10-03"
        status="Completed"
      />
      <ExpenseRow
        id="3"
        type="Transfer"
        description="Internal fund transfer to operations account"
        amount="50,000"
        mode="Bank Transfer"
        date="2025-10-01"
        status="Pending"
      />
    </div>
  );
}
