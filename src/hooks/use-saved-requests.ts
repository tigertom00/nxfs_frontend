'use client';

import { useState, useEffect } from 'react';

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Array<{ key: string; value: string }>;
  body: string;
  token: string;
  createdAt: Date;
}

export function useSavedRequests() {
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedRequests();
  }, []);

  const loadSavedRequests = () => {
    try {
      const saved = localStorage.getItem('savedApiRequests');
      if (saved) {
        const parsed = JSON.parse(saved);
        const requests = parsed.map((req: any) => ({
          ...req,
          createdAt: new Date(req.createdAt),
        }));
        setSavedRequests(requests);
      }
    } catch (error) {
      console.error('Failed to load saved requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRequest = (request: Omit<SavedRequest, 'id' | 'createdAt'>) => {
    try {
      const newRequest: SavedRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date(),
      };

      const updated = [...savedRequests, newRequest];
      setSavedRequests(updated);
      localStorage.setItem('savedApiRequests', JSON.stringify(updated));

      return newRequest;
    } catch (error) {
      console.error('Failed to save request:', error);
      throw error;
    }
  };

  const deleteRequest = (id: string) => {
    try {
      const updated = savedRequests.filter((req) => req.id !== id);
      setSavedRequests(updated);
      localStorage.setItem('savedApiRequests', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete request:', error);
      throw error;
    }
  };

  const updateRequest = (id: string, updates: Partial<SavedRequest>) => {
    try {
      const updated = savedRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      );
      setSavedRequests(updated);
      localStorage.setItem('savedApiRequests', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update request:', error);
      throw error;
    }
  };

  const loadRequest = (id: string) => {
    return savedRequests.find((req) => req.id === id);
  };

  return {
    savedRequests,
    isLoading,
    saveRequest,
    deleteRequest,
    updateRequest,
    loadRequest,
    loadSavedRequests,
  };
}
