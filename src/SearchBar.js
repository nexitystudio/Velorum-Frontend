// 🔍 **SEARCHBAR.JS** - COMPONENTE DE BÚSQUEDA
import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from './SearchContext';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar({ className = '' }) {
  const {
    searchTerm,
    searchResults,
    isSearching,
    searchProducts,
    clearSearch
  } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // 🔍 MANEJAR CAMBIOS EN EL INPUT
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    searchProducts(value);
    setIsOpen(true);
  };

  // 🧹 LIMPIAR BÚSQUEDA
  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setIsOpen(false);
  };

  // 👁️ VER PRODUCTO
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    handleClear();
  };

  // 📋 VER TODOS LOS RESULTADOS
  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    handleClear();
  };

  // 🖱️ CERRAR AL HACER CLIC FUERA
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⌨️ MANEJAR TECLAS
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && searchTerm) {
      handleViewAllResults();
    }
  };

  return (
    <div className={`search-bar ${className}`} ref={searchRef}>
      {/* 🔍 INPUT DE BÚSQUEDA */}
      <div className="search-input-container">
        <svg 
          className="search-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        
        <input
          type="text"
          className="search-input"
          placeholder="Buscar relojes..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        
        {inputValue && (
          <button 
            className="search-clear-btn"
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>

      {/* 📋 RESULTADOS DE BÚSQUEDA */}
      {isOpen && (inputValue || searchResults.length > 0) && (
        <div className="search-dropdown">
          {isSearching ? (
            /* ⏳ CARGANDO */
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>Buscando...</span>
            </div>
          ) : searchResults.length > 0 ? (
            /* 📦 RESULTADOS ENCONTRADOS */
            <>
              <div className="search-results">
                {searchResults.slice(0, 5).map(product => (
                  <div 
                    key={product.id} 
                    className="search-result-item"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="result-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjhGOUZBIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjgiIHN0cm9rZT0iI0Q1RDlERCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                    <div className="result-info">
                      <h4>{product.name}</h4>
                      <p className="result-category">{product.category}</p>
                      <p className="result-price">${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {searchResults.length > 5 && (
                <div className="search-footer">
                  <button 
                    className="view-all-btn"
                    onClick={handleViewAllResults}
                  >
                    Ver todos los {searchResults.length} resultados
                  </button>
                </div>
              )}
            </>
          ) : inputValue ? (
            /* 😢 SIN RESULTADOS */
            <div className="search-no-results">
              <div className="no-results-icon">🔍</div>
              <p>No se encontraron productos</p>
              <span>Intenta con otra búsqueda</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
