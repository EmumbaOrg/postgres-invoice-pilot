import { useState, useEffect } from 'react';

/**
 * Custom hook that delays the execution of a value update
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds (default: 500ms)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 1000) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay completes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
};

/**
 * Custom hook that provides debounced search functionality
 * @param {string} initialValue - Initial search term
 * @param {function} onSearch - Callback function to execute when search term changes
 * @param {number} delay - The debounce delay in milliseconds (default: 500ms)
 * @returns {object} Object containing searchTerm, debouncedSearchTerm, setSearchTerm, and clearSearch
 */
export const useDebouncedSearch = (initialValue = '', onSearch, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    // Call the search callback when debounced value changes
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    handleSearchChange
  };
};