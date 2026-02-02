import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './ChatBot.css';

// PUBLIC_INTERFACE
/**
 * ChatBot component - floating overlay for AI-powered explanations.
 * Provides contextual help and insights about flood risk data.
 */
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m CHRIS AI Assistant. Ask me about flood risk predictions, sponge zones, or climate data.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: inputValue };
    setMessages([...messages, userMessage]);

    // Simulate bot response (to be connected to backend AI endpoint in future)
    setTimeout(() => {
      const botResponse = {
        role: 'assistant',
        content: 'This is a placeholder response. Connect this to your AI backend endpoint for real-time answers about CHRIS data.',
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);

    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        className="chatbot-toggle"
        onClick={toggleChat}
        aria-label="Toggle chatbot"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} />
      </button>

      {/* Chat overlay */}
      {isOpen && (
        <div className="chatbot-overlay">
          <div className="chatbot-header">
            <h3>CHRIS AI Assistant</h3>
            <button onClick={toggleChat} aria-label="Close chat">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about flood risk, zones, or climate..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleSend} aria-label="Send message">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
