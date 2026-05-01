# BluestTeeth: The Plan

A cool and fun GUI for the bluetoothctl CLI app.

## Architecture

### Tech Stack: Tauri (Rust + Svelte)

* **Backend**: Rust with Tokio async runtime - wraps bluetoothctl commands
* **Frontend**: Svelte with reactive stores - "Electric Aurora" glassmorphism design
* **Packaging**: Tauri's native bundler for RPM, DEB, MSI, AppImage, DMG
* **CI/CD**: GitHub Actions for automated multi-platform builds

### Visual Design: "Electric Aurora"

* Deep midnight blue backgrounds with subtle radial gradients
* Electric cyan accents (#00d4ff) with soft glow effects
* Glassmorphism panels (frosted glass) with backdrop blur
* Animated scan lines and pulse effects during discovery
* Status indicators with color-coded states

## Project Structure

```
bluest-teeth/
├── src/                          # Frontend (Svelte)
│   ├── App.svelte               # Main app component
│   ├── main.js                  # Entry point
│   ├── styles.css               # Electric Aurora theme variables
│   ├── components/
│   │   ├── Header.svelte        # Controller status, scan toggle
│   │   ├── DeviceList.svelte    # Device grid with signal strength
│   │   ├── DeviceDetail.svelte  # Detail panel with actions
│   │   └── ScanAnimation.svelte # Animated scan overlay
│   └── stores/
│       └── bluetooth.js         # Tauri invoke wrappers
├── src-tauri/                   # Backend (Rust)
│   ├── src/main.rs              # bluetoothctl integration
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri config
│   ├── build.rs                 # Build script
│   ├── resources/
│   │   └── bluest-teeth.desktop # Linux desktop entry
│   └── icons/                   # App icons (PNG, ICO)
├── .github/workflows/
│   └── build.yml                # CI/CD for all platforms
├── package.json                 # Node dependencies
├── vite.config.js               # Vite + Svelte config
├── Makefile                     # Build convenience commands
├── README.md                    # User documentation
└── LICENSE                      # MIT License
```

## Features Implemented

### Core Functionality

- [x] Controller detection and power management
- [x] Device discovery with animated scan visualization
- [x] Device listing with sorting (connected → paired → available)
- [x] Device detail panel with all metadata
- [x] Connect/Disconnect operations
- [x] Pair/Unpair operations
- [x] Trust/Untrust operations
- [x] Remove device
- [x] Real-time status updates (3s refresh)
- [x] Signal strength (RSSI) visualization
- [x] Battery level display

### UI/UX

- [x] Electric Aurora dark theme with glassmorphism
- [x] Animated scan effects (line sweep, pulse rings)
- [x] Status badges with color coding
- [x] Device icons based on type (headphones, keyboard, etc.)
- [x] Loading states and error handling
- [x] Empty states for no devices / scanning
- [x] Confirmation dialog for device removal
- [x] System tray integration (basic)

### Packaging

- [x] RPM for Fedora/openSUSE
- [x] DEB for Ubuntu/Debian
- [x] AppImage for universal Linux
- [x] MSI for Windows
- [x] DMG for macOS (x86_64, ARM64)
- [x] GitHub Actions CI/CD pipeline

## Build Instructions

```bash
# Development
make dev

# Production build
make build

# Platform-specific
make build-linux
make build-windows
make build-macos

# Packaging
make package
```

## Dependencies

### Runtime

* bluez (Linux Bluetooth stack)
* bluetoothctl (usually bundled with bluez)

### Build

* Rust 1.70+
* Node.js 18+
* Tauri CLI
* Linux: libgtk-3-dev, libwebkit2gtk-4.0-dev

## Next Steps / Future Enhancements

- [ ] File transfer (OBEX) integration
- [ ] Audio profile switching (A2DP, HSP, HFP)
- [ ] Keyboard shortcuts
- [ ] Theme customization options
- [ ] Plugin system for custom device types
- [ ] Bluetooth Low Energy (BLE) GATT explorer
- [ ] Connection history and auto-reconnect preferences
- [ ] Notification integration for connection events


