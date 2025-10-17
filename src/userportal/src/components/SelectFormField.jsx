import React from 'react';
import Select from 'react-select';

const defaultStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: 6,
    borderColor: state.isFocused ? '#2979ff' : '#e0e0e0',
    boxShadow: state.isFocused ? '0 0 0 1px #2979ff' : 'none',
    '&:hover': { borderColor: '#bdbdbd' },
    minHeight: '44px',
    fontSize: '15px',
    backgroundColor: '#fff',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9e9e9e',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#212121',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#2979ff' : '#9e9e9e',
    transition: 'transform 0.2s ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : null,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 6,
    marginTop: 4,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2979ff'
      : state.isFocused
      ? '#f5f5f5'
      : '#fff',
    color: state.isSelected ? '#fff' : '#212121',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '15px',
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: 200,
    padding: 0,
  }),
};

/**
 * SelectFormField
 * A thin wrapper around react-select with project default styles.
 * Props: options, value, onChange, placeholder, isMulti, styles (merged with defaults), and any other Select props.
 */
const SelectFormField = ({ styles, ...props }) => {
  const mergedStyles = styles
    ? Object.keys(defaultStyles).reduce((acc, key) => {
        acc[key] = (base, state) => {
          const def = defaultStyles[key](base, state);
          const custom = styles[key] ? styles[key](base, state) : {};
          return { ...def, ...custom };
        };
        return acc;
      }, {})
    : defaultStyles;

  return <Select styles={mergedStyles} {...props} />;
};

export default SelectFormField;
