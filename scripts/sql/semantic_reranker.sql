CREATE OR REPLACE FUNCTION semantic_reranking(
    query TEXT,
    vector_search_results TEXT[],
    model TEXT,
)
RETURNS TABLE (content TEXT, relevance BIGINT) AS $$
BEGIN
    RETURN QUERY
        WITH ranked AS (
            SELECT r.idx, r.relevance
            FROM azure_ai.rank(query, vector_search_results, model) AS r(idx, relevance)
        )
        SELECT vector_search_results[r.idx + 1] AS content, r.relevance
        FROM ranked r;
END $$ LANGUAGE plpgsql;
