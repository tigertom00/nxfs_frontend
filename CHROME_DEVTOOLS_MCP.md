# Chrome DevTools MCP Integration

## Overview

The Chrome DevTools MCP (Model Context Protocol) server provides AI coding assistants with direct access to Chrome DevTools for browser automation, debugging, and performance analysis.

## Installation

✅ **Already Configured!**

The project now includes Chrome DevTools MCP configuration in `.mcp.json`. The MCP server will be automatically loaded by Claude Code when you restart your session.

### Configuration File

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### System Requirements

- ✅ Node.js v20.19+ (Current: v22.19.0)
- ✅ Chrome/Chromium (Installed: /usr/bin/google-chrome)
- ✅ npm (Included with Node.js)

## Available Tools (26+ Tools)

### 1. Input Automation (7 tools)
- **Click**: Click elements on the page
- **Type**: Type text into input fields
- **Scroll**: Scroll the page or specific elements
- **Drag and Drop**: Drag elements to new positions
- **File Upload**: Upload files through file input elements
- **Press Key**: Simulate keyboard input
- **Mouse Move**: Move the mouse cursor

### 2. Navigation (7 tools)
- **Navigate**: Go to specific URLs
- **Reload**: Refresh the current page
- **Back/Forward**: Navigate browser history
- **Close Tab**: Close browser tabs
- **New Tab**: Open new tabs
- **Switch Tab**: Switch between tabs
- **Get URL**: Get current page URL

### 3. Emulation (3 tools)
- **Device Emulation**: Test mobile/tablet viewports
- **Geolocation**: Override geolocation coordinates
- **User Agent**: Spoof different browsers/devices

### 4. Performance Tracking (3 tools)
- **CPU Profiling**: Analyze JavaScript execution performance
- **Memory Profiling**: Track memory usage and leaks
- **Coverage Analysis**: Measure code coverage (CSS/JS)

### 5. Network Analysis (2 tools)
- **Request Monitoring**: Monitor all network requests
- **HAR Export**: Export network activity as HAR files

### 6. Debugging (4 tools)
- **Console Logs**: Capture console output
- **DOM Inspection**: Inspect and query DOM elements
- **JavaScript Evaluation**: Execute arbitrary JavaScript
- **Screenshot**: Capture page screenshots

## CLI Options

### Basic Usage
```bash
npx chrome-devtools-mcp@latest
```

### Advanced Options

#### Headless Mode (No UI)
```bash
npx chrome-devtools-mcp@latest --headless
```

#### Custom Chrome Executable
```bash
npx chrome-devtools-mcp@latest --executablePath /path/to/chrome
```

#### Different Chrome Channels
```bash
# Chrome Beta
npx chrome-devtools-mcp@latest --channel beta

# Chrome Canary (bleeding edge)
npx chrome-devtools-mcp@latest --channel canary

# Chrome Dev
npx chrome-devtools-mcp@latest --channel dev
```

#### Custom Viewport
```bash
npx chrome-devtools-mcp@latest --viewport 1280x720
```

#### Connect to Running Chrome Instance
```bash
# First, start Chrome with remote debugging:
google-chrome --remote-debugging-port=9222

# Then connect:
npx chrome-devtools-mcp@latest --browserUrl http://127.0.0.1:9222
```

#### Isolated Mode (Temporary Profile)
```bash
npx chrome-devtools-mcp@latest --isolated
```

#### Debug Logging
```bash
DEBUG=* npx chrome-devtools-mcp@latest --logFile /tmp/chrome-devtools-mcp.log
```

#### Proxy Configuration
```bash
npx chrome-devtools-mcp@latest --proxyServer http://proxy.example.com:8080
```

#### Accept Insecure Certificates (Use with caution!)
```bash
npx chrome-devtools-mcp@latest --acceptInsecureCerts
```

## Use Cases for NXFS Frontend

### 1. Automated Testing
- Test authentication flows
- Verify responsive design on different devices
- Test chatbot file upload functionality
- Validate theme switching (5 themes: system, light, dark, purple, pink)

### 2. Performance Optimization
- Profile JavaScript performance of React components
- Analyze bundle size impact
- Monitor memory usage during Socket.IO operations
- Track API request timing to Django backend

### 3. Debugging
- Inspect network requests to `https://api.nxfs.no`
- Monitor WebSocket connections for Socket.IO
- Debug N8N chatbot integration
- Capture console errors during development

### 4. Visual Testing
- Screenshot different theme variations
- Test UI components across viewport sizes
- Verify internationalization (English/Norwegian)
- Capture error states for documentation

## Example Testing Scenarios

### Test 1: Authentication Flow
```
1. Navigate to http://10.20.30.202:3000/auth/signin
2. Fill in login credentials
3. Click sign-in button
4. Monitor network requests for JWT token
5. Verify redirect to dashboard
```

### Test 2: Theme Switching
```
1. Navigate to http://10.20.30.202:3000
2. Open theme selector
3. Switch between 5 themes (system, light, dark, purple, pink)
4. Take screenshots of each theme
5. Verify CSS variable changes
```

### Test 3: Chatbot Integration
```
1. Navigate to authenticated page
2. Open chatbot interface
3. Upload a test file
4. Send message to N8N webhook
5. Monitor network request to https://n8n.nxfs.no/webhook/nxfs
6. Verify response handling
```

### Test 4: Performance Analysis
```
1. Navigate to http://10.20.30.202:3000
2. Start CPU profiling
3. Navigate to tasks page
4. Create/update/delete tasks
5. Stop profiling and analyze results
6. Identify performance bottlenecks
```

### Test 5: Mobile Responsiveness
```
1. Emulate iPhone 14 Pro
2. Navigate to main pages
3. Test navigation menu (mobile vs desktop)
4. Verify touch interactions
5. Screenshot key pages
```

## Comparison with Playwright MCP

| Feature | Chrome DevTools MCP | Playwright MCP |
|---------|-------------------|----------------|
| **Browser Support** | Chrome only | Chrome, Firefox, Safari |
| **DevTools Access** | Full Chrome DevTools | Limited |
| **Performance Profiling** | ✅ Advanced (CPU, Memory, Coverage) | ⚠️ Basic |
| **Network Analysis** | ✅ HAR export, detailed request data | ✅ Request interception |
| **Automation** | ✅ Click, type, scroll, drag-drop | ✅ Similar capabilities |
| **Screenshots** | ✅ Full page, element, viewport | ✅ Similar |
| **Headless Mode** | ✅ Supported | ✅ Supported |
| **Multi-browser** | ❌ Chrome only | ✅ Cross-browser |
| **Learning Curve** | Medium (Chrome DevTools knowledge) | Low |

## Best Practices

### 1. Use Development URL
Always use `http://10.20.30.202:3000` when testing the development server to avoid CORS issues.

### 2. Isolated Mode for Testing
Use `--isolated` flag to avoid polluting your browser profile during automated tests.

### 3. Save Logs for Debugging
When encountering issues, always capture logs:
```bash
DEBUG=* npx chrome-devtools-mcp@latest --logFile ./chrome-mcp-debug.log
```

### 4. Headless for CI/CD
Use `--headless` mode for continuous integration pipelines.

### 5. Custom Viewport for Screenshots
Specify consistent viewport sizes for screenshot comparisons:
```bash
npx chrome-devtools-mcp@latest --viewport 1920x1080
```

## Security Considerations

⚠️ **Important**: Chrome DevTools MCP exposes browser content to AI assistants. Avoid:
- Testing with real user credentials in production
- Sharing sensitive API tokens or secrets
- Testing payment flows with real payment data
- Exposing personal information in screenshots

✅ **Safe practices**:
- Use test accounts (e.g., `claude@nxfs.no` from environment variables)
- Test on development/staging environments
- Use mock data for sensitive operations
- Review screenshots before sharing

## Troubleshooting

### Issue: "Browser not installed"
```bash
# Solution: Install Chrome
sudo dnf install google-chrome-stable
```

### Issue: "Port already in use"
```bash
# Solution: Find and kill the process using the port
lsof -ti:9222 | xargs kill -9
```

### Issue: "Connection refused"
```bash
# Solution: Ensure Chrome is running with remote debugging
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### Issue: "Timeout errors"
```bash
# Solution: Increase timeout or use faster Chrome channel
npx chrome-devtools-mcp@latest --channel canary
```

## Next Steps

1. **Restart Claude Code session** to load the new MCP server
2. **Test basic automation** with simple page navigation
3. **Profile performance** of key pages (tasks, chatbot, dashboard)
4. **Create automated test suite** for critical user flows
5. **Document findings** and optimize based on insights

## Resources

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Playwright MCP (alternative)](https://github.com/microsoft/playwright)

## Integration with NXFS Frontend

This MCP server complements the existing NXFS frontend architecture:
- **API Testing**: Verify requests to `https://api.nxfs.no`
- **Socket.IO**: Monitor WebSocket connections on `/api/socketio`
- **N8N Integration**: Debug chatbot webhook calls
- **Theme System**: Test 5 theme variations with screenshots
- **i18n**: Verify English/Norwegian translations
- **Authentication**: Test JWT token flows with auth store

---

**Status**: ✅ Configured and ready to use
**Last Updated**: 2025-10-04
**Next Action**: Restart Claude Code session to activate MCP server
