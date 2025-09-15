-- This script creates graph nodes and edges in Apache AGE from SQL tables: vendors, sows, has_invoices

SET search_path = ag_catalog, "$user", public;

-- 1. Create vendor vertices from vendors nodes
SELECT * FROM ag_catalog.create_graph('vendor_graph');

DO $function_body$
DECLARE
    rec RECORD;
    cypher_body text;
    sql text;
BEGIN
    FOR rec IN SELECT * FROM vendors LOOP
        -- Build the Cypher CREATE with all values safely quoted
        cypher_body := format($create$
            CREATE (v:vendor {
                id: %L,
                name: %L,
                address: %L,
                website: %L,
                type: %L,
                contact_name: %L,
                contact_email: %L,
                contact_phone: %L
            })
        $create$,
            rec.id,
            rec.name,
            rec.address,
            rec.website,
            rec.type,
            rec.contact_name,
            rec.contact_email,
            rec.contact_phone
        );

        -- Pass the Cypher text to AGE using a named dollar-quoted literal
        sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$'
               || cypher_body ||
               '$AGE$) AS (result agtype);';

        EXECUTE sql;
    END LOOP;
END
$function_body$;

-- 2. Create sow vertices from sows table
DO $function_body$
DECLARE
    rec RECORD;
    cypher_body text;
    sql text;
BEGIN
    FOR rec IN SELECT id, number, vendor_id, start_date, end_date, budget FROM sows LOOP
        -- Build the Cypher CREATE with all values safely quoted
        cypher_body := format($create$
            CREATE (s:sow {
                id: %L,
                number: %L,
                vendor_id: %L,
                start_date: %L,
                end_date: %L,
                budget: %L
            })
        $create$,
            rec.id,
            rec.number,
            rec.vendor_id,
            rec.start_date,
            rec.end_date,
            rec.budget
        );

        -- Pass the Cypher text to AGE using a named dollar-quoted literal
        sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$'
               || cypher_body ||
               '$AGE$) AS (result agtype);';

        EXECUTE sql;
    END LOOP;
END
$function_body$;

-- 3. Create has_invoices edges from has_invoices table
DO $function_body$
DECLARE
    rec RECORD;
    cypher_body text;
    sql text;
BEGIN
    FOR rec IN 
        SELECT 
            id, 
            vendor_id AS start_id, 
            'vendor' AS start_vertex_type, 
            sow_id AS end_id, 
            'sow' AS end_vertex_type, 
            number, 
            amount, 
            invoice_date, 
            payment_status 
        FROM invoices 
    LOOP
        -- Build the Cypher edge creation query
        cypher_body := format($create$
            MATCH (v:%I), (s:%I)
            WHERE v.id = %L AND s.id = %L
            CREATE (v)-[rel:has_invoices {
                id: %L,
                amount: %L,
                number: %L,
                invoice_date: %L,
                payment_status: %L
            }]->(s)
        $create$,
            rec.start_vertex_type,
            rec.end_vertex_type,
            rec.start_id,
            rec.end_id,
            rec.id,
            rec.amount,
            rec.number,
            rec.invoice_date,
            rec.payment_status
        );

        -- Wrap in dollar quotes for AGE
        sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$'
               || cypher_body ||
               '$AGE$) AS (result agtype);';

        EXECUTE sql;
    END LOOP;
END
$function_body$;
