# Fire Pump Panel Simulator

A professional-grade fire pump panel simulator for Pierce PUC apparatus training, built with React, TypeScript, PixiJS, and Tone.js.

## 🎯 Purpose

This simulator provides realistic training for fire service personnel on Pierce PUC (Pumper Unit Controller) operation, hydraulic calculations, and emergency scenarios. It meets NFPA 1901 safety standards and Pierce PUC specifications.

## ✨ Features

- **Realistic Pierce PUC Interface**: Authentic pump panel layout
- **Professional Hydraulics**: NFPA-compliant calculations and pump curves
- **Multi-Platform**: Touch, keyboard, and screen reader accessible
- **Audio Feedback**: Engine sounds, alarms, and haptic feedback
- **Training Scenarios**: Cavitation, overpressure, and emergency situations
- **Instructor Mode**: Remote control via WebSocket connection

## 🏗️ Architecture

- **Frontend**: React + TypeScript + PixiJS + Tone.js
- **Backend**: Cloudflare Durable Objects (WebSocket server)
- **Deployment**: Cloudflare Pages + Workers
- **Performance**: 60 FPS, CSP compliant, memory optimized

## 🚀 Quick Start

### Development
```bash
cd pump-panel-sim
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy Worker
```bash
cd do-worker
npm install
npm run deploy
```

## 📱 Device Support

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Tablets**: iPad Air/Pro, Samsung Galaxy Tab, Surface
- **Mobile**: iOS Safari, Android Chrome
- **Accessibility**: NVDA, JAWS, VoiceOver compatible

## 🔧 Testing

```bash
npm test                    # Unit tests
npm run test:coverage      # Coverage report
```

## 📋 Standards Compliance

- ✅ **NFPA 1901**: Fire apparatus safety standards
- ✅ **Pierce PUC**: Manufacturer specifications
- ✅ **WCAG 2.1 AA**: Accessibility compliance
- ✅ **CSP Level 3**: Security compliance

## 📖 Documentation

- [NFPA 1901 Compliance Report](pump-panel-sim/NFPA_1901_COMPLIANCE.md)
- [Hydraulic Validation](pump-panel-sim/HYDRAULIC_VALIDATION.md)
- [Performance Guide](pump-panel-sim/PERFORMANCE.md)
- [Memory Management](pump-panel-sim/MEMORY_MANAGEMENT.md)
- [CSP Compliance](pump-panel-sim/CSP_COMPLIANCE.md)
- [Keyboard Controls](pump-panel-sim/KEYBOARD_CONTROLS.md)
- [Touch Testing Guide](pump-panel-sim/TOUCH_TESTING_GUIDE.md)
- [Screen Reader Testing](pump-panel-sim/SCREEN_READER_TESTING_GUIDE.md)
- [Instructor Mode Guide](pump-panel-sim/INSTRUCTOR_MODE_GUIDE.md)

## 🔗 Links

- **Application**: [Deploy URL will be here]
- **Documentation**: [Docs URL will be here]
- **Issues**: [GitHub Issues]

## 📄 License

[License information]

---

**Fire Pump Panel Simulator** - Professional fire service training technology