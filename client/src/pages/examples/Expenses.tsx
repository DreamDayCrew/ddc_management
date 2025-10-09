import { Router } from "wouter";
import Expenses from "../expenses";

export default function ExpensesExample() {
  return (
    <Router>
      <Expenses />
    </Router>
  );
}
