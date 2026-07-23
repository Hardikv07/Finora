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
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: err.message?.includes('Not authenticated')
          ? 'Please log in to use Finora Copilot.'
          : 'I encountered an issue reaching the AI engine. Please check that the backend server is running and try again.',
        cards: [],
        charts: [],
        followUps: ['Try again', 'Ask a different question'],
        isError: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message);
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
