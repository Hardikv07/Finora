/**
 * useCopilot — Manages the Finora Copilot chat state
 * Maintains message history, loading state, and API communication
 */
import { useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';

export const useCopilot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Keep last 4 turns (8 messages: 4 user + 4 assistant) for context
  const historyRef = useRef([]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Build history from last 4 conversation pairs
    const context = historyRef.current.slice(-8).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await apiService.copilotChat(text.trim(), context);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
        cards: response.cards || [],
        charts: response.charts || [],
        followUps: response.followUps || [],
        highlights: response.highlights || [],
        confidence: response.confidence,
        intent: response.intent,
        processingMs: response.processingMs,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update history ref for context continuity
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: response.answer },
      ].slice(-8);
    } catch (err) {
      // Classify the error for a user-appropriate message
      const msg = err.message || '';
      let displayMessage;

      if (msg.includes('Not authenticated') || msg.includes('No Token') || msg.includes('Invalid Token')) {
        displayMessage = 'Please log in to use Finora Copilot.';
      } else if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('429')) {
        displayMessage = 'The AI service is temporarily rate-limited. Please wait a moment and try again.';
      } else if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
        displayMessage = 'AI engine configuration error. Please contact support.';
      } else if (msg.includes('timed out') || msg.includes('AbortError') || msg.includes('timeout')) {
        displayMessage = 'The request timed out. Your connection may be slow — please try again.';
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
        displayMessage = 'Cannot reach the backend server. Please ensure it is running on port 7777.';
      } else if (msg.includes('AI engine error:')) {
        // Dev-mode error: the backend surfaced the specific Gemini error — show it directly
        displayMessage = msg;
      } else {
        displayMessage = 'Something went wrong. Please try again in a moment.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: displayMessage,
        cards: [],
        charts: [],
        followUps: ['Try again', 'Ask a different question'],
        isError: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
};
