import { useState } from 'react';

/**
 * Custom hook for handling drag and drop file operations
 * @param {Function} onFileDrop - Callback function when file is dropped
 * @param {Object} options - Configuration options
 * @param {boolean} options.disabled - Whether drag and drop is disabled
 * @param {string[]} options.acceptedTypes - Accepted file types (default: ['.pdf', '.doc', '.docx'])
 * @returns {Object} - Drag and drop handlers and state
 */
export const useDragAndDrop = (onFileDrop, options = {}) => {
  const [dragActive, setDragActive] = useState(false);
  
  const { 
    disabled = false, 
    acceptedTypes = ['.pdf', '.doc', '.docx'] 
  } = options;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't handle drag if disabled
    if (disabled) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Don't handle drop if disabled
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Optional: Check file type if needed
      if (acceptedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
          console.warn(`File type ${fileExtension} not accepted. Accepted types: ${acceptedTypes.join(', ')}`);
          return;
        }
      }
      
      onFileDrop(file);
    }
  };

  const dragHandlers = {
    onDragEnter: handleDrag,
    onDragLeave: handleDrag,
    onDragOver: handleDrag,
    onDrop: handleDrop,
  };

  const getDragStyles = (baseStyles = {}) => ({
    ...baseStyles,
    border: disabled ? baseStyles.border : 
            (dragActive ? "2px dashed #007bff" : (baseStyles.border || "1px dashed #6c757d")),
    backgroundColor: disabled ? baseStyles.backgroundColor :
                    (dragActive ? "#f8f9ff" : (baseStyles.backgroundColor || "#ffffff")),
  });

  return {
    dragActive,
    dragHandlers,
    getDragStyles,
    disabled
  };
};

export default useDragAndDrop;