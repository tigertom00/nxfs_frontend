'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  args?: any[];
}

export function MobileDebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on mobile devices
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    // Override console methods to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: LogEntry['type'], message: string, ...args: any[]) => {
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message: String(message),
        args: args.length > 0 ? args : undefined,
      };

      setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args[0], ...args.slice(1));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args[0], ...args.slice(1));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args[0], ...args.slice(1));
    };

    // Restore original console methods on cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogTypeStyles = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Show toggle button on mobile only
  const isMobile = typeof window !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 p-0"
          variant="outline"
          title="Show Debug Console"
        >
          🐛
        </Button>
      )}

      {/* Debug Console */}
      {isVisible && (
        <Card className="fixed bottom-4 left-4 right-4 top-20 z-50 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Mobile Debug Console</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={clearLogs}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsVisible(false)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No logs yet...
                  </div>
                ) : (
                  logs.map(log => (
                    <div
                      key={log.id}
                      className={`p-2 rounded text-xs border ${getLogTypeStyles(log.type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs opacity-60">
                          {log.timestamp}
                        </span>
                        <span className="text-xs font-semibold uppercase">
                          {log.type}
                        </span>
                      </div>
                      <div className="mt-1">
                        <pre className="whitespace-pre-wrap text-xs">
                          {log.message}
                        </pre>
                        {log.args && log.args.length > 0 && (
                          <pre className="whitespace-pre-wrap text-xs opacity-75 mt-1">
                            {log.args.map(arg =>
                              typeof arg === 'object'
                                ? JSON.stringify(arg, null, 2)
                                : String(arg)
                            ).join(' ')}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  );
}