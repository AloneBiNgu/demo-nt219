/**
 * SECURITY TEST RUNNER
 * 
 * Master script to run all security tests
 * 
 * Usage:
 *   npx ts-node security-tests/run-all-tests.ts
 *   npx ts-node security-tests/run-all-tests.ts --target https://your-site.com
 * 
 * Prerequisites:
 *   npm install axios
 */

import { execSync } from 'child_process';
import * as path from 'path';

const TESTS = [
  {
    name: 'JWT Security Tests',
    file: 'exploit-jwt-attacks.ts',
    description: 'Tests for JWT algorithm confusion, tampering, and token reuse'
  },
  {
    name: 'Device Fingerprint Bypass',
    file: 'exploit-fingerprint-bypass.ts',
    description: 'Tests if stolen tokens can be used from different devices'
  },
  {
    name: 'Rate Limit Bypass',
    file: 'exploit-rate-limit-bypass.ts',
    description: 'Tests rate limiting effectiveness and bypass techniques'
  },
  {
    name: 'Payment Race Condition',
    file: 'exploit-payment-race-condition.ts',
    description: 'Tests for double-spending and race conditions in payments'
  },
  {
    name: 'Payment Manipulation',
    file: 'exploit-payment-manipulation.ts',
    description: 'Tests for price tampering and payment amount manipulation'
  },
  {
    name: 'Dev Endpoint Exposure',
    file: 'exploit-dev-endpoint.ts',
    description: 'Tests for exposed development/debug endpoints'
  }
];

function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗███████╗ ██████╗██╗   ██╗██████╗ ██╗████████╗██╗   ██╗            ║
║   ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝            ║
║   ███████╗█████╗  ██║     ██║   ██║██████╔╝██║   ██║    ╚████╔╝             ║
║   ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██║   ██║     ╚██╔╝              ║
║   ███████║███████╗╚██████╗╚██████╔╝██║  ██║██║   ██║      ██║               ║
║   ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝               ║
║                                                                              ║
║   ████████╗███████╗███████╗████████╗    ███████╗██╗   ██╗██╗████████╗███████╗║
║   ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ██╔════╝██║   ██║██║╚══██╔══╝██╔════╝║
║      ██║   █████╗  ███████╗   ██║       ███████╗██║   ██║██║   ██║   █████╗  ║
║      ██║   ██╔══╝  ╚════██║   ██║       ╚════██║██║   ██║██║   ██║   ██╔══╝  ║
║      ██║   ███████╗███████║   ██║       ███████║╚██████╔╝██║   ██║   ███████╗║
║      ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚══════╝ ╚═════╝ ╚═╝   ╚═╝   ╚══════╝║
║                                                                              ║
║                          NT219 Security Audit Suite                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
}

function printDisclaimer() {
  console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ⚠️  DISCLAIMER ⚠️                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  This security test suite is for AUTHORIZED TESTING ONLY.                   │
│                                                                              │
│  By running these tests, you confirm that:                                  │
│  1. You have explicit authorization to test the target system               │
│  2. You understand these tests may create/modify data                       │
│  3. You will use findings responsibly and ethically                         │
│  4. You will not use these tools for malicious purposes                     │
│                                                                              │
│  Unauthorized access to computer systems is a crime.                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
  `);
}

function printTestList() {
  console.log('\n📋 Available Security Tests:\n');
  console.log('┌────┬──────────────────────────────────┬─────────────────────────────────────────────┐');
  console.log('│ #  │ Test Name                        │ Description                                 │');
  console.log('├────┼──────────────────────────────────┼─────────────────────────────────────────────┤');
  
  TESTS.forEach((test, index) => {
    const num = (index + 1).toString().padEnd(2);
    const name = test.name.padEnd(32);
    const desc = test.description.substring(0, 43).padEnd(43);
    console.log(`│ ${num} │ ${name} │ ${desc} │`);
  });
  
  console.log('└────┴──────────────────────────────────┴─────────────────────────────────────────────┘');
}

function printUsage() {
  console.log(`
📖 Usage:

  Run all tests:
    npx ts-node security-tests/run-all-tests.ts

  Run specific test:
    npx ts-node security-tests/exploit-jwt-attacks.ts
    npx ts-node security-tests/exploit-fingerprint-bypass.ts
    npx ts-node security-tests/exploit-rate-limit-bypass.ts
    npx ts-node security-tests/exploit-payment-race-condition.ts
    npx ts-node security-tests/exploit-payment-manipulation.ts
    npx ts-node security-tests/exploit-dev-endpoint.ts

📝 Configuration:

  Before running tests, update the following in each test file:
  
  1. API_BASE = 'https://your-target-site.com/api/v1'
  2. ATTACKER_JWT = 'your-valid-jwt-token'
  3. Product IDs (for payment tests)

🔧 Prerequisites:

  npm install axios
  npm install -D ts-node typescript @types/node
  `);
}

async function main() {
  printBanner();
  printDisclaimer();
  printTestList();
  printUsage();
  
  console.log('\n' + '═'.repeat(80));
  console.log('To run tests, execute individual test files listed above.');
  console.log('═'.repeat(80) + '\n');
}

main();
