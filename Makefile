# BluestTeeth Build Makefile

.PHONY: all dev build build-linux build-windows build-macos clean install-deps

all: build

# Development mode
dev:
	@echo "Starting development server..."
	@cargo tauri dev

# Install dependencies
install-deps:
	@echo "Installing npm dependencies..."
	@npm install
	@echo "Installing Tauri CLI..."
	@cargo install tauri-cli --version "^1.5"
	@echo "Installing cargo-bundle for packaging..."
	@cargo install cargo-bundle

# Build for current platform
build:
	@echo "Building for current platform..."
	@npm run build
	@cargo tauri build

# Build for Linux
build-linux:
	@echo "Building for Linux..."
	@npm run build
	@cargo tauri build --target x86_64-unknown-linux-gnu

# Build for Windows (requires Windows or cross-compilation setup)
build-windows:
	@echo "Building for Windows..."
	@npm run build
	@cargo tauri build --target x86_64-pc-windows-msvc

# Build for macOS (requires macOS)
build-macos:
	@echo "Building for macOS..."
	@npm run build
	@cargo tauri build --target x86_64-apple-darwin
	@cargo tauri build --target aarch64-apple-darwin

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf src-tauri/target/
	@cargo clean

# Run tests
test:
	@cargo test

# Format code
fmt:
	@cargo fmt
	@npx prettier --write "src/**/*.{js,svelte,css}"

# Lint code
lint:
	@cargo clippy
	@npx eslint src/

# Package for distribution (requires built artifacts)
package:
	@echo "Packaging for distribution..."
	@mkdir -p dist-packages
	@cp src-tauri/target/release/bundle/deb/*.deb dist-packages/ 2>/dev/null || true
	@cp src-tauri/target/release/bundle/rpm/*.rpm dist-packages/ 2>/dev/null || true
	@cp src-tauri/target/release/bundle/appimage/*.AppImage dist-packages/ 2>/dev/null || true
	@cp src-tauri/target/release/bundle/msi/*.msi dist-packages/ 2>/dev/null || true
	@cp src-tauri/target/release/bundle/dmg/*.dmg dist-packages/ 2>/dev/null || true
	@echo "Packages copied to dist-packages/"

# Help
help:
	@echo "Available targets:"
	@echo "  dev          - Run in development mode"
	@echo "  install-deps - Install all dependencies"
	@echo "  build        - Build for current platform"
	@echo "  build-linux  - Build for Linux (x86_64)"
	@echo "  build-windows- Build for Windows (x86_64)"
	@echo "  build-macos  - Build for macOS (x86_64, arm64)"
	@echo "  clean        - Clean build artifacts"
	@echo "  test         - Run tests"
	@echo "  fmt          - Format code"
	@echo "  lint         - Lint code"
	@echo "  package      - Copy packages to dist-packages/"
	@echo "  help         - Show this help"
