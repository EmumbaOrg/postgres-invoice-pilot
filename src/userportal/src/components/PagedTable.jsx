import { Spinner } from 'react-bootstrap';
import React, { useEffect, useState, useRef } from 'react';
import Table from './Table';

const PagedTable = ({ columns, fetchData, searchEnabled = false, showPagination = true, reload, noDataMesssage, noDataDescription, initialData = null, initialTotal = 0, initialSkip = 0, initialLimit = 10, initialLoadCompleted = false, isExternalLoading = false }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadingData = useRef(false);
  const hasLoadedInitialData = useRef(false);
  const hasNavigated = useRef(false);

  // Reset flags when component remounts (key changes)
  useEffect(() => {
    return () => {
      hasLoadedInitialData.current = false;
      hasNavigated.current = false;
    };
  }, []);

  // Update data when initialData changes (for React Query integration)
  useEffect(() => {
    if (initialLoadCompleted && initialData && !hasLoadedInitialData.current) {
      // Only show the first page of data initially
      const pageSize = initialLimit || 10;
      const firstPageData = initialData.slice(0, pageSize);
      
      setData(firstPageData);
      setTotal(initialTotal || initialData.length);
      setSkip(initialSkip || 0);
      setLimit(pageSize);
      hasLoadedInitialData.current = true;
    }
  }, [initialData, initialLoadCompleted, initialTotal, initialSkip, initialLimit]);

  const loadData = async (skip, limit, sortBy, searchQuery) => {
    if (!loadingData.current) {
      loadingData.current = true;
      setLoading(true);
      try {
        const sortbyParam = (sortBy && sortBy.length > 0) ? `${sortBy[0].id} ${sortBy[0].desc ? 'desc' : 'asc'}` : '';
        const response = await fetchData(skip, limit, sortbyParam, searchQuery);
        setData(response.data);
        setTotal(response.total);
        setSkip(response.skip);
        setLimit(response.limit);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
      loadingData.current = false;
    }
  };

  useEffect(() => {
    // Skip first load if initial data is already set and we haven't navigated yet
    if (hasLoadedInitialData.current && skip === 0 && !hasNavigated.current && !reload) {
      return;
    }
    // Mark that we've started navigating
    if (skip !== 0) {
      hasNavigated.current = true;
    }
    loadData(skip, limit, sortBy, searchQuery);
  }, [skip, limit, sortBy, searchQuery, reload]);

  // Reset to first page when reload changes (e.g., when search term changes)
  useEffect(() => {
    if (skip !== 0) {
      setSkip(0);
    }
  }, [reload]);

  const handlePrevious = () => {
    if (skip > 0) {
      setSkip(skip - limit);
    }
  };

  const handleNext = () => {
    if (skip + limit < total) {
      setSkip(skip + limit);
    }
  };

  const handleSortChange = (newSortBy) => {
    if (JSON.stringify(sortBy) !== JSON.stringify(newSortBy)) {
      setSortBy(newSortBy);
    }
  };

  const updateSearch = (value) => {
    setSkip(0);
    setSearchQuery(value);
  }

  const clearSearch = () => {
    updateSearch('');
  }

  const pageIndex = Math.floor(skip / limit) + 1;
  const pageCount = Math.ceil(total / limit);

  return (
    <div>
      {searchEnabled && (
        <div className="d-flex justify-content-between mb-3">
          <div></div>
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
            />
            <button className="btn btn-primary ml-2" onClick={clearSearch}>Clear</button>
          </div>
        </div>
      )}
      {(loading || isExternalLoading) ? (
          <div className="d-flex justify-content-center align-items-center py-4">
          <Spinner animation="border" role="status" variant="primary" />
        </div>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div>
          <Table
            columns={columns}
            data={data}
            loading={loading}
            onSortChange={handleSortChange}
            noDataMesssage={noDataMesssage}
            noDataDescription={noDataDescription}
          />
          {showPagination ? (
            <div className="d-flex justify-content-end align-items-center">
              <div className="pagination-info">
                Page {pageIndex} of {pageCount}
              </div>
              <button className="btn border-0" onClick={handlePrevious} disabled={skip === 0}>
              <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button className="btn border-0" onClick={handleNext} disabled={skip + limit >= total}>
              <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PagedTable;