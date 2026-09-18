# Testing Guide

## Overview

This document provides comprehensive guidance on testing BrewHub, including unit tests, component tests, integration tests, and end-to-end tests.

## Testing Stack

- **Unit & Component Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Istanbul (via Vitest)
- **CI/CD**: GitHub Actions (recommended)

---

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test setup and mocks
│   ├── security.test.ts      # Security utilities tests
│   ├── cartStore.test.ts     # Cart store tests
│   ├── qrParser.test.ts      # QR parser tests
│   └── utils.test.ts         # Utility functions tests
├── components/
│   └── __tests__/            # Component tests (future)
└── pages/
    └── __tests__/            # Page tests (future)

e2e/                          # E2E tests (future)
├── customer-flow.spec.ts
├── admin-flow.spec.ts
└── kitchen-flow.spec.ts
```

---

## Running Tests

### Unit & Component Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test security.test.ts

# Run tests in CI mode
npm run test:ci
```

### E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test customer-flow.spec.ts
```

---

## Test Coverage Goals

### Minimum Coverage Requirements

```
Branches:     80%
Functions:    80%
Lines:        80%
Statements:   80%
```

### Current Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## Writing Tests

### Unit Tests

Unit tests focus on individual functions and utilities.

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../utils/myFunction';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    const result = myFunction('');
    expect(result).toBe('default');
  });

  it('should throw error for invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Component Tests

Component tests verify UI components render and behave correctly.

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('After Click')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<MyComponent isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Store Tests

Store tests verify state management logic.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMyStore } from '../stores/myStore';

describe('MyStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useMyStore.getState().reset();
  });

  it('should update state correctly', () => {
    const { setState, state } = useMyStore.getState();
    setState({ value: 'new value' });
    expect(state.value).toBe('new value');
  });

  it('should compute derived state', () => {
    const { addItem, getTotal } = useMyStore.getState();
    addItem({ price: 10, quantity: 2 });
    expect(getTotal()).toBe(20);
  });
});
```

### Integration Tests

Integration tests verify multiple components work together.

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyPage } from '../pages/MyPage';

describe('MyPage Integration', () => {
  it('should fetch and display data', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <MyPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Expected Data')).toBeInTheDocument();
    });
  });
});
```

---

## Test Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested.

```typescript
// ✅ Good
it('should calculate subtotal correctly when cart has multiple items', () => {
  // ...
});

// ❌ Bad
it('works', () => {
  // ...
});
```

### 2. Test Isolation

Each test should be independent and not rely on other tests.

```typescript
// ✅ Good
beforeEach(() => {
  useCartStore.getState().clearCart();
});

it('should add item to empty cart', () => {
  // Test starts with clean state
});

// ❌ Bad
it('should add item to cart with existing items', () => {
  // Relies on previous test's state
});
```

### 3. Test Data

Use realistic test data and avoid hardcoded values.

```typescript
// ✅ Good
const mockMenuItem = {
  id: 'menu-1',
  name: 'Cappuccino',
  price: 4.5,
  category: 'Coffee',
};

// ❌ Bad
const mockMenuItem = {
  id: '1',
  name: 'Item',
  price: 1,
};
```

### 4. Async Testing

Properly handle async operations in tests.

```typescript
// ✅ Good
it('should fetch data asynchronously', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// ❌ Bad
it('should fetch data', () => {
  fetchData().then(result => {
    expect(result).toBeDefined(); // May not run
  });
});
```

### 5. Mocking

Mock external dependencies appropriately.

```typescript
// ✅ Good
vi.mock('../services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' }),
}));

// ❌ Bad
// Making actual API calls in tests
```

---

## Security Testing

### Input Validation Tests

```typescript
describe('Security: Input Validation', () => {
  it('should reject SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('DROP TABLE');
  });

  it('should reject XSS attempts', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeHtml(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate email format', () => {
    expect(isValidEmail('valid@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

### Authentication Tests

```typescript
describe('Security: Authentication', () => {
  it('should enforce rate limiting on OTP requests', async () => {
    const rateLimiter = new RateLimiter(3, 60000);
    
    // First 3 attempts should succeed
    expect(rateLimiter.isAllowed('phone-123')).toBe(true);
    expect(rateLimiter.isAllowed('phone-123')).toBe(true);
    expect(rateLimiter.isAllowed('phone-123')).toBe(true);
    
    // 4th attempt should fail
    expect(rateLimiter.isAllowed('phone-123')).toBe(false);
  });

  it('should validate strong passwords', () => {
    expect(isStrongPassword('Weak1!')).toBe(false);
    expect(isStrongPassword('StrongP@ssw0rd!')).toBe(true);
  });
});
```

### Authorization Tests

```typescript
describe('Security: Authorization', () => {
  it('should enforce role-based access', () => {
    expect(hasPermission('owner', 'menu', 'edit')).toBe(true);
    expect(hasPermission('staff', 'menu', 'edit')).toBe(false);
    expect(hasPermission('customer', 'menu', 'view')).toBe(true);
  });

  it('should prevent privilege escalation', () => {
    expect(canManageRole('staff', 'owner')).toBe(false);
    expect(canManageRole('owner', 'staff')).toBe(true);
  });
});
```

---

## Performance Testing

### Load Testing

```bash
# Using Artillery
artillery run load-test.yml

# Using k6
k6 run load-test.js
```

### Load Test Targets

```
Concurrent Users: 10,000
Requests/Second: 5,000
API Response Time: < 200ms
Page Load Time: < 3s
Error Rate: < 1%
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should render menu with 100 items in < 100ms', () => {
    const start = performance.now();
    render(<Menu items={generate100Items()} />);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle 1000 cart items without lag', () => {
    const store = useCartStore.getState();
    for (let i = 0; i < 1000; i++) {
      store.addItem(createTestItem({ menuItemId: `menu-${i}` }));
    }
    expect(store.items).toHaveLength(1000);
  });
});
```

---

## E2E Testing with Playwright

### Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Ordering Flow', () => {
  test('should complete full order flow', async ({ page }) => {
    // Navigate to menu
    await page.goto('/customer?cafe=test-cafe&table=1');
    
    // Add items to cart
    await page.click('[data-testid="add-item-1"]');
    await page.click('[data-testid="add-item-2"]');
    
    // Open cart
    await page.click('[data-testid="cart-button"]');
    
    // Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // Select payment method
    await page.click('[data-testid="payment-upi"]');
    
    // Complete payment (mock)
    await page.fill('[data-testid="upi-id"]', 'test@upi');
    await page.click('[data-testid="pay-button"]');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  });
});
```

### E2E Test Scenarios

1. **Customer Flow**
   - Scan QR code
   - Browse menu
   - Add items to cart
   - Place order
   - Make payment
   - Track order

2. **Admin Flow**
   - Login as owner
   - Create menu item
   - View orders
   - Update order status
   - View analytics

3. **Kitchen Flow**
   - Login as kitchen staff
   - View order queue
   - Update order status
   - Mark orders ready

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Data Management

### Mock Data

```typescript
// src/test/mockData.ts
export const mockMenuItems = [
  {
    id: 'menu-1',
    name: 'Cappuccino',
    price: 4.5,
    category: 'Coffee',
    is_veg: true,
    is_available: true,
  },
  // ... more items
];

export const mockOrders = [
  {
    id: 'order-1',
    order_number: 'ORD-001',
    status: 'preparing',
    total: 25.5,
    // ... more fields
  },
  // ... more orders
];
```

### Test Factories

```typescript
// src/test/factories.ts
export function createMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: `menu-${Math.random()}`,
    name: 'Test Item',
    price: 10.0,
    category: 'Test',
    is_veg: true,
    is_available: true,
    ...overrides,
  };
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: `order-${Math.random()}`,
    order_number: `ORD-${Math.floor(Math.random() * 1000)}`,
    status: 'received',
    total: 100.0,
    ...overrides,
  };
}
```

---

## Debugging Tests

### Verbose Output

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test with debug
DEBUG=* npm test security.test.ts
```

### Debug Mode

```typescript
// Add debugger statement
it('should debug this test', () => {
  debugger; // Pauses execution
  const result = myFunction();
  expect(result).toBe('expected');
});
```

### Test Inspection

```bash
# Run tests in inspect mode
node --inspect-brk node_modules/.bin/vitest
```

---

## Common Issues & Solutions

### Issue: Tests fail due to missing environment variables

**Solution**: Create `.env.test` file

```env
VITE_SUPABASE_URL=test-url
VITE_SUPABASE_ANON_KEY=test-key
```

### Issue: Component tests fail due to missing context

**Solution**: Wrap component with required providers

```typescript
render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MyComponent />
    </AuthProvider>
  </QueryClientProvider>
);
```

### Issue: Async tests timeout

**Solution**: Increase timeout or use waitFor

```typescript
it('should handle async operation', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  }, { timeout: 5000 });
});
```

---

## Test Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### Coverage Thresholds

```json
// vitest.config.ts
{
  "test": {
    "coverage": {
      "thresholds": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: 2026  
**Maintained by**: QA Team
