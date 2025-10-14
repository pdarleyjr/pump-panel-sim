# Fire Pump Panel Simulator

## Deployment

The application is automatically deployed to Cloudflare Pages via GitHub Actions whenever code is pushed to the `main` branch.

**Production URL**: https://pump-panel-sim.pages.dev

### Manual Deployment

To deploy manually:

```bash
npm run build
wrangler pages deploy dist --project-name=pump-panel-sim
```

### Environment Variables

The following secrets must be configured in GitHub repository settings:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Pages access
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
1. Installs dependencies
2. Runs tests
3. Builds the application
4. Deploys to Cloudflare Pages

### Custom Domain (Optional)

To add a custom domain:

```bash
# Via Cloudflare Dashboard
# Navigate to Pages → pump-panel-sim → Custom domains
```

A web-based fire pump panel simulator with realistic hydraulics, audio feedback, and haptics support.

## Audio System

The simulator uses Tone.js for audio playback:
- Click sounds for UI interactions
- Valve operation sounds
- Low tank alarms
- Continuous pump ambient sound

**Important**: Audio must be enabled via user gesture (tap the "Enable Audio" button) due to browser autoplay policies.

### Browser Support
- ✅ Chrome/Edge: Full support (audio + vibration + gamepad haptics)
- ✅ Firefox: Full support (audio + vibration + limited gamepad)
- ⚠️ Safari: Audio only (no vibration API)
- ⚠️ iOS Safari: Audio only (no vibration, no gamepad haptics)

### Haptics
- **Vibration API**: Supported on Android Chrome, some desktop browsers
- **Gamepad Haptics**: Experimental API with limited support
- Both gracefully degrade when not available

## Keyboard Controls

The simulator supports comprehensive keyboard shortcuts for full keyboard-only operation, enabling accessibility and efficient control for power users.

### Quick Start

- Press `?` or `H` to display the interactive keyboard shortcuts help overlay
- Use arrow keys or `W`/`S` to control throttle
- Press `Space` or `P` to engage/disengage the pump
- Press `G` to toggle between RPM and PSI governor modes

### Complete Documentation

See [`KEYBOARD_CONTROLS.md`](./KEYBOARD_CONTROLS.md) for:
- Complete list of all keyboard shortcuts
- Engine, pump, governor, and DRV controls
- UI navigation shortcuts
- Accessibility features and WCAG 2.1 compliance
- Tips for efficient keyboard-only operation
- Troubleshooting guide

### Key Features

- **Full Keyboard Operation**: All simulator functions accessible via keyboard
- **Visual Feedback**: Toast notifications for all keyboard actions
- **Focus Management**: Clear focus indicators and logical tab order
- **Screen Reader Compatible**: Proper ARIA labels and live regions
- **WCAG 2.1 Level AA Compliant**: Meets accessibility standards

## Instructor Mode

The simulator includes an optional instructor mode for classroom scenarios, powered by Cloudflare Durable Objects.

### Worker Deployment

The instructor mode Worker is located in `../do-worker/` and must be deployed separately:

```bash
cd ../do-worker
npm install
npm run deploy
```

### Usage

Enable instructor mode in the simulator by connecting to a room:

```typescript
import { useInstructor } from './net/useInstructor';

const { connected, broadcast } = useInstructor(
  'classroom1',
  'wss://pump-sim-instructor.pdarleyjr.workers.dev',
  true
);
```

Instructors can broadcast control changes, scenario loads, or reset commands that sync across all connected students.

### Features

- **Room-based sessions**: Each classroom gets a separate Durable Object instance
- **Real-time WebSocket**: Instant synchronization across all participants
- **Automatic state management**: Durable Objects handle connection persistence
- **Scalable**: Built on Cloudflare's edge network for global reach


## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
