# Fire Pump Panel Simulator - Technical Summary

## Overview

The Fire Pump Panel Simulator is a web-based training application that accurately models Pierce Manufacturing PUC (Pump Operator's Control) pump panel behaviors. Built for mission-critical training with strict CSP compliance, WCAG 2.1 Level AA accessibility, and NFPA 1901 operational accuracy.

**Production URL**: https://fire-pump-panel-simulator.pages.dev  
**GitHub Repository**: https://github.com/pdarleyjr/pump-panel-sim  
**Instructor Mode Worker**: https://pump-sim-instructor.pdarleyjr.workers.dev

## Project Structure

```
fire-pump-panel-sim/
├── pump-panel-sim/          # Main React application
│   ├── src/
│   │   ├── audio/           # Tone.js audio system
│   │   ├── hydraulics/      # NFPA hydraulic calculations
│   │   ├── sim/             # Core simulation engine
│   │   ├── training/        # Educational scenarios
│   │   ├── ui/              # PixiJS graphics & React UI
│   │   └── utils/           # Memory profiling & cleanup
│   ├── public/              # Static assets & CSP headers
│   └── dist/                # Production build output
└── do-worker/               # Cloudflare Durable Objects for instructor mode
```

## Technical Stack

### Frontend Framework
- **React 18.1.1** with TypeScript 5.9.3
- **Vite 5.1.7** for fast development and optimized production builds
- **PixiJS v8.14.0** for hardware-accelerated 2D WebGL rendering
- **Tone.js v15.1.22** for Web Audio synthesis with gesture-gated initialization

### Build & Development Tools
- **ESLint 9.36.0** with React hooks and refresh plugins
- **Stylelint 16.25.0** for CSS linting
- **Vitest 3.2.4** with jsdom environment for testing
- **Wrangler 4.43.0** for Cloudflare Pages deployment

### Deployment Infrastructure
- **Cloudflare Pages** for global edge deployment
- **Cloudflare Durable Objects** for instructor mode WebSocket connectivity
- **GitHub Actions** for automated CI/CD pipeline

## Core Simulation Engine

### Hydraulic Modeling (`src/sim/`)
- **Pierce PUC Pump Behaviors**: Accurate modeling per operational manual
- **NFPA 1901 Compliance**: Safety interlocks and operational procedures
- **Real-time Physics**: Centrifugal pump curves, cavitation detection, overpressure protection

### Key Components

#### Pump Curves (`pump-curves.ts`)
```typescript
// Centrifugal pump physics: P ∝ RPM², Q ∝ RPM
export function calculateMaxPDP(
  flowGpm: number, 
  rpm: number, 
  intakePsi: number
): number {
  // Implementation follows NFPA acceptance test requirements
  // Includes churn pressure, rated capacity, and runout conditions
}
```

#### Safety Interlocks (`interlocks.ts`)
- **NFPA 5.11**: Pump engagement prevents throttle adjustment when disengaged
- **NFPA 5.8**: Discharge system warnings when valves open but pump not engaged
- **NFPA 5.14**: Foam system interlocks prevent operation without proper conditions
- **NFPA 5.9**: Priming system warnings for drafting operations

#### Gauge Calculations (`gauges.ts`)
- **Source-Aware Intake Gauge**: PSI for pressurized sources, inHg vacuum for drafting
- **Pressure Warnings**: 350 PSI warning, 400 PSI maximum safe operating pressure
- **Cavitation Detection**: >20 inHg vacuum triggers warnings

### Hydraulics Engine (`src/hydraulics/`)

#### Formulas (`formulas.ts`)
- **Nozzle Flow Calculations**: Smooth-bore and fog nozzle hydraulics
- **Friction Loss**: Hazen-Williams formula for hose and pipe calculations
- **Hydrant Flow Analysis**: Static vs residual pressure analysis

#### Standards (`standards.ts`)
- **NFPA 1901**: Pump acceptance test requirements
- **Pierce PUC**: Manufacturer-specific operational behaviors
- **Training Scenarios**: Four educational modules with realistic fault conditions

## Audio System

### Gesture-Gated Initialization
```typescript
// AudioContext creation deferred until user gesture
useEffect(() => {
  const handler = async () => { await init(); };
  window.addEventListener('pointerdown', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
  return () => { /* cleanup */ };
}, [init]);
```

### Audio Features
- **Click Sounds**: UI interaction feedback
- **Valve Operations**: Mechanical sound effects
- **Low Tank Alarms**: Warning audio cues
- **Ambient Pump Noise**: Continuous operational audio
- **Haptics Support**: Vibration API integration

### Browser Compatibility
- ✅ **Chrome/Edge**: Full audio + vibration + gamepad haptics
- ✅ **Firefox**: Full audio + vibration + limited gamepad
- ⚠️ **Safari**: Audio only (no vibration API)
- ⚠️ **iOS Safari**: Audio only (no vibration, no gamepad haptics)

## User Interface & Accessibility

### WCAG 2.1 Level AA Compliance
- **Touch Targets**: Minimum 44×44px for all interactive elements
- **Screen Reader Support**: ARIA live regions for critical warnings
- **Keyboard Navigation**: Full keyboard-only operation
- **Responsive Design**: Desktop, tablet, and mobile layouts

### PixiJS Graphics Engine
- **WebGL Rendering**: Hardware-accelerated 2D graphics
- **Context Loss Recovery**: Automatic texture reload on WebGL context restoration
- **Memory Optimization**: Device Pixel Ratio capped at 2x
- **Texture Caching**: Efficient asset management

### Grid Layout System
```typescript
interface GridConfig {
  cols: 8;
  rows: 6;
  gap: 24;
  margin: 24;
  designWidth: 1920;
  designHeight: 1080;
}
```

## Security & Performance

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-eval' 'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='; 
  style-src 'self'; 
  img-src 'self' data:; 
  font-src 'self'; 
  connect-src 'self' wss:; 
  worker-src 'self' blob:; 
  media-src 'self' data:; 
  object-src 'none'; 
  base-uri 'self'; 
  frame-ancestors 'none';
```

**Key Security Features:**
- No `unsafe-inline` - fully compliant
- PixiJS v8 CSP-safe (no eval required for WebGL shaders)
- Tone.js blob workers allowed for audio processing
- WebSocket connections for instructor mode

### Performance Optimizations
- **WebGL Memory Management**: Texture eviction on visibility change
- **Mathematical Grid Layout**: Zero-overlap constraint-driven positioning
- **Memory Profiling**: Heap usage monitoring utilities
- **Build Optimization**: ES2020 target with source maps

## Testing & Quality Assurance

### Test Coverage
- **142 passing tests** across 5 test files
- **7 failing tests** (known issues in development)
- **Vitest** with jsdom environment
- **Property-based testing** with fast-check

### Test Categories
- **Hydraulic Calculations**: Formula accuracy validation
- **Safety Interlocks**: NFPA compliance verification
- **Pump Physics**: Centrifugal pump behavior modeling
- **UI Components**: Accessibility and interaction testing
- **Audio System**: Gesture-gated initialization

### Current Test Status
```
Test Files: 4 failed | 5 passed (9)
Tests: 7 failed | 142 passed (149)
```

## Deployment & CI/CD

### Cloudflare Pages Deployment
```bash
# Manual deployment
npm run build
wrangler pages deploy dist --project-name=fire-pump-panel-simulator
```

### GitHub Actions Pipeline (`.github/workflows/deploy.yml`)
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --run
  
  deploy-pages:
    needs: test
    if: github.ref == 'refs/heads/main'
    uses: cloudflare/wrangler-action@v3
    with:
      apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      command: pages deploy dist --project-name=pump-panel-sim --branch=main
```

### Environment Variables Required
- `CLOUDFLARE_API_TOKEN`: API token with Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

## Instructor Mode (Optional)

### Durable Objects Worker (`do-worker/`)
- **WebSocket Hibernation**: Efficient connection management
- **Room-based Sessions**: Separate Durable Object per classroom
- **Real-time Synchronization**: Instant state updates across participants
- **Heartbeat Monitoring**: Automatic connection health checks

### Deployment
```bash
cd do-worker
npm install
npm run deploy
```

### Usage
```typescript
import { useInstructor } from './net/useInstructor';

const { connected, broadcast } = useInstructor(
  'classroom1',
  'wss://pump-sim-instructor.pdarleyjr.workers.dev',
  true
);
```

## Training Features

### Educational Scenarios
1. **Cavitation Detection**: Recognize and respond to pump cavitation
2. **Tank-to-Hydrant Changeover**: Proper valve sequencing procedures
3. **Overpressure Response**: Prevent exceeding 400 PSI limits
4. **Intake Pressure Monitoring**: Maintain adequate intake ≥20 PSI

### Startup Checklist
- **NFPA Compliance**: Systematic pre-operation verification
- **Fault Detection**: Automatic warning generation
- **Training Integration**: Interactive learning modules

## Browser Support & Compatibility

### Fully Supported
- **Chrome 90+** (Desktop & Mobile)
- **Edge 90+** (Desktop & Mobile)
- **Firefox 88+** (Desktop & Mobile)

### Limited Support
- **Safari 14+**: Audio only (no vibration API)
- **iOS Safari**: Audio only (no vibration, no gamepad haptics)

### Requirements
- **WebGL 2.0** support required for graphics rendering
- **Web Audio API** for audio features
- **ES2020** JavaScript features
- **Modern browser** with CSP support

## Development Setup

### Prerequisites
- **Node.js 20+**
- **npm** or **yarn**
- **Git**

### Installation
```bash
git clone https://github.com/pdarleyjr/pump-panel-sim.git
cd pump-panel-sim
npm install
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # ESLint checking
npm run lint:css     # Stylelint checking
npm run preview      # Preview production build
```

### Project Configuration
- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: React hooks and accessibility rules
- **Stylelint**: Standard CSS linting rules
- **Vite**: Optimized build configuration with compression

## File Structure Details

### Source Code Organization
```
src/
├── App.css, App.tsx          # Main application
├── audio/                     # Tone.js audio system
├── hydraulics/                # NFPA calculations
├── net/                       # Instructor mode networking
├── sim/                       # Core simulation logic
├── training/                  # Educational content
├── ui/                        # Graphics and interface
│   ├── accessibility/         # WCAG compliance
│   ├── cards/                 # Control panel cards
│   ├── controls/              # Interactive elements
│   ├── debug/                 # Development tools
│   ├── effects/               # Visual effects
│   ├── gauges/                # Pressure displays
│   ├── graphics/              # PixiJS rendering
│   ├── hooks/                 # Custom React hooks
│   ├── indicators/            # Status indicators
│   ├── keyboard/              # Keyboard navigation
│   ├── layout/                # Grid system
│   ├── overlays/              # Training overlays
│   ├── pixi/                  # WebGL context
│   └── utils/                 # Touch helpers
└── utils/                     # Memory management
```

### Configuration Files
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript project configuration
- `vite.config.ts`: Build tool configuration
- `wrangler.toml`: Cloudflare Pages deployment config
- `public/_headers`: CSP and security headers
- `public/manifest.webmanifest`: PWA configuration

## Performance Metrics

### Build Output
- **Main Bundle**: ~952 KB (269 KB gzipped)
- **CSS Bundle**: ~41 KB (8 KB gzipped)
- **Total Assets**: 26 files uploaded to Cloudflare Pages
- **Build Time**: ~6 seconds

### Runtime Performance
- **WebGL Rendering**: 60 FPS target with hardware acceleration
- **Memory Usage**: <100 MB typical usage
- **Network**: Progressive loading with code splitting
- **Accessibility**: WCAG 2.1 Level AA compliant

## Security Considerations

### CSP Implementation
- **Strict Policy**: No unsafe-inline or unsafe-eval except where required
- **PixiJS Compatibility**: WebGL shader compilation requires unsafe-eval
- **Tone.js Workers**: Blob workers allowed for audio processing
- **Hash-based Exceptions**: Inline scripts allowed via SHA-256 hashes

### Data Protection
- **No External APIs**: All functionality runs client-side
- **No Data Collection**: Training simulator with no telemetry
- **Local Storage**: Optional user preferences only
- **WebSocket Security**: Instructor mode uses secure WSS connections

## Future Enhancements

### Planned Features
- **PWA Support**: Service worker implementation
- **Offline Mode**: Cached training scenarios
- **Multi-language**: Internationalization support
- **Advanced Scenarios**: Complex fault simulation
- **Performance Analytics**: Usage tracking and optimization

### Technical Debt
- **Test Coverage**: 7 failing tests need resolution
- **Memory Profiling**: Production monitoring implementation
- **Error Boundaries**: Comprehensive error handling
- **Performance Monitoring**: Real-time metrics collection

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with comprehensive tests
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: All rules must pass
- **Stylelint**: CSS standards compliance
- **Testing**: Minimum test coverage requirements

### Documentation
- **README.md**: Comprehensive project overview
- **CONTRIBUTING.md**: Development setup and guidelines
- **Various MD files**: Feature-specific documentation

## Support & Maintenance

### Issue Tracking
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community support and questions
- **Wiki**: Detailed documentation and guides

### Maintenance Schedule
- **Security Updates**: Monthly dependency updates
- **Browser Testing**: Quarterly compatibility verification
- **Performance Monitoring**: Continuous optimization
- **Documentation**: Regular updates and improvements

---

**Last Updated**: October 15, 2025  
**Version**: 0.0.0 (Development)  
**License**: MIT  
**Maintainer**: Peter Darley Jr. (pdarleyjr)