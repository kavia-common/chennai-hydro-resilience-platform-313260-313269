import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import './ChatBot.css';

// PUBLIC_INTERFACE
/**
 * ChatBot overlay component for AI-powered assistance.
 * Provides explanations and answers about CHRIS features and data.
 */
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m CHRIS AI Assistant. How can I help you understand our flood risk data?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use relative path - interceptor will convert to absolute HTTPS URL
      const response = await api.post('chatbot', {
        query: userMessage.text,
        context: {
          current_page: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data?.response || 'I\'m here to help! Could you rephrase that?',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('ChatBot API error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} />
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>CHRIS AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close chatbot">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">{message.text}</div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
