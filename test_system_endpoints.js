#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'https://api.nxfs.no';

// Using provided test credentials
const TEST_EMAIL = 'claude@nxfs.no';
const TEST_PASSWORD = 'claudecode123';

async function testSystemMonitorEndpoints() {
  console.log('🔍 Testing System Monitor Endpoints...\n');

  try {
    // 1. Get auth token
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${API_BASE}/auth/token/`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const { access: token } = authResponse.data;
    console.log('✅ Authentication successful\n');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Test all system endpoints
    const endpoints = [
      {
        method: 'GET',
        url: '/api/docker/system-stats/',
        description: 'Get all system stats',
      },
      {
        method: 'GET',
        url: '/api/docker/system-stats/latest/',
        description: 'Get latest system stats',
      },
      {
        method: 'POST',
        url: '/api/system/collect/',
        description: 'Trigger system data collection',
      },
      {
        method: 'GET',
        url: '/api/system/dashboard/',
        description: 'Get system dashboard data',
      },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.method} ${endpoint.url}`);
        console.log(`Description: ${endpoint.description}`);

        let response;
        if (endpoint.method === 'POST') {
          response = await axios.post(
            `${API_BASE}${endpoint.url}`,
            {},
            { headers }
          );
        } else {
          response = await axios.get(`${API_BASE}${endpoint.url}`, { headers });
        }

        console.log(`✅ Status: ${response.status}`);
        console.log(
          `📊 Response preview:`,
          JSON.stringify(response.data, null, 2).slice(0, 200) + '...'
        );

        // For system-stats endpoints, try to get a specific ID if data exists
        if (
          endpoint.url === '/api/docker/system-stats/' &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const firstId = response.data[0].id;
          console.log(`\n  Testing with specific ID: ${firstId}`);
          const specificResponse = await axios.get(
            `${API_BASE}/api/docker/system-stats/${firstId}/`,
            { headers }
          );
          console.log(`  ✅ Specific ID Status: ${specificResponse.status}`);
        }

        // For dashboard endpoint, try to get host-specific data if hosts exist
        if (
          endpoint.url === '/api/system/dashboard/' &&
          response.data &&
          response.data.hosts
        ) {
          const hosts = response.data.hosts;
          if (hosts.length > 0) {
            const firstHostId = hosts[0].id;
            console.log(`\n  Testing with specific host ID: ${firstHostId}`);
            const hostResponse = await axios.get(
              `${API_BASE}/api/system/dashboard/${firstHostId}/`,
              { headers }
            );
            console.log(`  ✅ Host-specific Status: ${hostResponse.status}`);
          }
        }
      } catch (error) {
        console.log(
          `❌ Error: ${error.response?.status || 'Network'} - ${error.response?.data?.detail || error.message}`
        );
      }

      console.log('---\n');
    }
  } catch (authError) {
    console.error(
      '❌ Authentication failed:',
      authError.response?.data || authError.message
    );
    console.log('\n💡 To use this script:');
    console.log(
      '1. Replace TEST_EMAIL and TEST_PASSWORD with valid credentials'
    );
    console.log('2. Run: node test_system_endpoints.js');
  }
}

testSystemMonitorEndpoints();
