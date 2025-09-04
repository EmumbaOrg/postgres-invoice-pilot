SELECT azure_storage.account_add('${AZURE_STORAGE_ACCOUNT_NAME}', '${AZURE_STORAGE_ACCOUNT_KEY}');
-- Extract data for the vendors node

SELECT current_user;
GRANT azure_storage_admin TO current_user;

SELECT azure_storage.blob_put(
    '${AZURE_STORAGE_ACCOUNT_NAME}',
    'graph',
    'vendors.csv',
    vendors,
    'csv',
    'none',
    azure_storage.options_csv_put(header:=true)
)
FROM (
    SELECT * FROM vendors
) AS vendors;

-- Extract data for the SOWs node
SELECT azure_storage.blob_put(
    '${AZURE_STORAGE_ACCOUNT_NAME}',
    'graph',
    'sows.csv',
    sows,
    'csv',
    'none',
    azure_storage.options_csv_put(header:=true)
)
FROM (
    SELECT id, number, vendor_id, start_date, end_date, budget FROM sows
) AS sows;

-- Create the has_invoices edge
SELECT azure_storage.blob_put(
    '${AZURE_STORAGE_ACCOUNT_NAME}',
    'graph',
    'has_invoices.csv',
    invoices,
    'csv',
    'none',
    azure_storage.options_csv_put(header:=true)
)
FROM (
    SELECT id, vendor_id as start_id, 'vendor' AS start_vertex_type, sow_id AS end_id, 'sow' AS end_vertex_type, number, amount, invoice_date, payment_status FROM invoices
) AS invoices;