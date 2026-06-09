import { Routes, Route, Navigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import { FiCheckCircle } from 'react-icons/fi';

function App() {
  const { toast } = useCart();

  return (
    <div className="app">
      {toast && (
        <div className="toast">
          <FiCheckCircle className="toast-icon" />
          {toast}
        </div>
      )}
      
      <Routes>
        {/* User Facing Routes */}
        <Route path="/" element={<UserLayout><Home /></UserLayout>} />
        <Route path="/product/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
        <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
        <Route path="/wishlist" element={<UserLayout><Wishlist /></UserLayout>} />
        <Route path="/orders" element={<UserLayout><Orders /></UserLayout>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="order" element={<Navigate to="/admin/orders" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
        </Route>
      </Routes>
    </div>
  );
}

const UserLayout = ({ children }) => (
  <>
    <Navbar />
    <CartSidebar />
    <main className="main-content">
      {children}
    </main>
    <Footer />
    <Chatbot />
  </>
);

export default App;
