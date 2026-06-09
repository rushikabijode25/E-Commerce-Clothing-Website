import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiStar, FiShoppingCart, FiZap, FiChevronLeft, FiInfo, FiCheck, FiUser } from 'react-icons/fi';
import './ProductDetail.css';

const API_URL = (import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api');

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);

  const { user } = useAuth();
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user && user.name) {
      setReviewName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await axios.post(`${API_URL}/products/${product.id}/reviews`, {
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      setProduct(res.data.product);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    let hasError = false;
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      hasError = true;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      hasError = true;
    }
    if (hasError) return;

    setSizeError(false);
    setColorError(false);
    addToCart(product, selectedSize || 'One Size', selectedColor || '', quantity);
  };

  const handleBuyNow = () => {
    let hasError = false;
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      hasError = true;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      hasError = true;
    }
    if (hasError) return;

    setSizeError(false);
    setColorError(false);
    addToCart(product, selectedSize || 'One Size', selectedColor || '', quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="product-detail page-enter">
        <div className="product-detail__inner container">
          <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div className="skeleton" style={{ width: '40%', height: '16px' }} />
            <div className="skeleton" style={{ width: '70%', height: '32px' }} />
            <div className="skeleton" style={{ width: '30%', height: '24px' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail__not-found container page-enter">
        <h2>Product not found</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="product-detail page-enter">
      <div className="product-detail__inner container">
        <button className="product-detail__back" onClick={() => navigate(-1)}>
          <FiChevronLeft size={20} />
          Back
        </button>

        <div className="product-detail__layout">
          {/* Image Section */}
          <div className="product-detail__image-section">
            <div className="product-detail__image-wrapper">
              <img src={product.image} alt={product.name} className="product-detail__image" />
              {product.badge && (
                <span className="product-detail__badge">{product.badge}</span>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="product-detail__info">
            <span className="product-detail__category">{product.category}</span>
            <h1 className="product-detail__name">{product.name}</h1>

            <div className="product-detail__rating">
              <div className="product-detail__stars">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating) ? 'star--filled' : 'star--empty'}
                  />
                ))}
              </div>
              <span className="product-detail__rating-text">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <div className="product-detail__price-section">
              <span className="product-detail__price">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="product-detail__price-original">
                ₹{Math.round(product.price * 1.4).toLocaleString('en-IN')}
              </span>
              <span className="product-detail__discount">-40% OFF</span>
            </div>

            <p className="product-detail__description">{product.description}</p>

            {/* Colors */}
            {product.colors && (
              <div className="product-detail__colors">
                <h3>Select Color {colorError && <span className="size-error">⚠ Please select a color</span>}</h3>
                <div className="product-detail__color-list">
                  {product.colors.map((color, i) => (
                    <button 
                      key={i} 
                      className={`color-btn ${selectedColor === color ? 'color-btn--active' : ''}`}
                      onClick={() => { setSelectedColor(color); setColorError(false); }}
                    >
                      {selectedColor === color && <FiCheck size={14} />}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
            <div className="product-detail__sizes">
              <div className="product-detail__sizes-header">
                <h3>Select Size {sizeError && <span className="size-error">⚠ Please select a size</span>}</h3>
                {product.sizeChart && (
                <button className="product-detail__size-chart-btn" onClick={() => setShowSizeChart(!showSizeChart)}>
                  <FiInfo size={16} />
                  Size Chart
                </button>
                )}
              </div>
              <div className="product-detail__size-options">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'size-btn--active' : ''}`}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    id={`size-${size}`}
                  >
                    {selectedSize === size && <FiCheck size={14} />}
                    {size}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Size Chart Modal */}
            {showSizeChart && product.sizeChart && (
              <div className="size-chart">
                <div className="size-chart__header">
                  <h3>📏 Size Chart</h3>
                  <button onClick={() => setShowSizeChart(false)} className="size-chart__close">✕</button>
                </div>
                <div className="size-chart__table-wrapper">
                  <table className="size-chart__table">
                    <thead>
                      <tr>
                        {product.sizeChart.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeChart.rows.map((row, i) => (
                        <tr key={i} className={selectedSize === row[0] ? 'size-chart__row--active' : ''}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="product-detail__quantity">
              <h3>Quantity</h3>
              <div className="product-detail__qty-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="product-detail__actions">
              <button className="btn-secondary product-detail__add-btn" onClick={handleAddToCart} id="add-to-cart-btn">
                <FiShoppingCart size={18} />
                Add to Cart
              </button>
              <button className="btn-primary product-detail__buy-btn" onClick={handleBuyNow} id="buy-now-btn">
                <FiZap size={18} />
                Buy Now
              </button>
            </div>

            {/* Extra Info */}
            <div className="product-detail__extras">
              <div className="product-detail__extra">🚚 Free shipping on orders above ₹2,000</div>
              <div className="product-detail__extra">🔄 7-day easy returns</div>
              <div className="product-detail__extra">💳 Cash on Delivery available</div>
            </div>

            {/* Reviews Section */}
            <div className="product-detail__reviews-section">
              <h3>Customer Reviews <span className="review-count">({product.reviews || 0})</span></h3>
              
              <div className="reviews-list">
                {(!product.reviewsArray || product.reviewsArray.length === 0) ? (
                  <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                ) : (
                  product.reviewsArray.map((rev, idx) => (
                    <div key={idx} className="review-card">
                      <div className="review-card__header">
                        <div className="review-card__user">
                          <div className="review-card__avatar"><FiUser /></div>
                          <strong>{rev.name}</strong>
                        </div>
                        <div className="review-card__stars">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} size={14} className={i < rev.rating ? 'star--filled' : 'star--empty'} />
                          ))}
                        </div>
                      </div>
                      <p className="review-card__comment">{rev.comment}</p>
                      <span className="review-card__date">{new Date(rev.date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="review-form-container">
                <h4>Write a Review</h4>
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={reviewName} 
                      onChange={e => setReviewName(e.target.value)} 
                      placeholder="Enter your name"
                      disabled={!!user?.name}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="rating-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FiStar 
                          key={star} 
                          size={24} 
                          className={star <= reviewRating ? 'star--filled cursor-pointer' : 'star--empty cursor-pointer'} 
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Review</label>
                    <textarea 
                      required 
                      rows="4" 
                      value={reviewComment} 
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="What did you like or dislike?"
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
