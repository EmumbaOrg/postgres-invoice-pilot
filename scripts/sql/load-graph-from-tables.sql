-- This script creates graph nodes and edges in Apache AGE from SQL tables: vendors, sows, has_invoices

/* ============================================================================
   GRAPH SYNC TRIGGERS
   These triggers automatically sync vendors, SOWs, and invoices to the 
   Apache AGE graph when data is inserted or deleted.
   ============================================================================ */

SET search_path = ag_catalog, "$user", public;

-- ============================================================================
-- INSERT TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_vendor_to_graph_insert()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
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
        NEW.id, NEW.name, NEW.address, NEW.website, NEW.type,
        NEW.contact_name, NEW.contact_email, NEW.contact_phone
    );

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to sync vendor % to graph: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_sow_to_graph_insert()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
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
        NEW.id, NEW.number, NEW.vendor_id, NEW.start_date, NEW.end_date, NEW.budget
    );

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to sync SOW % to graph: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_invoice_to_graph_insert()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
    cypher_body := format($create$
        MATCH (v:vendor), (s:sow)
        WHERE v.id = %L AND s.id = %L
        CREATE (v)-[rel:has_invoices {
            id: %L,
            amount: %L,
            number: %L,
            invoice_date: %L,
            payment_status: %L
        }]->(s)
    $create$,
        NEW.vendor_id, NEW.sow_id, NEW.id, NEW.amount, 
        NEW.number, NEW.invoice_date, NEW.payment_status
    );

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to sync invoice % to graph: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DELETE TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_vendor_to_graph_delete()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
    cypher_body := format($delete$
        MATCH (v:vendor)
        WHERE v.id = %L
        DETACH DELETE v
    $delete$, OLD.id);

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete vendor % from graph: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_sow_to_graph_delete()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
    cypher_body := format($delete$
        MATCH (s:sow)
        WHERE s.id = %L
        DETACH DELETE s
    $delete$, OLD.id);

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete SOW % from graph: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_invoice_to_graph_delete()
RETURNS TRIGGER AS $$
DECLARE
    cypher_body text;
    sql text;
BEGIN
    cypher_body := format($delete$
        MATCH (v:vendor)-[rel:has_invoices]->(s:sow)
        WHERE rel.id = %L
        DELETE rel
    $delete$, OLD.id);

    sql := 'SELECT * FROM cypher(''vendor_graph'', $AGE$' || cypher_body || '$AGE$) AS (result agtype);';
    EXECUTE sql;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete invoice % from graph: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS vendors_sync_to_graph_insert ON vendors;
CREATE TRIGGER vendors_sync_to_graph_insert
AFTER INSERT ON vendors
FOR EACH ROW
EXECUTE FUNCTION sync_vendor_to_graph_insert();

DROP TRIGGER IF EXISTS sows_sync_to_graph_insert ON sows;
CREATE TRIGGER sows_sync_to_graph_insert
AFTER INSERT ON sows
FOR EACH ROW
EXECUTE FUNCTION sync_sow_to_graph_insert();

DROP TRIGGER IF EXISTS invoices_sync_to_graph_insert ON invoices;
CREATE TRIGGER invoices_sync_to_graph_insert
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_to_graph_insert();

DROP TRIGGER IF EXISTS vendors_sync_to_graph_delete ON vendors;
CREATE TRIGGER vendors_sync_to_graph_delete
AFTER DELETE ON vendors
FOR EACH ROW
EXECUTE FUNCTION sync_vendor_to_graph_delete();

DROP TRIGGER IF EXISTS sows_sync_to_graph_delete ON sows;
CREATE TRIGGER sows_sync_to_graph_delete
AFTER DELETE ON sows
FOR EACH ROW
EXECUTE FUNCTION sync_sow_to_graph_delete();

DROP TRIGGER IF EXISTS invoices_sync_to_graph_delete ON invoices;
CREATE TRIGGER invoices_sync_to_graph_delete
AFTER DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_to_graph_delete();

/* End Graph Sync Triggers */
