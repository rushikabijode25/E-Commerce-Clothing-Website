import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import PolicyModal from '../components/PolicyModal';
import { FiArrowRight, FiSearch, FiHeart, FiShoppingBag, FiClock, FiFilter, FiX, FiTruck, FiRefreshCw, FiStar } from 'react-icons/fi';
import './Home.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  
  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  useEffect(() => {
    // If URL has ?category= parameter, initialize it into state
    const urlCategory = searchParams.get('category');
    if (urlCategory && urlCategory !== 'all') {
      setSelectedCategories([urlCategory]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/products`);
        setProducts(res.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Dynamically extract unique sizes and colors from all products
  const availableSizes = useMemo(() => {
    const rawSizes = products.flatMap(p => p.sizes || []);
    return Array.from(new Set(rawSizes)).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const rawColors = products.flatMap(p => p.colors || []);
    return Array.from(new Set(rawColors)).sort();
  }, [products]);

  // Handle Checkbox Changes
  const toggleSelection = (stateUpdater, value) => {
    stateUpdater(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search Filter
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const isNew = p.badge && p.badge.toLowerCase().includes('new');
        if (selectedCategories.includes('new') && isNew) return true;
        return selectedCategories.includes(p.category);
      });
    }

    // Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes && p.sizes.some(s => selectedSizes.includes(s)));
    }

    // Color Filter
    if (selectedColors.length > 0) {
      result = result.filter(p => p.colors && p.colors.some(c => selectedColors.includes(c)));
    }

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return b.id - a.id;
      return 0;
    });
  }, [products, searchQuery, selectedCategories, selectedSizes, selectedColors, sortBy]);

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
  };

  return (
    <div className="home page-enter">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__gradient" />
          <motion.div 
            className="hero__pattern"
            animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
          <motion.div className="hero__orb hero__orb-1" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
          <motion.div className="hero__orb hero__orb-2" animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }} />
        </div>
        
        <div className="hero__content container">
          <div className="hero__content-inner">
            <div className="hero__content-left">
              <motion.div className="hero__limited-offer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
                <span>✨ Limited Offer</span>
                <div className="hero__limited-divider" />
                <span>Up to 30% OFF • This Week Only</span>
                <FiArrowRight />
              </motion.div>

              <motion.span className="hero__badge-premium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                ✨ PREMIUM COLLECTION 2028
              </motion.span>
              
              <motion.h1 className="hero__title" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}>
                {"Elevate Your ".split(" ").map((word, i) => (
                  <motion.span key={i} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} style={{ display: 'inline-block', marginRight: '0.25em' }}>{word}</motion.span>
                ))}
                <motion.span className="emerald-title-stroke" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} style={{ display: 'inline-block' }}>Style</motion.span>
              </motion.h1>
              
              <motion.p className="hero__subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                Discover premium clothing and footwear for those who demand excellence. Where everyday comfort meets high-fashion luxury.
              </motion.p>
              
              <motion.div className="hero__actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <a href="#products" className="btn-primary" id="shop-now-btn">Shop Now <FiArrowRight /></a>
                <a href="#products" className="btn-outline"><FiStar className="btn-outline__icon" /> Explore Collection</a>
              </motion.div>

              <motion.div className="hero__features-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <div className="hero__feature-item"><span className="hero__feature-icon"><FiTruck /></span><div className="hero__feature-text"><strong>Free Shipping</strong><span>On orders above ₹2,999</span></div></div>
                <div className="hero__feature-item"><span className="hero__feature-icon"><FiRefreshCw /></span><div className="hero__feature-text"><strong>Easy Returns</strong><span>30-day return policy</span></div></div>
                <div className="hero__feature-item"><span className="hero__feature-icon"><FiStar /></span><div className="hero__feature-text"><strong>25,000+ Happy Customers</strong><span>Top rated store</span></div></div>
              </motion.div>
            </div>

            <div className="hero__showcase">
              <motion.div className="hero__card hero__card-1" initial={{ opacity: 0, x: 50, rotate: 5 }} animate={{ opacity: 1, x: 0, rotate: 2 }} transition={{ duration: 0.8, delay: 0.4 }}>
                <div className="hero__card-tag">BESTSELLER</div>
                <div className="hero__card-image"><div className="hero__card-favorite"><FiHeart /></div><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop" alt="Urban Street Sneakers" /></div>
                <div className="hero__card-info">
                  <h4>Urban Street Sneakers</h4>
                  <div className="hero__card-rating">⭐⭐⭐⭐⭐ <span>(4.9)</span></div>
                  <div className="hero__card-footer">
                    <div className="hero__card-price">₹3,499</div>
                    <button className="hero__card-cart-btn"><FiShoppingBag /> Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Shop / Products Layout */}
      <div className="shop-section" id="products">
        <div className="container">
          
          <div className="shop-header">
            <div>
              <h2 className="shop-title"><FiShoppingBag /> The Collection</h2>
              <p className="shop-subtitle">Refine your selection using our advanced filters.</p>
            </div>
            <div className="shop-actions">
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="newest">Latest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <button className="mobile-filter-btn" onClick={() => setIsMobileFilterOpen(true)}>
                <FiFilter /> Filters
              </button>
            </div>
          </div>

          <div className="shop-layout">
            {/* Sidebar Filters */}
            <aside className={`shop-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
              <div className="sidebar-header-mobile">
                <h3>Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)}><FiX size={24} /></button>
              </div>

              {/* Category Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Category</h4>
                <div className="filter-options">
                  {[
                    { id: 'new', label: '✨ New Arrivals' },
                    { id: 'clothes', label: 'Clothing' },
                    { id: 'shoes', label: 'Shoes' },
                    { id: 'accessories', label: 'Accessories' }
                  ].map(cat => (
                    <label key={cat.id} className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleSelection(setSelectedCategories, cat.id)}
                      />
                      <span className="checkmark"></span>
                      <span className="label-text">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div className="filter-group">
                  <h4 className="filter-title">Size</h4>
                  <div className="filter-options size-grid">
                    {availableSizes.map(size => (
                      <label key={size} className="checkbox-container size-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedSizes.includes(size)}
                          onChange={() => toggleSelection(setSelectedSizes, size)}
                        />
                        <span className="checkmark-box">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div className="filter-group">
                  <h4 className="filter-title">Color</h4>
                  <div className="filter-options color-grid">
                    {availableColors.map(color => (
                      <label key={color} className="color-checkbox" title={color}>
                        <input 
                          type="checkbox" 
                          checked={selectedColors.includes(color)}
                          onChange={() => toggleSelection(setSelectedColors, color)}
                        />
                        <span 
                          className="color-swatch flex items-center justify-center" 
                          style={{ background: color.toLowerCase() === 'white' ? '#f8f9fa' : color, border: color.toLowerCase() === 'white' ? '1px solid #ddd' : 'none' }}
                        >
                          {selectedColors.includes(color) && <span className="text-white drop-shadow-md text-xs">✓</span>}
                        </span>
                        <span className="color-name">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters Button */}
              {(selectedCategories.length > 0 || selectedSizes.length > 0 || selectedColors.length > 0) && (
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedSizes([]);
                    setSelectedColors([]);
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </aside>

            {/* Mobile overlay */}
            {isMobileFilterOpen && <div className="sidebar-overlay" onClick={() => setIsMobileFilterOpen(false)}></div>}

            {/* Product Grid */}
            <div className="shop-main">
              <div className="results-summ">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </div>

              {loading ? (
                <div className="products-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="product-skeleton">
                      <div className="skeleton product-skeleton__image" />
                      <div className="product-skeleton__info">
                        <div className="skeleton product-skeleton__category" />
                        <div className="skeleton product-skeleton__name" />
                        <div className="skeleton product-skeleton__price" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="products-empty">
                  <div className="empty-icon">😢</div>
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                  <button className="btn-primary" onClick={() => { setSearchQuery(''); setSelectedCategories([]); setSelectedSizes([]); setSelectedColors([]); }}>
                    Reset Everything
                  </button>
                </div>
              ) : (
                <motion.div 
                  className="products-grid"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <AnimatePresence>
                    {filteredProducts.map(product => (
                      <motion.div 
                        key={product.id} 
                        variants={fadeInUp}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Newsletter />

      <PolicyModal 
        type={activePolicy} 
        isOpen={isPolicyOpen} 
        onClose={() => setIsPolicyOpen(false)} 
      />
    </div>
  );
};

export default Home;
