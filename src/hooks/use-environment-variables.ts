'use client';

import { useState, useEffect } from 'react';

interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export function useEnvironmentVariables() {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = () => {
    try {
      const saved = localStorage.getItem('environmentVariables');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Migration: Change API_BASE_URL to BASE_URL
        const migratedVariables = parsed.map((v: EnvironmentVariable) => {
          if (v.key === 'API_BASE_URL') {
            return { ...v, key: 'BASE_URL' };
          }
          return v;
        });

        // Remove duplicates (keep BASE_URL if both exist)
        const uniqueVariables = migratedVariables.filter(
          (
            v: EnvironmentVariable,
            index: number,
            self: EnvironmentVariable[]
          ) =>
            index ===
            self.findIndex((t: EnvironmentVariable) => t.key === v.key)
        );

        setVariables(uniqueVariables);
        localStorage.setItem(
          'environmentVariables',
          JSON.stringify(uniqueVariables)
        );
      } else {
        // Set default variables with BASE_URL pre-filled as first entry
        const defaults: EnvironmentVariable[] = [
          { key: 'BASE_URL', value: 'https://api.example.com', enabled: true },
          { key: 'API_VERSION', value: 'v1', enabled: true },
          { key: 'AUTH_TOKEN', value: '', enabled: false },
        ];
        setVariables(defaults);
        localStorage.setItem('environmentVariables', JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Failed to load environment variables:', error);
      // Fallback defaults
      const fallbackDefaults: EnvironmentVariable[] = [
        { key: 'BASE_URL', value: 'https://api.example.com', enabled: true },
        { key: 'API_VERSION', value: 'v1', enabled: true },
        { key: 'AUTH_TOKEN', value: '', enabled: false },
      ];
      setVariables(fallbackDefaults);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVariables = (newVariables: EnvironmentVariable[]) => {
    try {
      setVariables(newVariables);
      localStorage.setItem(
        'environmentVariables',
        JSON.stringify(newVariables)
      );
    } catch (error) {
      console.error('Failed to save environment variables:', error);
      throw error;
    }
  };

  const addVariable = (key: string, value: string, enabled: boolean = true) => {
    const newVariables = [...variables, { key, value, enabled }];
    saveVariables(newVariables);
  };

  const updateVariable = (
    index: number,
    updates: Partial<EnvironmentVariable>
  ) => {
    const newVariables = variables.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    saveVariables(newVariables);
  };

  const deleteVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    saveVariables(newVariables);
  };

  const getVariableValue = (key: string): string => {
    const variable = variables.find((v) => v.key === key && v.enabled);
    return variable ? variable.value : '';
  };

  const substituteVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = getVariableValue(key);
      return value !== '' ? value : match;
    });
  };

  return {
    variables,
    isLoading,
    saveVariables,
    addVariable,
    updateVariable,
    deleteVariable,
    getVariableValue,
    substituteVariables,
    loadVariables,
  };
}
