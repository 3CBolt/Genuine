# Contributing to Genuine Verify SDK

Thank you for your interest in contributing to Genuine Verify SDK! This document provides guidelines for contributing to the project.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/Genuine.git`
3. **Install dependencies**: `npm install`
4. **Build the SDK**: `cd packages/genuine-verify-sdk && npm run build`
5. **Run tests**: `npm test`
6. **Make your changes**
7. **Submit a pull request**

## 📋 Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Local Development
```bash
# Install dependencies
npm install

# Build SDK
cd packages/genuine-verify-sdk
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## 🧪 Testing

We use Jest for testing. Run tests with:
```bash
npm test
```

### Test Structure
- Unit tests: `src/lib/__tests__/`
- Hook tests: `src/lib/hooks/__tests__/`
- Integration tests: `src/app/` (demo pages)

## 📝 Code Style

### TypeScript
- Use TypeScript for all new code
- Follow existing patterns for types and interfaces
- Export types from `src/index.ts`

### React Components
- Use functional components with hooks
- Follow existing prop patterns
- Include proper TypeScript types

### Documentation
- Update README.md for new features
- Add JSDoc comments for public APIs
- Include usage examples

## 🎯 Contribution Areas

### High Priority
- **Bug fixes** - Critical issues affecting functionality
- **Performance improvements** - TensorFlow.js optimization
- **Accessibility** - Screen reader support, keyboard navigation
- **Browser compatibility** - Edge cases and mobile support

### Medium Priority
- **New gesture types** - Additional verification methods
- **UI improvements** - Better user experience
- **Analytics enhancements** - Better debugging tools
- **Documentation** - More examples and guides

### Low Priority
- **Styling customization** - Theme support
- **Advanced features** - Complex integrations
- **Backend examples** - More server implementations

## 🔧 Development Guidelines

### Adding New Features
1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Write tests first**: Ensure test coverage
3. **Update documentation**: README.md and inline docs
4. **Test thoroughly**: Multiple browsers and devices
5. **Submit PR**: Include description and screenshots

### Bug Reports
When reporting bugs, please include:
- **Environment**: OS, browser, version
- **Steps to reproduce**: Clear, minimal steps
- **Expected vs actual behavior**: What should happen vs what happens
- **Console errors**: Any error messages
- **Screenshots**: Visual issues

### Pull Request Guidelines
- **Descriptive title**: Clear summary of changes
- **Detailed description**: What, why, and how
- **Tests included**: New tests for new features
- **Documentation updated**: README and inline docs
- **Screenshots**: For UI changes

## 🏗️ Project Structure

```
packages/genuine-verify-sdk/
├── src/
│   ├── components/          # React components
│   ├── lib/                # Core utilities
│   │   ├── hooks/         # Custom React hooks
│   │   └── __tests__/     # Unit tests
│   └── index.ts           # Main exports
├── dist/                  # Built output
├── README.md             # Documentation
└── package.json          # Package config
```

## 🐛 Common Issues

### Build Issues
- **TypeScript errors**: Run `npm run type-check`
- **Missing dependencies**: Check `package.json`
- **Version conflicts**: Clear `node_modules` and reinstall

### Test Issues
- **Jest environment**: Ensure proper setup in `jest.config.js`
- **Mock issues**: Check mock implementations
- **Async tests**: Use proper async/await patterns

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md and inline docs

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for contributing to Genuine Verify SDK! Your contributions help make the web a more secure and user-friendly place. 