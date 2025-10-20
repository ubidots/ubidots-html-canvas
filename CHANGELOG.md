# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- TypeScript rewrite with strict typing
- Modern pub/sub architecture with EventBus
- Integration with @ubidots/ubidots-javascript-library
- Comprehensive test suite with 126 tests
- Auto-generated documentation with TypeDoc
- Multiple build formats (CJS, ESM, IIFE)
- Error isolation and better error handling
- Type-safe event system
- Widget configuration management

### Changed

- Build system migrated from webpack to tsup
- Package manager changed from yarn to pnpm
- Improved API with getter methods for state access
- Enhanced development workflow with Vitest

### Deprecated

- `getHeader()` method - use `getHeaders()` instead
- Direct property access - use getter methods

### Removed

- Legacy JavaScript build configuration
- Outdated dependencies

## [1.1.0] - 2024-12-15

### Added

- Global type declarations for better IDE support
- Improved code formatting and structure

### Fixed

- Missing newlines in various files
- Code formatting inconsistencies

## [1.0.0] - 2024-06-01

### Added

- Initial stable release
- Basic widget-dashboard communication
- PostMessage API integration
- Support for device selection events
- Date range filtering
- Real-time mode toggle
- Dashboard refresh capabilities

### Security

- Origin validation for PostMessage events
