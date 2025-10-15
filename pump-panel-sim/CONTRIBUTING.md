# Contributing to Fire Pump Panel Simulator

Thank you for your interest in contributing to the Fire Pump Panel Simulator! This document provides guidelines for setting up your development environment, building the project, and submitting contributions.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Building and Running](#building-and-running)
- [Testing](#testing)
- [Code Style and Quality](#code-style-and-quality)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Project Structure](#project-structure)

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Git**: Latest stable version

### Initial Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/Fire_Pump_Panel.git
cd Fire_Pump_Panel/pump-panel-sim
```

2. **Install dependencies:**

```bash
npm install
```

3. **Verify installation:**

```bash
npm run type-check
npm run lint
```

## Building and Running

### Development Server

Start the Vite development server with hot module replacement:

```bash
npm run dev
```

The simulator will be available at `http://localhost:5173`

**Development Features:**
- Hot Module Replacement (HMR) for instant updates
- Source maps for debugging
- TypeScript type checking in real-time
- Console logging for development insights

### Production Build

Build the application for production deployment:

```bash
npm run build
```

This creates an optimized bundle in the `dist/` directory with:
- Minified JavaScript and CSS
- Tree-shaking to remove unused code
- Asset optimization and compression
- Source maps (optional, configure in `vite.config.ts`)

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

This serves the `dist/` directory to verify the production build before deployment.

## Testing

### Unit Tests

Run the unit test suite:

```bash
npm test
```

**Test Coverage:**
- Hydraulic formulas ([`src/hydraulics/formulas.test.ts`](src/hydraulics/formulas.test.ts))
- Pump curves and cavitation ([`src/sim/pump-curves.test.ts`](src/sim/pump-curves.test.ts))
- Governor systems ([`src/sim/governor.test.ts`](src/sim/governor.test.ts))
- Engine behavior ([`src/sim/engine.test.ts`](src/sim/engine.test.ts))
- Interlocks and safety systems ([`src/sim/interlocks.test.ts`](src/sim/interlocks.test.ts))

### Property-Based Tests

Run property-based tests for hydraulic calculations:

```bash
npm test -- formulas.property.test.ts
```

### Watch Mode

Run tests in watch mode during development:

```bash
npm test -- --watch
```

## Code Style and Quality

### Linting

Check code style with ESLint:

```bash
npm run lint
```

Fix auto-fixable linting issues:

```bash
npm run lint -- --fix
```

### Type Checking

Verify TypeScript types:

```bash
npm run type-check
```

### Style Guidelines

The project uses:
- **ESLint** for JavaScript/TypeScript linting
- **Stylelint** for CSS linting
- **TypeScript** strict mode for type safety

**Key Conventions:**
- Use functional components with hooks (React)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Keep functions small and focused (single responsibility)
- Use TypeScript types over `any` whenever possible

### Formatting

Code formatting is enforced through ESLint rules. Before committing:

```bash
npm run lint
npm run type-check
```

## Pull Request Guidelines

### Before Submitting

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes:**
   - Write clear, descriptive commit messages
   - Keep commits atomic (one logical change per commit)
   - Update tests if modifying functionality
   - Update documentation if changing APIs

3. **Verify your changes:**

```bash
npm run lint
npm run type-check
npm test
npm run build
```

4. **Test the production build:**

```bash
npm run preview
```

### Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add cavitation detection algorithm
fix: Correct intake pressure calculation for draft mode
docs: Update README with WebGL context handling
refactor: Extract gauge logic into separate module
test: Add tests for governor RPM mode
```

**Prefixes:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functional changes)
- `test:` - Adding or updating tests
- `perf:` - Performance improvements
- `chore:` - Build process or tooling changes

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Documentation updated (if applicable)
- [ ] Tests added/updated for new functionality
- [ ] Changes are backward compatible (or breaking changes documented)

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## Project Structure

### Key Directories

```
pump-panel-sim/
├── public/              # Static assets
│   ├── _headers         # Cloudflare Pages CSP headers
│   ├── controls/        # Control graphics (knobs, levers)
│   ├── gauges/          # Gauge face images
│   └── audio/           # Audio samples
├── src/
│   ├── audio/           # Tone.js audio system
│   ├── hydraulics/      # Hydraulic calculations
│   ├── net/             # WebSocket instructor mode
│   ├── sim/             # Simulation engine
│   ├── training/        # Training scenarios
│   ├── ui/              # React UI components
│   │   ├── cards/       # Panel card components
│   │   ├── controls/    # Interactive controls (PixiJS)
│   │   ├── gauges/      # Gauge displays
│   │   ├── keyboard/    # Keyboard navigation
│   │   ├── layout/      # Grid layout system
│   │   └── pixi/        # PixiJS context management
│   └── utils/           # Utility functions
└── tests/               # Test files (co-located with source)
```

### Important Files

- **[`vite.config.ts`](vite.config.ts)** - Vite build configuration
- **[`tsconfig.json`](tsconfig.json)** - TypeScript configuration
- **[`eslint.config.js`](eslint.config.js)** - ESLint rules
- **[`public/_headers`](public/_headers)** - CSP headers for Cloudflare Pages
- **[`wrangler.toml`](wrangler.toml)** - Cloudflare Pages configuration

## Architecture Notes

### React + PixiJS Integration

The simulator uses React for UI state management and PixiJS for hardware-accelerated 2D rendering:

- **React**: Handles application state, user interactions, HUD displays
- **PixiJS v8**: Renders the pump panel, gauges, and controls via WebGL
- Integration via [`src/ui/Panel.tsx`](src/ui/Panel.tsx) and [`src/ui/PanelManager.ts`](src/ui/PanelManager.ts)

### Simulation Engine

The simulation engine ([`src/sim/`](src/sim/)) uses a time-stepped solver:

1. **State Management** ([`src/sim/state.ts`](src/sim/state.ts)) - Centralized state
2. **Solver** ([`src/sim/solver.ts`](src/sim/solver.ts)) - Time-stepped physics
3. **Pump Curves** ([`src/sim/pump-curves.ts`](src/sim/pump-curves.ts)) - Realistic pump behavior
4. **Interlocks** ([`src/sim/interlocks.ts`](src/sim/interlocks.ts)) - Safety systems

### CSP Compliance

All code must be CSP-compliant (no `eval`, no `unsafe-inline`):

- Use static imports, not dynamic `eval()`
- CSS-in-JS must use CSS Modules or CSS files
- Audio context created only after user gesture
- See [`CSP_COMPLIANCE.md`](CSP_COMPLIANCE.md) for details

## Getting Help

- **Documentation**: See project README and inline comments
- **Issues**: Check existing GitHub issues before creating new ones
- **Questions**: Open a GitHub Discussion for general questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to the Fire Pump Panel Simulator!