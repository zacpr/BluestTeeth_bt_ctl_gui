# BluestTeeth

A modern, highly optimized, and visually striking GUI for the `bluetoothctl` CLI application.

 ![Electric Aurora Theme](screenshot.png)

## Features

* 🎨 **Electric Aurora Design & Custom Themes** - A visually striking dark theme with cyan accents, glassmorphism, and a built-in theme builder.
* ⚡ **Event-Driven Architecture** - Real-time Bluetooth monitoring via a Rust backend, completely eliminating UI polling for minimal CPU usage.
* 🔍 **Advanced Filtering & Fuzzy Search** - Instantly find devices using the real-time fuzzy search and state filters (Connected, Paired, Trusted).
* 📦 **Batch Operations** - Select multiple devices to connect, disconnect, trust, or remove them all at once.
* 📡 **Animated Device Discovery** - Radar-style scanning with 3D perspective and real-time signal waveform visualization (RSSI).
* 🔋 **Battery Monitoring** - See battery levels for supported devices directly in the device list.
* 🖥️ **Cross-Platform** - Native packages for Linux (RPM, DEB), Windows (MSI), and macOS (DMG).

## Installation

### Ubuntu / Debian / DEB-based distros

```bash
sudo dpkg -i bluest-teeth_*.deb
sudo apt-get install -f  # Install dependencies if needed
```

### Fedora / openSUSE / RPM-based distros

```bash
sudo rpm -i bluest-teeth-*.rpm
```

### Windows

Download and run the MSI installer from the releases page.

### macOS

Download and open the DMG from the releases page, then drag BluestTeeth to Applications.

## Building from Source

### Prerequisites

* [Node.js](https://nodejs.org/) 18+ and npm
* [Rust](https://rustup.rs/) toolchain
* Linux dependencies: `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `glib-2.0`

### Build Process

```bash
# Clone the repository
git clone https://github.com/yourusername/bluest-teeth.git
cd bluest-teeth

# Install frontend dependencies
npm install

# Run in development mode
npm run dev
# Or with Tauri
npm run tauri dev

# Build for production
npm run tauri build
```

**Note for Linux** `.deb` builds:
A `posttauri` hook script (`scripts/fix-deb.sh`) is automatically run by npm to patch the `.deb` archive header if you are building on a system with a large User ID (UID), ensuring compatibility with `dpkg`.

Built packages will be in `src-tauri/target/release/bundle/`.

### Makefile Targets

You can also use the Makefile for various build tasks:

```bash
make help          # Show all available targets
make install-deps  # Install all dependencies
make dev           # Run in development mode
make build         # Build for current platform
make clean         # Clean build artifacts
make test          # Run tests
make fmt           # Format code
make lint          # Lint code
```

## Usage


1. **Launch BluestTeeth** - The app will automatically detect your Bluetooth controller
2. **Scan for Devices** - Click the "Scan" button to discover nearby devices
3. **Connect** - Click on a device to open its detail panel, then click "Connect"
4. **Pair & Trust** - For new devices, pair them first, then optionally mark as trusted
5. **Manage** - Disconnect, remove, or view detailed device information

## Keyboard Shortcuts

| Shortcut | Action |
|----|----|
| `Ctrl+R` | Refresh device list |
| `Ctrl+S` | Start/Stop scan |
| `Esc` | Close device details |
| `F5` | Refresh |

## Configuration

BluestTeeth stores its configuration in:

* **Linux**: `~/.config/com.bluestteeth.app/`
* **Windows**: `%APPDATA%\com.bluestteeth.app\`
* **macOS**: `~/Library/Application Support/com.bluestteeth.app/`

## Debugging and Troubleshooting

### Debug Script

Use the debug script to collect comprehensive system information:

```bash
./build-and-run.sh debug
```

This generates `debug-info.txt` with system status, Bluetooth info, and application logs.

### Development Mode with Debugging

Run in development mode with enhanced logging:

```bash
./build-and-run.sh dev
```

This starts:

* Tauri development server with hot reload
* Bluetooth event monitoring
* Automatic log collection

### Common Issues

#### Bluetooth not detected

Make sure `bluetoothctl` and `bluez` are installed:

```bash
# Fedora
sudo dnf install bluez

# Ubuntu
sudo apt-get install bluez

# Start Bluetooth service
sudo systemctl start bluetooth
```

#### Permission denied

Ensure your user is in the `bluetooth` group:

```bash
sudo usermod -aG bluetooth $USER
# Log out and back in
```

#### Application won't start

Check the debug logs:

```bash
# View main application logs
tail -f bluest-teeth-debug.log

# View Bluetooth events
tail -f bluetooth-debug.log

# Check system logs
journalctl -f | grep -i bluetooth
```

#### Build fails


1. Check dependencies are installed:

   ```bash
   ./build-and-run.sh debug
   ```
2. Clean and rebuild:

   ```bash
   make clean
   ./build-and-run.sh build
   ```
3. Check for specific error messages in the logs

#### Performance issues

* The app automatically reduces particle effects on lower-end devices
* Check system resources: `top` or `htop`
* Disable animations if needed in theme settings

### Log Files

* `bluest-teeth-debug.log` - Main application logs
* `bluetooth-debug.log` - Bluetooth event monitoring
* `debug-info.txt` - System information snapshot
* Browser console (F12) - Frontend JavaScript logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

* Built with [Tauri](https://tauri.app/) - Rust + Web technologies
* UI powered by [Svelte](https://svelte.dev/)
* Bluetooth integration via `bluetoothctl` and BlueZ
* all for you damien!


