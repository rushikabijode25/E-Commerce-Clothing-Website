import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import axios from 'axios';
import './Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! 👋 Welcome to LUXE STORE. I can help you check your order status or cancel an order. Just type something like 'check ORD-1' or 'cancel ORD-1'.", sender: "bot" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const processBotResponse = async (userText) => {
    const text = userText.trim().toLowerCase();

    // Check for Order ID pattern
    const orderMatch = text.match(/ord-\d+/i);
    
    if (orderMatch) {
      const orderId = orderMatch[0].toUpperCase();

      // CANCEL ORDER logic
      if (text.includes('cancel')) {
        try {
          await axios.post(`${API_URL}/orders/${orderId}/tracking`, {
            status: 'Cancelled',
            description: 'Cancelled by customer via chatbot request.'
          });
          return `Your order **${orderId}** has been successfully cancelled. You will receive an email confirmation shortly (if you logged in).`;
        } catch (err) {
          if (err.response?.status === 404) return `I couldn't find order **${orderId}**. Please double-check your order number.`;
          return `Sorry, I encountered an error trying to cancel **${orderId}**. It may have already shipped!`;
        }
      }

      // CHECK STATUS logic
      try {
        const res = await axios.get(`${API_URL}/orders/${orderId}`);
        const order = res.data;
        
        let response = `Order **${orderId}** details:\n`;
        response += `📦 Status: **${order.status}**\n`;
        response += `💰 Total: ₹${order.total?.toLocaleString('en-IN')}\n`;
        response += `You ordered ${order.items?.length || 0} item(s).\n\n`;
        
        if (order.status !== 'Cancelled' && order.status !== 'Delivered') {
          response += `*If you wish to cancel this order, simply reply with "cancel ${orderId}".*`;
        }
        
        return response;
      } catch (err) {
        if (err.response?.status === 404) return `I checked the system but couldn't find any order matching **${orderId}**. Please check your number again.`;
        return `Oops, having trouble connecting to the database. Please try again in a moment.`;
      }
    }

    // Default Fallbacks
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return "Hello! If you have an order number (like ORD-5), type 'status ORD-5' to see where it is, or 'cancel ORD-5' to cancel it.";
    }
    
    if (text.includes('help')) {
      return "I can help you manage your orders! \n• To check an order, type: 'Track ORD-1'\n• To cancel, type: 'Cancel ORD-1'";
    }

    return "I'm a simple bot focused on tracking and cancelling orders. Could you please provide your Order ID (like ORD-1) so I can help you?";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input;
    
    // 1. Add user message
    setMessages(prev => [...prev, { text: userText, sender: "user" }]);
    setInput('');
    setIsTyping(true);
    
    // 2. Fetch bot response
    const botReplyString = await processBotResponse(userText);
    
    // 3. Fake typing delay
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { text: botReplyString, sender: "bot" }
      ]);
    }, 1200);
  };

  return (
    <div className="chatbot-wrapper">
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <h4>Luxe Assistant</h4>
              <span className="chatbot-status">Online</span>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)}>
            <FiX />
          </button>
        </div>
        
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`} style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="message bot typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px 16px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="chatbot-quick-replies">
          <button 
            type="button"
            onClick={() => setInput('Track ORD-')}
            style={{ fontSize: '0.75rem', padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--emerald-accent, #059669)', background: 'rgba(5, 150, 105, 0.05)', color: 'var(--emerald-accent, #059669)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' }}
          >
            📦 Track Order
          </button>
          <button 
            type="button"
            onClick={() => setInput('Cancel ORD-')}
            style={{ fontSize: '0.75rem', padding: '8px 14px', borderRadius: '20px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' }}
          >
            ❌ Cancel Order
          </button>
          <button 
            type="button"
            onClick={() => setInput('Need help with shopping')}
            style={{ fontSize: '0.75rem', padding: '8px 14px', borderRadius: '20px', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s ease' }}
          >
            🛍️ Shopping Help
          </button>
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Type 'check ORD-1'..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="chatbot-send">
            <FiSend size={18} />
          </button>
        </form>
      </div>

      <button 
        className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open Help Assistant"
      >
        <FiMessageSquare size={24} />
      </button>
    </div>
  );
};

export default Chatbot;
