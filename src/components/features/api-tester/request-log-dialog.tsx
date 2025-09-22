'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface RequestLog {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  timestamp: Date;
  responseTime: number;
  headers: Record<string, string>;
  response: string;
  error?: string;
}

interface RequestLogDialogProps {
  children: React.ReactNode;
  log: RequestLog;
}

export function RequestLogDialog({ children, log }: RequestLogDialogProps) {
  const [open, setOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get':
        return 'method-get';
      case 'post':
        return 'method-post';
      case 'put':
        return 'method-put';
      case 'delete':
        return 'method-delete';
      case 'patch':
        return 'method-patch';
      case 'head':
        return 'method-head';
      case 'options':
        return 'method-options';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className={getMethodBadgeClass(log.method)}>
              {log.method}
            </Badge>
            <DialogTitle className="truncate">{log.url}</DialogTitle>
          </div>
          <DialogDescription>
            {log.timestamp.toLocaleString()} • {log.responseTime}ms
            {log.status > 0 && (
              <>
                {' • Status: '}
                <Badge
                  variant={
                    log.status >= 200 && log.status < 300
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {log.status} {log.statusText}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="response" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>

          <TabsContent value="response" className="mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Response Body</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(log.response || log.error || '')
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                {log.error ? (
                  <div className="text-destructive">
                    <p className="font-medium">Error:</p>
                    <pre className="whitespace-pre-wrap text-sm mt-2">
                      {log.error}
                    </pre>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">
                    {formatJson(log.response)}
                  </pre>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Request Headers</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(log.headers, null, 2))
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                {Object.keys(log.headers).length === 0 ? (
                  <p className="text-muted-foreground">No headers sent</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(log.headers).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="col-span-2 text-sm text-muted-foreground break-all">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="request" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">URL</h4>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm break-all">{log.url}</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Method</h4>
                <Badge className={getMethodBadgeClass(log.method)}>
                  {log.method}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Timestamp</h4>
                <p className="text-sm text-muted-foreground">
                  {log.timestamp.toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  {log.responseTime}ms
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
