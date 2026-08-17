# Human Interface Layer for Durable Execution — Demo App Specification

## Goal

Build a simple demo application that showcases a Workflow Builder for an article about workflow builders.

The application should demonstrate the concept of a **Human Interface Layer for Durable Execution** using a simple, understandable workflow. It is a demo/prototype, not a production workflow engine.

The key concept is:

> Humans are first-class participants in workflows. A workflow can execute automated/AI steps, pause while waiting for a human decision, and then continue.

Use the existing Workflow Builder capabilities/components where possible rather than introducing unnecessary custom infrastructure.

---

# 1. Main demo use case

Use a simple **Invoice Approval** workflow.

Example workflow:

Trigger
  ↓
AI Analyze Invoice
  ↓
Condition: Amount > €10,000?
  ↓ yes
Human Approval
  ↓
Process Payment
  ↓
Send Confirmation
  ↓
End

For the demo, the "durable execution" behavior can be simulated. We mainly need to make the UX understandable.

The most important part is the transition:

Automated workflow
→ workflow waits for human
→ human sees a task
→ human approves/rejects
→ workflow resumes

---

# 2. Application structure

Keep the application small. Suggested navigation:

- Dashboard
- Workflows
- Tasks
- Executions

No need for authentication, complex settings, real backend integration, or production-grade workflow execution.

---

# 3. Dashboard

Simple overview page.

Show summary cards:

- Active workflows: 3
- Waiting for human: 1
- Running: 1
- Completed today: 12

Show a "Recent executions" list:

| Workflow | Status | Current step | Time |
|---|---|---|---|
| Invoice Approval #1842 | Waiting | Human Approval | 2 min ago |
| Invoice Approval #1841 | Running | Process Payment | 5 min ago |
| Invoice Approval #1840 | Completed | End | 12 min ago |

Primary CTA:

`+ Create workflow`

---

# 4. Workflows page

List available workflow definitions.

Example:

- Invoice Approval — Published
- Customer Onboarding — Draft

Columns:

- Name
- Status
- Last modified
- Actions

Actions:

- Open
- Duplicate
- Publish
- View executions

For the demo, Invoice Approval should be the main workflow.

---

# 5. Workflow Builder

This is the main screen and should use the existing Workflow Builder/canvas.

Recommended layout:

-------------------------------------------------------------
Header:
Invoice Approval    Draft       Save    Publish
-------------------------------------------------------------
Left sidebar       Canvas                 Properties
Node Library                              Panel
-------------------------------------------------------------

Left side = node library.

Center = workflow canvas.

Right side = properties panel.

The builder should support selecting nodes and displaying/editing their properties.

---

# 6. Node library

Keep the node library intentionally small.

## Triggers

### Trigger

Purpose:
Starts the workflow.

Properties:

- Name
- Trigger type
- Input schema

Trigger types:

- Manual
- API
- Webhook
- Schedule

For the demo, use Manual.

---

## Actions

### Action

Purpose:
Represents an automated operation.

Examples:

- Process Payment
- Send Confirmation

Properties:

- Name
- Action type
- Configuration
- Input
- Output
- Retry policy
- Timeout

Do not implement real integrations. Mock the execution.

---

## AI

### AI Task

Purpose:
Represents an AI-powered workflow step.

Example:
`Analyze Invoice`

Properties:

- Name
- Prompt
- Input
- Output schema
- Model
- Timeout
- Retry policy

Example prompt:

"Analyze the invoice and determine whether it should be approved automatically. Return the invoice amount and whether manual approval is required."

Example output:

{
  "amount": 24500,
  "requiresApproval": true,
  "reason": "Amount exceeds automatic approval limit."
}

Mock the AI result for the demo.

---

## Logic

### Condition

Purpose:
Branches the workflow.

Example:

`Amount > 10,000`

Properties:

- Name
- Left value
- Operator
- Right value

Operators:

- equals
- not equals
- greater than
- less than
- greater than or equal
- less than or equal

The node should have two branches:

- Yes
- No

For the demo:

Yes → Human Approval
No → Process Payment

---

## Human

### Human Task

This is the most important node.

Purpose:
The workflow pauses and waits for a human interaction.

Example:
`Approve Invoice`

Properties:

### General

- Name
- Description
- Priority

### Assignment

- Assignee type: User / Team / Role
- Assignee

Example:

`Finance Team`

### Task type

For the demo:

- Approval
- Form
- Review
- Choice

Use `Approval`.

### Actions

- Approve
- Reject
- Request changes

For the demo, use:

- Approve
- Reject

### Deadline

Example:

`24 hours`

### On timeout

Options:

- Continue
- Reassign
- Escalate
- Fail workflow

For the demo, use `Escalate`.

The Human Task should visually communicate that it is a point where workflow execution waits for human input.

---

## Wait

### Wait

Purpose:
Represents a workflow waiting for time/event.

Properties:

- Wait type
- Duration/date/event

Types:

- Duration
- Specific date
- Event

This node is optional for the first demo version.

---

## End

### End

Properties:

- Completion status
- Output

---

# 7. Demo workflow

The initial workflow should be:

[Trigger]
    ↓
[AI Analyze Invoice]
    ↓
[Condition: Amount > €10,000]
    ├── No → [Process Payment]
    │             ↓
    │       [Send Confirmation]
    │             ↓
    │           [End]
    │
    └── Yes → [Human Approval]
                  ↓
            [Process Payment]
                  ↓
            [Send Confirmation]
                  ↓
                [End]

The workflow should look clean and easy to understand on the canvas.

---

# 8. Human Task configuration UI

When the Human Approval node is selected, show:

Human Approval

Description:
"Review the invoice and approve or reject the payment."

Assignee:
Finance Team

Priority:
High

Actions:
[✓] Approve
[✓] Reject

Due after:
24 hours

On timeout:
Escalate

The properties panel should be visually polished but simple.

---

# 9. Execution page

Separate execution view from the builder.

Purpose:

Builder answers:
"How should the workflow work?"

Execution answers:
"What is happening with this particular workflow run?"

Example:

Invoice Approval #1842

Status:
WAITING FOR HUMAN

Started:
Aug 11, 09:42

Current step:
Human Approval

Show a vertical execution timeline:

✓ Invoice received
✓ AI analysis
✓ Condition evaluated
🟡 Waiting for human approval
○ Process payment
○ Send confirmation
○ Completed

Show:

Waiting since: 09:45
Assigned to: Finance Team

---

# 10. Human Tasks / Inbox

Create a simple Tasks page.

Example:

My Tasks

------------------------------------------------
Approve invoice #1842
Finance Team
€24,500
Due today
[Open]
------------------------------------------------

When opened, show:

Approve Invoice #1842

Customer:
ACME Corporation

Amount:
€24,500

AI recommendation:
Manual approval required

Reason:
Amount exceeds automatic approval limit.

Comment:
[ text input ]

[Reject] [Approve]

The task should feel like a real human interaction with the workflow.

---

# 11. Demo interaction

The most important interactive demo should work like this:

1. Open Invoice Approval workflow.
2. See the workflow on the canvas.
3. Select Human Approval node.
4. Show its configuration in the properties panel.
5. Click Publish.
6. Start an execution.
7. Automated nodes appear as completed.
8. Workflow reaches Human Approval.
9. Execution status changes to:
   `WAITING FOR HUMAN`
10. Open Tasks.
11. Open "Approve invoice #1842".
12. Click Approve.
13. Task becomes completed.
14. Execution resumes.
15. Process Payment becomes active/completed.
16. Send Confirmation becomes completed.
17. Workflow reaches End.
18. Execution status becomes:
   `COMPLETED`

This can be implemented with mocked/local state. No real Temporal backend is required for the demo.

---

# 12. Status model

Workflow definition statuses:

- Draft
- Published
- Archived

Execution statuses:

- Running
- Waiting
- Completed
- Failed
- Cancelled

Human task statuses:

- Pending
- In progress
- Completed
- Expired
- Cancelled

Use consistent visual status indicators throughout the application.

---

# 13. Execution timeline

The execution detail page should show an audit-style timeline:

09:42  Workflow started
09:42  Invoice received
09:43  AI analysis started
09:43  AI analysis completed
09:43  Condition evaluated
09:43  Human task created
09:45  Assigned to Finance Team
10:02  Waiting for response

After approval:

10:17  Approved by user
10:17  Workflow resumed
10:18  Payment initiated
10:18  Confirmation sent
10:18  Workflow completed

This is important because it visually explains durable execution and human-in-the-loop behavior.

---

# 14. UX principles

The demo should be:

- Simple
- Clean
- Easy to understand
- Visually polished
- Focused on the workflow concept

Do NOT overbuild it.

Avoid:

- Authentication
- Real payment APIs
- Real AI APIs
- Complex permissions
- Multi-tenant architecture
- Complex workflow versioning
- Production-grade persistence
- Large configuration systems

Mock data and local state are sufficient.

---

# 15. Key concept to communicate

The application should make this idea immediately visible:

Traditional automation:

Automation → Automation → Automation

This demo:

Automation → AI → Human → Automation → Human → Automation

The Human Task node, Tasks/Inbox page, and Execution Timeline are the three most important parts of the demo.

The user should be able to understand within a few minutes:

1. How a workflow is designed.
2. Where human interaction is introduced.
3. What happens when the workflow reaches a human task.
4. How the human responds.
5. How the workflow resumes afterwards.

---

# 16. Implementation guidance

Before implementing new components, inspect the existing Workflow Builder architecture and reuse existing:

- canvas
- node components
- connection/link handling
- properties panel
- node selection
- toolbar
- styling
- state management

Add only the minimum new functionality needed for the demo.

Prefer existing project patterns over introducing new libraries.

If the project already has a node model, extend it rather than creating a parallel workflow representation.

If the project already has routing/navigation, use it.

Keep demo data in one clear mock-data layer so it can easily be replaced by a real backend later.

---

# 17. Suggested MVP scope

Must have:

- Dashboard
- Workflows list
- Workflow Builder
- Trigger node
- AI Task node
- Condition node
- Human Task node
- Action node
- End node
- Properties panel
- Publish action
- Mock workflow execution
- Waiting for human state
- Tasks/Inbox
- Approve/Reject interaction
- Execution timeline
- Workflow resume after human action

Nice to have:

- Wait node
- Search/filter
- Team task view
- Retry action
- Timeout/escalation visualization

Not needed:

- Real Temporal integration
- Real AI
- Real payment API
- Authentication
- Backend
- Complex persistence

---

# 18. Final acceptance criteria

The demo is successful if a user can:

1. Open the Invoice Approval workflow.
2. Understand the workflow visually.
3. Select and configure the Human Approval node.
4. Publish the workflow.
5. Start a mock execution.
6. See automated steps complete.
7. See the workflow enter `WAITING FOR HUMAN`.
8. Find the task in the Tasks/Inbox page.
9. Open the task and see the invoice information.
10. Approve or reject it.
11. Return to the execution and see that the workflow resumed.
12. See the remaining steps complete.
13. See the final `COMPLETED` state.
14. Understand from the UI that the workflow can pause for human input and later continue.

The main goal is not technical completeness. The main goal is to create a convincing, polished demo for an article explaining Workflow Builder + Human-in-the-loop + Durable Execution.
