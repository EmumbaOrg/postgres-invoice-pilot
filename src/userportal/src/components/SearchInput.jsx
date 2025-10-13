import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

/**
 * Reusable search input component with consistent styling
 * @param {string} value - Current search value
 * @param {function} onChange - Change handler function
 * @param {function} onClear - Clear search function
 * @param {string} placeholder - Placeholder text
 * @param {string} id - Input ID for accessibility
 * @param {number} maxWidth - Maximum width of the search group (default: 650)
 * @param {boolean} showSearchText - Whether to show "Searching for:" text below input (default: true)
 */
const SearchInput = ({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Search...", 
  id = "search-input",
  maxWidth = 650,
  showSearchText = true
}) => {
  return (
    <div className="mb-4">
      <Form.Group style={{ maxWidth: `${maxWidth}px` }}>
        <InputGroup>
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            style={{ fontSize: "14px" }}
          />
          {value && (
            <InputGroup.Text 
              style={{ cursor: "pointer" }} 
              onClick={onClear} 
              title="Clear search"
            >
              <i className="fas fa-times text-muted"></i>
            </InputGroup.Text>
          )}
        </InputGroup>
        {value && showSearchText && (
          <Form.Text className="text-muted">
            Searching for: "{value}"
          </Form.Text>
        )}
      </Form.Group>
    </div>
  );
};

export default SearchInput;