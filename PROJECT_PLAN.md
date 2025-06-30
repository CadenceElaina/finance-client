# Finalized Project Plan: The Flexible Financial Engine

This plan details the integration of a dynamic "Plan vs. Actuals" reconciliation cycle into the existing financial dashboard, built upon principles of flexibility and user control.

### **1. Guiding Principles**

- **Manual First, Automation Second:** The application will always support manual data entry. The reconciliation cycle is an optional, additive feature.
- **Clear Separation of Concerns:**
  - **Budget App:** Defines the recurring, planned income and expenses.
  - **Accounts App:** Holds actual account balances and transaction data.
  - **Goals App:** Tracks specific, discrete savings/debt objectives.
  - **Plan App:** The strategic layer for creating long-term roadmaps with flexible milestones.
- **User in Control:** All major processes are initiated by the user.

### **2. The "Plan" App: Flexible Roadmaps**

- **Milestone Configuration:** Milestones in a Plan can be linked to a source:
  - `type: 'goal'`: Linked to a goal in the Goals app.
  - `type: 'account'`: Linked to an account in the Accounts app.
  - `type: 'manual'`: For external goals (e.g., 401k). The user updates progress manually.
- **Manual Milestone Data Model:**
  ```javascript
  {
    id: 'milestone-3',
    name: 'Max out 401k',
    targetAmount: 23000,
    currentAmount: 5000, // Manually updated by user
    linkedSource: { type: 'manual' }
  }
  ```

### **3. The Reconciliation Cycle (Optional Feature)**

- An opt-in workflow initiated by the user from the dashboard.
- **Workflow:**
  1.  **Confirm Actual Income.**
  2.  **Import & Review Transactions.**
  3.  **Review "Plan vs. Actuals" Summary.** (This step includes prompts to update any `manual` milestones).
  4.  **Approve & Allocate Surplus/Deficit.**
  5.  **System Update:** All relevant data in the Accounts, Goals, and Plan apps is updated.

### **4. Finalized Data Model: `reconciliationPeriods` (Hybrid Model)**

- A new `reconciliationPeriods` array will be added to `FinancialDataContext`.
- **Structure:**
  ```javascript
  {
    id: 'rec-2026-07-03',
    periodStart: '2026-06-20',
    periodEnd: '2026-07-03',
    // High-level summary
    budgetSnapshot: { plannedIncome: 2500, plannedExpenses: 2000 },
    actualsSnapshot: { actualIncome: 2550, actualExpenses: 1950 },
    // Link to the underlying data
    transactionIds: ['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5'],
    // Record of manual updates
    manualUpdates: [
        { milestoneId: 'milestone-401k', change: 500 }
    ],
    // Record of user's allocation decision
    allocation: {
      surplus: 100,
      actions: [
        { type: 'goal', goalId: 'goal-vacation', amount: 50 },
        { type: 'debt', accountId: 'account-cc', amount: 50 }
      ]
    }
  }
  ```

### **5. Final Mermaid Diagram**

```mermaid
graph TD
    subgraph Core Apps (Manual Operation)
        A[Budget App <br> (Planned Income/Expenses)]
        B[Accounts App <br> (Actual Balances/Transactions)]
        C[Goals App <br> (Specific Savings Goals)]
        D[Plan App <br> (Strategic Roadmaps with Manual & Linked Milestones)]
    end

    subgraph Optional Reconciliation Cycle
        E[Dashboard Prompt <br> "Start Financial Check-in?"]
        F[Reconciliation Wizard]
    end

    subgraph Data Flow & User Actions
        User1(User can manually update <br> A, B, C, and D at any time)

        E -- User clicks Yes --> F
        F -- pulls "Planned" data from --> A
        F -- pulls "Actuals" data from --> B
        F -- prompts user to update manual milestones in --> D
        F -- prompts user to allocate surplus to --> B & C
        F -- on approval, updates data in --> B, C, D
    end

    A & B & C & D -- provide data to --> F
```
