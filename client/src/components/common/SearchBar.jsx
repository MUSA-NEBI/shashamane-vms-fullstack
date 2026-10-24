import { useState } from 'react';

const SearchBar = ({ value, onChange, placeholder = 'Search…', className = '' }) => {
  return (
    <div className={`input-group ${className}`} style={{ maxWidth: 320 }}>
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted" />
      </span>
      <input
        type="text"
        className="form-control border-start-0 ps-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="btn btn-outline-secondary border-start-0" onClick={() => onChange('')}>
          <i className="bi bi-x" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
