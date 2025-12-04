// 🔍 **SEARCHCONTEXT.JS** - CONTEXTO GLOBAL PARA MANEJAR LA BÚSQUEDA
import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe ser usado dentro de un SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 📦 TODOS LOS PRODUCTOS DISPONIBLES (base de datos simulada)
  const allProducts = [
    // Catálogo oficial (IDs 1-18) alineado con Products.js / ProductDetail.js
    { id: 1, name: "Audemars Piguet Royal Oak", price: 45999, originalPrice: 52999, image: "/Hombre/Audemars piguet.png", category: "luxury", badge: "Premium", reviews: 234, gender: "men", description: "Diseño octogonal icónico en acero de alta gama con movimiento automático de precisión" },
    { id: 2, name: "Cartier Tank Cuero", price: 8999, originalPrice: 10999, image: "/Hombre/Cartier Cuero.png", category: "classic", badge: "Elegante", reviews: 189, gender: "men", description: "Clásico atemporal con caja rectangular y correa de cuero genuino" },
    { id: 3, name: "Cartier Tank Metálico", price: 12999, originalPrice: 15999, image: "/Hombre/Cartier Metalic.png", category: "luxury", badge: "Premium", reviews: 156, gender: "men", description: "Versión con brazalete metálico pulido y estética refinada" },
    { id: 4, name: "Casio G-Shock", price: 399, originalPrice: 499, image: "/Hombre/Casio G shock.png", category: "sport", badge: "Bestseller", reviews: 892, gender: "men", description: "Resistencia extrema a impactos y funcionalidades digitales avanzadas" },
    { id: 5, name: "Casio Water Resist", price: 299, originalPrice: 389, image: "/Hombre/Casio Water resist.png", category: "sport", badge: "Nuevo", reviews: 567, gender: "men", description: "Modelo fiable resistente al agua ideal para uso diario activo" },
    { id: 6, name: "G-Shock Protection", price: 449, originalPrice: 549, image: "/Hombre/G Shock protection.png", category: "sport", badge: "Resistente", reviews: 423, gender: "men", description: "Protección reforzada y diseño robusto con estética táctica" },
    { id: 7, name: "Hamilton Automatic", price: 1899, originalPrice: 2299, image: "/Hombre/Hamilton automatic.png", category: "classic", badge: "Automático", reviews: 234, gender: "men", description: "Movimiento automático suizo con esfera limpia de inspiración vintage" },
    { id: 8, name: "Omega Seamaster", price: 6999, originalPrice: 8999, image: "/Hombre/Omega sterany.png", category: "luxury", badge: "Profesional", reviews: 345, gender: "men", description: "Reloj de buceo profesional con excelente legibilidad y calibre de alta precisión" },
    { id: 9, name: "Patek Philippe Calatrava", price: 32999, originalPrice: 39999, image: "/Hombre/Patek Philippe.png", category: "luxury", badge: "Exclusivo", reviews: 89, gender: "men", description: "Minimalismo elegante con acabados artesanales excepcionales" },
    { id: 10, name: "Poedagar 930", price: 199, originalPrice: 299, image: "/Hombre/poedagar 930.png", category: "casual", badge: "Oferta", reviews: 678, gender: "men", description: "Estética moderna económica con presencia llamativa en muñeca" },
    { id: 11, name: "Richard Mille", price: 89999, originalPrice: 105999, image: "/Hombre/Richard Mille.png", category: "luxury", badge: "Ultra Premium", reviews: 45, gender: "men", description: "Ingeniería avanzada en materiales compuestos y diseño esquelético" },
    { id: 12, name: "Rolex Submariner", price: 18999, originalPrice: 22999, image: "/Hombre/Rolex Submarino.png", category: "luxury", badge: "Icónico", reviews: 567, gender: "men", description: "El estándar de relojes de buceo: robusto, preciso y reconocible" },
    { id: 13, name: "Seiko Mod", price: 599, originalPrice: 799, image: "/Hombre/Seiko mod.png", category: "casual", badge: "Moderno", reviews: 234, gender: "men", description: "Customización estilo diver con fiabilidad japonesa" },
    { id: 14, name: "Cartier Oro 18k", price: 15999, originalPrice: 18999, image: "/Mujer/Cartier oro 18k.png", category: "luxury", badge: "Oro 18k", reviews: 187, gender: "women", description: "Caja y detalles en oro 18k que irradian sofisticación" },
    { id: 15, name: "Chopard Happy Diamonds", price: 12999, originalPrice: 15999, image: "/Mujer/Chopard.png", category: "luxury", badge: "Diamantes", reviews: 298, gender: "women", description: "Diamantes móviles emblemáticos que aportan brillo dinámico" },
    { id: 16, name: "Omega Constellation", price: 4999, originalPrice: 6999, image: "/Mujer/Omega complelltion.png", category: "elegant", badge: "Elegante", reviews: 156, gender: "women", description: "Diseño con garras laterales y precisión certificada" },
    { id: 17, name: "Patek Philippe Genève", price: 28999, originalPrice: 34999, image: "/Mujer/Patek Philippe geneve.png", category: "luxury", badge: "Exclusivo", reviews: 67, gender: "women", description: "Alta relojería femenina con detalles artesanales de lujo" },
    { id: 18, name: "TAG Heuer Aquaracer", price: 2999, originalPrice: 3999, image: "/Mujer/Tag heuer Aquaracer.png", category: "sport", badge: "Deportivo", reviews: 234, gender: "women", description: "Rendimiento deportivo y elegancia funcional para uso acuático" },
  ];

  // 🔍 FUNCIÓN DE BÚSQUEDA
  const normalize = (str='') => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .replace(/[^a-z0-9\s.-]/g,'')
    .trim();

  // Diccionario de sinónimos / correcciones comunes
  const synonymMap = {
    'richard mile': 'richard mille',
    'mile': 'mille',
    'g shock': 'g-shock',
    'gshock': 'g-shock',
    'aquaracer': 'tag heuer aquaracer',
    'tag heuer': 'tag heuer aquaracer',
    'poedagar': 'poedagar 930',
    'water resist': 'casio water resist',
    'seiko': 'seiko mod',
    'patek': 'patek philippe',
  };

  // Levenshtein distance para fuzzy matching básico
  const levenshtein = (a = '', b = '') => {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      const ca = a[i - 1];
      for (let j = 1; j <= n; j++) {
        const cb = b[j - 1];
        dp[i][j] = ca === cb ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  };

  const applySynonyms = (term) => {
    let t = term;
    Object.entries(synonymMap).forEach(([k, v]) => {
      if (t.includes(k)) t = t.replace(k, v);
    });
    return t;
  };

  // 🔍 FUNCIÓN PRINCIPAL DE BÚSQUEDA
  const searchProducts = (term) => {
    setSearchTerm(term);
    setIsSearching(true);

    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let nTerm = normalize(term);
    nTerm = applySynonyms(nTerm);
    const termTokens = nTerm.split(/\s+/).filter(Boolean);

    setTimeout(() => {
      const scored = [];

      for (const product of allProducts) {
        const nameN = normalize(product.name);
        const blob = normalize([product.name, product.category, product.description, product.badge].join(' '));

        let matchType = null;
        let score = 100; // menor mejor

        if (blob.includes(nTerm)) {
          matchType = 'substring';
          score = 5;
          if (nameN.startsWith(nTerm)) score = 2;
        } else {
          // Fuzzy: evaluar distancia respecto al nombre completo y tokens
          const nameTokens = nameN.split(/\s+/);
          const distFull = levenshtein(nameN, nTerm);
          let bestTokenDist = Infinity;
          for (const tt of termTokens) {
            for (const nt of nameTokens) {
              const d = levenshtein(nt, tt);
              if (d < bestTokenDist) bestTokenDist = d;
            }
          }
          const effectiveDist = Math.min(distFull, bestTokenDist);

          // Reglas más estrictas:
          // - Si la query es corta (<=4 chars) solo permitimos fuzzy con distancia 0 (ya capturado arriba) o 1
          // - En queries medianas (5-6) permitimos distancia <=1
          // - En queries largas (>=7) permitimos distancia <=2
          let maxAllowed = 0;
          if (nTerm.length <= 4) maxAllowed = 1; else if (nTerm.length <= 6) maxAllowed = 1; else maxAllowed = 2;

          if (effectiveDist <= maxAllowed) {
            matchType = 'fuzzy';
            // Score proporcional: penaliza según distancia y longitud (más corto = más penalizado)
            score = 40 + (effectiveDist * 5) + Math.max(0, 6 - nTerm.length);
          }
        }

        if (matchType) {
          scored.push({
            product,
            score,
            matchType
          });
        }
      }

      scored.sort((a, b) => a.score - b.score);
      const results = scored.map(s => ({
        ...s.product,
        image: s.product.image || '/Reloj1.png'
      }));

      setSearchResults(results);
      setIsSearching(false);
    }, 80); // un poco más rápido
  };

  // 🧹 FUNCIÓN PARA LIMPIAR BÚSQUEDA
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 📦 FUNCIÓN PARA OBTENER PRODUCTOS POR CATEGORÍA
  const getProductsByCategory = (category) => {
    return allProducts.filter(product => product.category === category);
  };

  // 👨👩 FUNCIÓN PARA OBTENER PRODUCTOS POR GÉNERO
  const getProductsByGender = (gender) => {
    return allProducts.filter(product => product.gender === gender || product.gender === 'unisex');
  };

  // 📦 FUNCIÓN PARA OBTENER TODOS LOS PRODUCTOS
  const getAllProducts = () => {
    return allProducts;
  };

  // 🔍 FUNCIÓN PARA OBTENER PRODUCTO POR ID
  const getProductById = (id) => {
    return allProducts.find(product => product.id === parseInt(id));
  };

  const value = {
    searchTerm,
    searchResults,
    isSearching,
    allProducts,
    searchProducts,
    clearSearch,
    getProductsByCategory,
    getProductsByGender,
    getAllProducts,
    getProductById
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;
