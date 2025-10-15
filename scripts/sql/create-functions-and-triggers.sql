/* Create Function That Generates Embeddings */


/* ----- 'sow_chunks' table ----- */

CREATE OR REPLACE FUNCTION sow_chunks_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.content, throw_on_error => FALSE, max_attempts => 1000, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER sow_chunks_insert_trigger
BEFORE INSERT ON sow_chunks
FOR EACH ROW
EXECUTE FUNCTION sow_chunks_insert_trigger_fn();


/* ----- 'sow_validaton_results' table ----- */

CREATE OR REPLACE FUNCTION sow_validation_results_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.result IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.result, throw_on_error => FALSE, max_attempts => 1000, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER sow_validation_results_insert_trigger
BEFORE INSERT ON sow_validation_results
FOR EACH ROW
EXECUTE FUNCTION sow_validation_results_insert_trigger_fn();


/* ----- 'invoices' table ----- */

CREATE OR REPLACE FUNCTION invoices_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.content, throw_on_error => FALSE, max_attempts => 1000, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER invoices_insert_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION invoices_insert_trigger_fn();

/* ----- 'invoice_validation_results' table ----- */

CREATE OR REPLACE FUNCTION invoice_validation_results_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.result IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.result, throw_on_error => FALSE, max_attempts => 1000, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER invoice_validation_results_insert_trigger
BEFORE INSERT ON invoice_validation_results
FOR EACH ROW
EXECUTE FUNCTION invoice_validation_results_insert_trigger_fn();  