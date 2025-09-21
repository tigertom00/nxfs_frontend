interface ParsedCurl {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export function parseCurlCommand(curlCommand: string): ParsedCurl | null {
  try {
    // Remove 'curl' from the beginning and trim
    let command = curlCommand.trim().replace(/^curl\s+/, '');

    // Default values
    const result: ParsedCurl = {
      url: '',
      method: 'GET',
      headers: {},
      body: ''
    };

    // Parse method
    const methodMatch = command.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase();
      command = command.replace(/-X\s+[A-Z]+\s*/i, '');
    }

    // Parse headers
    const headerRegex = /-H\s+['"]([^'"]+)['"]/gi;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(command)) !== null) {
      const header = headerMatch[1];
      const colonIndex = header.indexOf(':');
      if (colonIndex > 0) {
        const key = header.substring(0, colonIndex).trim();
        const value = header.substring(colonIndex + 1).trim();
        result.headers[key] = value;
      }
    }
    command = command.replace(/-H\s+['"][^'"]*['"]\s*/gi, '');

    // Parse body/data
    const dataMatch = command.match(/-d\s+['"]([^'"]*)['"]/i);
    if (dataMatch) {
      result.body = dataMatch[1];
      command = command.replace(/-d\s+['"][^'"]*['"]\s*/i, '');
    }

    // Parse URL (remove any remaining quotes)
    const urlMatch = command.match(/['"]?([^'"\s]+)['"]?$/);
    if (urlMatch) {
      result.url = urlMatch[1];
    }

    // Validate URL
    if (!result.url) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error parsing curl command:', error);
    return null;
  }
}

export function formatCurlCommand(parsed: ParsedCurl): string {
  let command = `curl -X ${parsed.method}`;

  // Add headers
  Object.entries(parsed.headers).forEach(([key, value]) => {
    command += ` -H "${key}: ${value}"`;
  });

  // Add body if present
  if (parsed.body) {
    command += ` -d '${parsed.body}'`;
  }

  // Add URL
  command += ` "${parsed.url}"`;

  return command;
}