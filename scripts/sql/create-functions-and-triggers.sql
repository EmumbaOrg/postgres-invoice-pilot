/* Create Function That Generates Embeddings */

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
