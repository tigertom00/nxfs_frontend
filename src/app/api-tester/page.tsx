'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Copy,
  Download,
  History,
  Save,
  Trash2,
  Plus,
  X,
  Settings,
  RotateCcw,
  Terminal,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import { useAuthStore, useUIStore } from '@/stores';
import { useSavedRequests } from '@/hooks/use-saved-requests';
import { useEnvironmentVariables } from '@/hooks/use-environment-variables';
import { parseCurlCommand } from '@/lib/curl-parser';
import { SaveRequestDialog } from '@/components/features/api-tester/save-request-dialog';
import { SavedRequestsDialog } from '@/components/features/api-tester/saved-requests-dialog';
import { EnvironmentVariablesDialog } from '@/components/features/api-tester/environment-variables-dialog';
import { RequestLogDialog } from '@/components/features/api-tester/request-log-dialog';

interface Header {
  key: string;
  value: string;
}

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

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
];

const COMMON_HEADERS = [
  { key: 'Accept', value: 'application/json' },
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Authorization', value: 'Bearer YOUR_TOKEN_HERE' },
  { key: 'User-Agent', value: 'API-Tester/1.0' },
];

export default function ApiTesterPage() {
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    initialize,
  } = useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [protocol, setProtocol] = useState('https://');
  const [baseUrl, setBaseUrl] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [token, setToken] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState('');
  const [responseHeaders, setResponseHeaders] = useState<
    Record<string, string>
  >({});
  const [isRequesting, setIsRequesting] = useState(false);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [curlCommand, setCurlCommand] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [responseFormat, setResponseFormat] = useState<
    'json' | 'raw' | 'preview'
  >('json');
  const { savedRequests, saveRequest, deleteRequest } = useSavedRequests();
  const { variables, substituteVariables, saveVariables } =
    useEnvironmentVariables();
  const [displayUrl, setDisplayUrl] = useState('');
  const [curlInput, setCurlInput] = useState('');

  // Authentication and theme initialization
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Construct full URL from separate fields and update display
  useEffect(() => {
    const fullUrl = protocol + baseUrl + endpoint;
    setUrl(fullUrl);
    const substitutedUrl = substituteVariables(fullUrl);
    setDisplayUrl(substitutedUrl);
  }, [protocol, baseUrl, endpoint, substituteVariables]);

  const _handleUrlChange = (value: string) => {
    setUrl(value);
  };

  const getBaseUrlValue = () => {
    const baseUrlVar = variables.find((v) => v.key === 'BASE_URL' && v.enabled);
    return baseUrlVar ? baseUrlVar.value : '';
  };

  // Update baseUrl field when BASE_URL environment variable changes
  useEffect(() => {
    const envBaseUrl = getBaseUrlValue();
    if (envBaseUrl && !baseUrl) {
      setBaseUrl(envBaseUrl);
    }
  }, [variables, baseUrl]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const addCommonHeader = (header: Header) => {
    setHeaders([...headers, header]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copyToken = () => {
    if (token) {
      copyToClipboard(token);
    }
  };

  const generateCurlCommand = () => {
    const processedUrl = substituteVariables(url);
    const processedBody = substituteVariables(body);

    let cmd = `curl -X ${method}`;

    const validHeaders = headers.filter((h) => h.key && h.value);
    validHeaders.forEach((header) => {
      const processedValue = substituteVariables(header.value);
      cmd += ` -H "${header.key}: ${processedValue}"`;
    });

    if (processedBody) {
      cmd += ` -d '${processedBody}'`;
    }

    cmd += ` "${processedUrl}"`;

    setCurlCommand(cmd);
    return cmd;
  };

  const copyCurlCommand = () => {
    const cmd = generateCurlCommand();
    copyToClipboard(cmd);
  };

  const sendRequest = async () => {
    if (!url) {
      toast.error('URL is required');
      return;
    }

    setIsRequesting(true);
    const startTime = Date.now();

    try {
      // Substitute environment variables
      const processedUrl = substituteVariables(url);
      const _processedToken = substituteVariables(token);
      const processedBody = substituteVariables(body);

      const validHeaders = headers.filter((h) => h.key && h.value);
      const headersObj: Record<string, string> = {};
      validHeaders.forEach((header) => {
        headersObj[header.key] = substituteVariables(header.value);
      });

      const response = await fetch(processedUrl, {
        method,
        headers: headersObj,
        body: method !== 'GET' && method !== 'HEAD' ? processedBody : undefined,
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      setResponseStatus(response.status);
      setResponseStatusText(response.statusText);
      setResponse(responseText);

      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      setResponseHeaders(responseHeadersObj);

      const log: RequestLog = {
        id: Date.now().toString(),
        url: processedUrl,
        method,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date(),
        responseTime,
        headers: headersObj,
        response: responseText,
      };

      setLogs((prev) => [log, ...prev]);

      toast.success(
        `Request sent successfully - Status: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setResponse(errorMessage);
      setResponseStatus(null);
      setResponseStatusText('Error');

      const log: RequestLog = {
        id: Date.now().toString(),
        url: substituteVariables(url),
        method,
        status: 0,
        statusText: 'Error',
        timestamp: new Date(),
        responseTime,
        headers: {},
        response: '',
        error: errorMessage,
      };

      setLogs((prev) => [log, ...prev]);

      toast.error(`Request failed: ${errorMessage}`);
    } finally {
      setIsRequesting(false);
      generateCurlCommand();
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success('All request logs have been cleared');
  };

  const handleSaveRequest = (name: string) => {
    saveRequest({
      name,
      url,
      method,
      headers: headers.filter((h) => h.key && h.value),
      body,
      token,
    });
  };

  const exportLogs = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRequests: logs.length,
      logs: logs.map((log) => ({
        id: log.id,
        url: log.url,
        method: log.method,
        status: log.status,
        statusText: log.statusText,
        timestamp: log.timestamp.toISOString(),
        responseTime: log.responseTime,
        headers: log.headers,
        response: log.response,
        error: log.error || null,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `api-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${logs.length} request logs to JSON file`);
  };

  const clearForm = () => {
    setUrl('');
    setProtocol('https://');
    setBaseUrl('');
    setEndpoint('');
    setMethod('GET');
    setHeaders([{ key: '', value: '' }]);
    setToken('');
    setBody('');
    setResponse('');
    setResponseStatus(null);
    setResponseStatusText('');
    setResponseHeaders({});
    setCurlCommand('');
    setCurlInput('');

    toast.success('Request configuration has been cleared');
  };

  const handleLoadRequest = (request: any) => {
    // Parse URL into components
    let parsedProtocol = 'https://';
    let parsedBaseUrl = '';
    let parsedEndpoint = '';

    try {
      const urlObj = new URL(request.url);
      parsedProtocol = urlObj.protocol + '//';
      parsedBaseUrl = urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
      parsedEndpoint = urlObj.pathname + (urlObj.search || '');
    } catch {
      // Fallback for invalid URLs
      if (request.url.startsWith('http://')) {
        parsedProtocol = 'http://';
        const withoutProtocol = request.url.substring(7);
        const firstSlash = withoutProtocol.indexOf('/');
        if (firstSlash === -1) {
          parsedBaseUrl = withoutProtocol;
          parsedEndpoint = '';
        } else {
          parsedBaseUrl = withoutProtocol.substring(0, firstSlash);
          parsedEndpoint = withoutProtocol.substring(firstSlash);
        }
      } else if (request.url.startsWith('https://')) {
        parsedProtocol = 'https://';
        const withoutProtocol = request.url.substring(8);
        const firstSlash = withoutProtocol.indexOf('/');
        if (firstSlash === -1) {
          parsedBaseUrl = withoutProtocol;
          parsedEndpoint = '';
        } else {
          parsedBaseUrl = withoutProtocol.substring(0, firstSlash);
          parsedEndpoint = withoutProtocol.substring(firstSlash);
        }
      } else {
        // Assume it's just a base URL or endpoint
        if (request.url.includes('/')) {
          const firstSlash = request.url.indexOf('/');
          parsedBaseUrl = request.url.substring(0, firstSlash);
          parsedEndpoint = request.url.substring(firstSlash);
        } else {
          parsedBaseUrl = request.url;
          parsedEndpoint = '';
        }
      }
    }

    setProtocol(parsedProtocol);
    setBaseUrl(parsedBaseUrl);
    setEndpoint(parsedEndpoint);
    setMethod(request.method);
    setHeaders(request.headers);
    setBody(request.body);
    setToken(request.token);
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const formatResponse = (
    responseText: string,
    format: 'json' | 'raw' | 'preview'
  ) => {
    switch (format) {
      case 'json':
        return formatJson(responseText);
      case 'raw':
        return responseText;
      case 'preview':
        try {
          const parsed = JSON.parse(responseText);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // If not JSON, try to create a simple HTML preview
          return responseText
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        }
      default:
        return responseText;
    }
  };

  const parseAndFillForm = () => {
    if (!curlInput.trim()) {
      toast.error('Please enter a curl command to parse');
      return;
    }

    const parsed = parseCurlCommand(curlInput);
    if (!parsed) {
      toast.error('Could not parse the curl command. Please check the format.');
      return;
    }

    // Fill form fields
    setUrl(parsed.url);
    setMethod(parsed.method);

    // Convert headers to array format
    const headersArray = Object.entries(parsed.headers).map(([key, value]) => ({
      key,
      value,
    }));
    setHeaders(
      headersArray.length > 0 ? headersArray : [{ key: '', value: '' }]
    );

    setBody(parsed.body);

    // Extract token from Authorization header if present
    const authHeader =
      parsed.headers['Authorization'] || parsed.headers['authorization'];
    if (authHeader) {
      const tokenMatch =
        authHeader.match(/Bearer\s+(.+)/i) || authHeader.match(/Token\s+(.+)/i);
      if (tokenMatch) {
        setToken(tokenMatch[1]);
      }
    }

    toast.success('Form has been filled with the curl command data');
  };

  const parseAndSendCurl = () => {
    if (!curlInput.trim()) {
      toast.error('Please enter a curl command to execute');
      return;
    }

    const parsed = parseCurlCommand(curlInput);
    if (!parsed) {
      toast.error('Could not parse the curl command. Please check the format.');
      return;
    }

    // Set the form values and send immediately
    setUrl(parsed.url);
    setMethod(parsed.method);

    const headersArray = Object.entries(parsed.headers).map(([key, value]) => ({
      key,
      value,
    }));
    setHeaders(
      headersArray.length > 0 ? headersArray : [{ key: '', value: '' }]
    );

    setBody(parsed.body);

    // Extract token
    const authHeader =
      parsed.headers['Authorization'] || parsed.headers['authorization'];
    if (authHeader) {
      const tokenMatch =
        authHeader.match(/Bearer\s+(.+)/i) || authHeader.match(/Token\s+(.+)/i);
      if (tokenMatch) {
        setToken(tokenMatch[1]);
      }
    }

    // Send the request immediately
    setTimeout(() => {
      sendRequest();
    }, 100);
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'no' ? 'Laster...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="text-foreground p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg api-gradient flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">API Tester</h1>
                <p className="text-muted-foreground">
                  Professional API testing tool
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Request Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* URL and Method */}
              <Card className="hover-lift border-l-4 border-l-api-accent-border">
                <CardHeader>
                  <CardTitle>Request Configuration</CardTitle>
                  <CardDescription>Configure your HTTP request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={sendRequest}
                        disabled={isRequesting}
                        className="api-gradient hover:opacity-90"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isRequesting ? 'Sending...' : 'Send'}
                      </Button>
                      <Button variant="outline" onClick={clearForm}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* URL Construction Fields */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={protocol} onValueChange={setProtocol}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="http://">http://</SelectItem>
                          <SelectItem value="https://">https://</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="api.example.com"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="/endpoint/path"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Display URL */}
                  <div className="relative">
                    <Input
                      value={displayUrl}
                      readOnly
                      className="bg-muted font-mono text-sm"
                    />
                    {(baseUrl.includes('{{') || endpoint.includes('{{')) && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          📋 Variables
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Token Management */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Authentication Token
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type={showToken ? 'text' : 'password'}
                        placeholder="Enter your authentication token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToken}
                        disabled={!token}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Headers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Headers</label>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            const header = COMMON_HEADERS.find(
                              (h) => h.key === value
                            );
                            if (header) {
                              addCommonHeader(header);
                            }
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Add common" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_HEADERS.map((header) => (
                              <SelectItem key={header.key} value={header.key}>
                                {header.key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={addHeader}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {headers.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Header name"
                            value={header.key}
                            onChange={(e) =>
                              updateHeader(index, 'key', e.target.value)
                            }
                          />
                          <Input
                            placeholder="Header value"
                            value={header.value}
                            onChange={(e) =>
                              updateHeader(index, 'value', e.target.value)
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeHeader(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Body */}
                  {method !== 'GET' && method !== 'HEAD' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Request Body
                      </label>
                      <Textarea
                        placeholder="Enter JSON request body..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Response */}
              <Card className="hover-lift border-l-4 border-l-api-accent-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Response</CardTitle>
                      {responseStatus && (
                        <CardDescription>
                          Status:{' '}
                          <Badge
                            variant={
                              responseStatus >= 200 && responseStatus < 300
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {responseStatus} {responseStatusText}
                          </Badge>
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCurlCommand}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy cURL
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="body" className="w-full">
                    <TabsList>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="body" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Format:</span>
                          <div className="flex gap-1">
                            <Button
                              variant={
                                responseFormat === 'json'
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => setResponseFormat('json')}
                            >
                              JSON
                            </Button>
                            <Button
                              variant={
                                responseFormat === 'raw' ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => setResponseFormat('raw')}
                            >
                              Raw
                            </Button>
                            <Button
                              variant={
                                responseFormat === 'preview'
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => setResponseFormat('preview')}
                            >
                              Preview
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-96 w-full border rounded-md p-4 custom-scrollbar">
                          {responseFormat === 'preview' ? (
                            <div
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: formatResponse(response, 'preview'),
                              }}
                            />
                          ) : (
                            <pre className="text-sm whitespace-pre-wrap">
                              {formatResponse(response, responseFormat)}
                            </pre>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    <TabsContent value="headers" className="mt-4">
                      <ScrollArea className="h-96 w-full border rounded-md p-4 custom-scrollbar">
                        <div className="space-y-2">
                          {Object.entries(responseHeaders).map(
                            ([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium">{key}:</span>
                                <span className="text-muted-foreground">
                                  {value}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="curl" className="mt-4">
                      <div className="space-y-2">
                        <Textarea
                          value={curlCommand}
                          readOnly
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <Button onClick={copyCurlCommand} className="w-full">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy cURL Command
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Logs Panel */}
            <div className="space-y-6">
              <Card className="hover-lift border-l-4 border-l-api-accent-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Request Logs</CardTitle>
                    <Button variant="outline" size="sm" onClick={clearLogs}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>History of all requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full custom-scrollbar">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No requests yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <RequestLogDialog key={log.id} log={log}>
                            <div className="border rounded-lg p-3 space-y-1 cursor-pointer hover:bg-muted/50 transition-colors hover-lift">
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={getMethodBadgeClass(log.method)}
                                >
                                  {log.method}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.responseTime}ms
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">
                                {log.url}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.timestamp.toLocaleTimeString()}
                              </p>
                              {log.error && (
                                <p className="text-xs text-destructive">
                                  {log.error}
                                </p>
                              )}
                            </div>
                          </RequestLogDialog>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="hover-lift border-l-4 border-l-api-accent-border">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SaveRequestDialog onRequestSave={handleSaveRequest}>
                    <Button variant="outline" className="w-full justify-start">
                      <Save className="w-4 h-4 mr-2" />
                      Save Request
                    </Button>
                  </SaveRequestDialog>

                  <SavedRequestsDialog
                    savedRequests={savedRequests}
                    onLoadRequest={handleLoadRequest}
                    onDeleteRequest={deleteRequest}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <History className="w-4 h-4 mr-2" />
                      Load Saved ({savedRequests.length})
                    </Button>
                  </SavedRequestsDialog>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={exportLogs}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </Button>

                  <EnvironmentVariablesDialog
                    variables={variables}
                    onUpdateVariables={saveVariables}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Environment Variables (
                      {variables.filter((v) => v.enabled).length})
                    </Button>
                  </EnvironmentVariablesDialog>
                </CardContent>
              </Card>

              {/* Curl Command Input */}
              <Card className="hover-lift border-l-4 border-l-api-accent-border">
                <CardHeader>
                  <CardTitle>Curl Command Input</CardTitle>
                  <CardDescription>
                    Enter a curl command to fill the form or send directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="curl -X GET https://api.example.com/users -H 'Authorization: Bearer YOUR_TOKEN'"
                    value={curlInput}
                    onChange={(e) => setCurlInput(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={parseAndFillForm}
                      className="flex-1"
                    >
                      <Terminal className="w-4 h-4 mr-2" />
                      Fill Form
                    </Button>
                    <Button
                      onClick={parseAndSendCurl}
                      className="flex-1 api-gradient hover:opacity-90"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Send Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <ChatBot />
    </div>
  );
}
