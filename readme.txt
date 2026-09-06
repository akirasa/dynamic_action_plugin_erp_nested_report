Here is the complete, step-by-step developer guide in English for installing,
configuring, and using the ERP Nested Grid Plugin in Oracle APEX.

Developer Guide: ERP Nested Grid Plugin

Overview

The ERP Nested Grid plugin adds an interactive, nested detail grid (drill-down
sub-table) directly inside rows of an Oracle APEX Interactive Report without
requiring complex JSON configurations.

Step 1: Install the Database Package

1.  Open SQL Workshop \rightarrow SQL Commands (or use SQL Developer / SQLcl).
2.  Execute and compile the package specification and body:
      - Run the script PKG_ERP_NESTED_GRID2.sql.
3.  Ensure both the Package Specification and Package Body are valid without any
    compilation errors.

Step 2: Import the Plugin into Your APEX Application

1.  Navigate to App Builder \rightarrow Select your Application.
2.  Go to Shared Components \rightarrow Under Other Components, click Plug-ins.
3.  Click Import.
4.  Choose the file plugin_erp_nested_grid.sql and follow the wizard prompts:
      - Click Next.
      - Confirm the Target Application.
      - Click Install Plugin.

Step 3: Prepare the Parent Interactive Report

1.  Open the page containing your main Interactive Report in Page Designer.
2.  Make sure your parent SQL Query includes the Primary Key / Link Column
    (e.g., ACC_ID, EMP_ID, ORDER_ID).
3.  (Recommended) Under the Region properties on the right, set a Static ID
    (e.g., MAIN_REPORT).

Step 4: Create the Dynamic Action

1.  On the left tree in Page Designer, switch to the Dynamic Actions tab.
2.  Right-click Page Load and select Create Dynamic Action.
3.  Set the Dynamic Action properties:
      - Name: DA - ERP Nested Grid
      - Event: Page Load
4.  Under the True action, select:
      - Action: ERP Nested Grid

Step 5: Configure the Plugin Attributes

Fill in the plugin settings under the Settings section on the right panel:

| Attribute                     | Description                                                                                                                                                                                                           | Example / Recommended Value                |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **SQL Query**                 | The detail SQL statement. Column aliases define the table headers directly.                                                                                                                                           | *See example below*                        |
| **Region Static ID**          | Static ID of your Interactive Report region (Optional - leave empty for auto-detection).                                                                                                                              | `MAIN_REPORT`                              |
| **Primary Key / Link Column** | Name of the primary key column in the parent report that links to the child data.                                                                                                                                     | `ACC_ID`                                   |
| **Page Items to Submit**      | Comma-separated list of page items to pass as bind variables (No JSON needed).                                                                                                                                        | `P10_FROM_DATE, P10_TO_DATE`               |
| **Detail Table Title**        | Title displayed in the detail ribbon header.                                                                                                                                                                          | `Account Transactions`                     |
| **Table Style**               | Choose the visual layout theme: <br>• **Striped:** Alternating row colors with hover highlight.<br>• **Compact:** Tight, dense grid for accounting/data-heavy reports.<br>• **Default:** Clean corporate card layout. | `Striped`                                  |
| **Enable Quick Search**       | Enables real-time local search inside the expanded detail grid.                                                                                                                                                       | **Checked** (`Y`)                          |
| **RTL Layout**                | Switches layout direction to Right-to-Left (Arabic/Hebrew).                                                                                                                                                           | **Checked** (`Y`) or unchecked for English |
| **Max Rows Fetched**          | Upper limit of records to fetch per detail row.                                                                                                                                                                       | `100`                                      |

Practical Example

1. Parent Query (Interactive Report):

SELECT 
    ACC_ID,
    ACC_CODE       AS "Account Code",
    ACC_NAME       AS "Account Name",
    CURRENT_BAL    AS "Current Balance"
FROM ACCOUNTS
WHERE STATUS = 'ACTIVE'

2. Child Query in Plugin Settings:

Tip: Any column alias wrapped in double quotes "..." will automatically become
the column header in the sub-table.

SELECT 
    TRANS_DATE       AS "Transaction Date",
    DOC_NO           AS "Doc #",
    DESCRIPTION      AS "Description",
    DEBIT_AMOUNT     AS "Debit",
    CREDIT_AMOUNT    AS "Credit"
FROM ACCOUNT_TRANS
WHERE ACC_ID = :ACC_ID
  AND (:P10_FROM_DATE IS NULL OR TRANS_DATE >= TO_DATE(:P10_FROM_DATE, 'YYYY-MM-DD'))
ORDER BY TRANS_DATE DESC

How It Works at Runtime

1.  Automatic Button Generation:
    The plugin replaces the ACC_ID column in each data row with a styled "عرض" /
    "View" expand button. Summary/aggregation/control-break rows are
    automatically skipped.
2.  Instant Expansion:
    Clicking the button expands an inline container directly below the clicked
    row with an animated loading spinner.
3.  Automatic Data Binding:
    The clicked row's ID is bound to :ACC_ID, and current values from items like
    :P10_FROM_DATE are submitted automatically.
4.  Centered & Formatted Presentation:
    All column data and headers are horizontally and vertically centered with
    clean typography according to your selected Table Style.
5.  Real-time Filter:
    Users can type in the search bar to filter transactions in memory without
    additional round-trips to the server.
