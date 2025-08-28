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


/* For Mini Model - Create Semantic Reranking UDF */
CREATE OR REPLACE FUNCTION semantic_reranking(query TEXT, vector_search_results TEXT[])
RETURNS TABLE (content TEXT, relevance NUMERIC) AS $$
    BEGIN
        RETURN QUERY
        WITH
        json_pairs AS (
            SELECT jsonb_build_object(
                'pairs', jsonb_agg(jsonb_build_array(query, content_))
            ) AS json_pairs_data
            FROM (
                SELECT a.content AS content_
                FROM unnest(vector_search_results) AS a(content)
            )
        ),
        relevance_scores_raw AS (
            SELECT azure_ml.invoke(
                (SELECT json_pairs_data FROM json_pairs),
                deployment_name => 'msmarco-minilm-deployment-6',
                timeout_ms => 120000
            ) AS response_json
        ),
        relevance_scores AS (
        SELECT jsonb_array_elements(response_json) AS item
        FROM relevance_scores_raw
        )
        SELECT
            item ->> 'content' AS content,
            (item ->> 'score')::NUMERIC AS relevance
        FROM relevance_scores;
    END $$ LANGUAGE plpgsql;
