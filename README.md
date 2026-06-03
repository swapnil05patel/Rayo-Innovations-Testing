# Rayo-Innovations-Testing

Playwright automation for testing the Rayo Innovations website.

## Setup

1. Install dependencies:

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Configure credentials in `.env`:

   ```bash
   GOOGLE_EMAIL=rayoqa9@gmail.com
   GOOGLE_PASSWORD=12345qwert@A
   ```

## Running Tests

### Headless mode (recommended for CI/CD):

```bash
HEADLESS=true npm test
```

### Headed mode with visible browser:

```bash
HEADLESS=false npm test
```

Or with xvfb for container environments:

```bash
npm run test:headful
```

## Authentication Note

Google blocks automated sign-in for security. This setup includes:

- `tests/google-signin.spec.js` - Tests accessing the app
- Automatic session state loading if `auth-state.json` exists
- Headless mode works best for non-Google authentication flows

### Manual Authentication (if needed):

If you need to save a Google session:

1. Use `npm run auth:setup` (may fail due to Google's protection)
2. Manually log in via the website and export cookies if possible
3. Or run tests in headed mode to authenticate interactively

## Test Features

- ✓ Opens browser automatically
- ✓ Navigates to website
- ✓ Supports session-based authentication
- ✓ Headless and headed mode support
- ✓ Screenshots on failure
- ✓ Video recording on failure
- ✓ Cross-platform (Linux container, Windows, macOS)
