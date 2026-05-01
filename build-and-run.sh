#!/bin/bash

# BluestTeeth Full Development and Deployment Script
# Handles: Uninstall → Build → Install → Launch cycle
# Includes debugging and troubleshooting features

set -e  # Exit on any error

# Configuration
APP_NAME="bluest-teeth"
APP_DISPLAY_NAME="BluestTeeth"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_FILE="$PROJECT_DIR/bluest-teeth-debug.log"
BUILD_DIR="$PROJECT_DIR/src-tauri/target/release"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# System dependency checks
check_dependencies() {
    log "Checking system dependencies..."

    # Check for required commands
    local deps=("npm" "cargo" "bluetoothctl" "systemctl")
    local missing_deps=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        error "Please install them first:"
        error "  - npm: https://nodejs.org/"
        error "  - cargo/rust: https://rustup.rs/"
        error "  - bluetoothctl: sudo apt install bluez"
        exit 1
    fi

    # Check Bluetooth service
    if ! systemctl is-active --quiet bluetooth; then
        warn "Bluetooth service is not running. Starting it..."
        sudo systemctl start bluetooth || warn "Failed to start Bluetooth service"
    fi

    log "All dependencies are available"
}

# Collect system information for debugging
collect_system_info() {
    log "Collecting system information..."

    {
        echo "=== System Information ==="
        echo "Date: $(date)"
        echo "User: $(whoami)"
        echo "OS: $(uname -a)"
        echo "Kernel: $(uname -r)"
        echo ""

        echo "=== Bluetooth Status ==="
        bluetoothctl show 2>/dev/null || echo "bluetoothctl show failed"
        echo ""

        echo "=== Node.js Version ==="
        node --version
        npm --version
        echo ""

        echo "=== Rust Version ==="
        cargo --version
        rustc --version
        echo ""

        echo "=== Project Dependencies ==="
        if [ -f "package.json" ]; then
            echo "Frontend deps installed: $(ls node_modules 2>/dev/null | wc -l) packages"
        fi
        echo ""

    } > "$LOG_FILE"
}

# Uninstall existing application
uninstall_app() {
    log "Checking for existing installation..."

    # Check for installed package
    if dpkg -l | grep -q "$APP_NAME"; then
        log "Found existing package installation. Removing..."
        sudo dpkg --purge "$APP_NAME" || warn "Failed to purge existing package"
    fi

    # Check for AppImage
    if [ -f "/usr/local/bin/$APP_DISPLAY_NAME" ]; then
        log "Found AppImage installation. Removing..."
        sudo rm -f "/usr/local/bin/$APP_DISPLAY_NAME"
    fi

    # Clean up any leftover files
    sudo rm -rf "/opt/$APP_NAME" 2>/dev/null || true

    log "Uninstallation complete"
}

# Install dependencies
install_dependencies() {
    log "Installing project dependencies..."

    # Install npm dependencies
    if [ ! -d "node_modules" ]; then
        log "Installing npm dependencies..."
        npm install
    else
        info "npm dependencies already installed"
    fi

    # Install Tauri CLI if not present
    if ! command -v tauri &> /dev/null; then
        log "Installing Tauri CLI..."
        cargo install tauri-cli --version "^1.5"
    fi

    log "Dependencies installation complete"
}

# Build the application
build_app() {
    log "Building application..."

    # Clean previous builds
    log "Cleaning previous builds..."
    rm -rf dist/ src-tauri/target/

    # Build frontend
    log "Building frontend..."
    npm run build

    # Build Tauri application
    log "Building Tauri application..."
    cd src-tauri
    cargo build --release
    cd ..

    # Check if build was successful
    if [ ! -f "$BUILD_DIR/$APP_NAME" ]; then
        error "Build failed - binary not found at $BUILD_DIR/$APP_NAME"
        exit 1
    fi

    log "Build completed successfully"
}

# Package the application
package_app() {
    log "Packaging application..."

    cd src-tauri
    cargo tauri build
    cd ..

    if [ -d "src-tauri/target/release/bundle" ]; then
        log "Packaging completed successfully"
        ls -la src-tauri/target/release/bundle/
    else
        warn "No bundle directory found - packaging may have failed"
    fi
}

# Install the application
install_app() {
    log "Installing application..."

    # Try to install from package first
    local installed=false

    # Check for .deb package
    if ls src-tauri/target/release/bundle/deb/*.deb &>/dev/null; then
        local deb_file=$(ls src-tauri/target/release/bundle/deb/*.deb | head -1)
        log "Installing from .deb package: $deb_file"
        sudo dpkg -i "$deb_file"
        sudo apt-get install -f  # Fix any missing dependencies
        installed=true
    fi

    # Check for .rpm package
    if ! $installed && ls src-tauri/target/release/bundle/rpm/*.rpm &>/dev/null; then
        local rpm_file=$(ls src-tauri/target/release/bundle/rpm/*.rpm | head -1)
        log "Installing from .rpm package: $rpm_file"
        if command -v rpm &> /dev/null; then
            sudo rpm -i "$rpm_file"
            installed=true
        else
            warn "rpm not available, skipping .rpm installation"
        fi
    fi

    # Check for AppImage
    if ! $installed && ls src-tauri/target/release/bundle/appimage/*.AppImage &>/dev/null; then
        local appimage_file=$(ls src-tauri/target/release/bundle/appimage/*.AppImage | head -1)
        log "Installing AppImage: $appimage_file"
        sudo cp "$appimage_file" "/usr/local/bin/$APP_DISPLAY_NAME"
        sudo chmod +x "/usr/local/bin/$APP_DISPLAY_NAME"
        installed=true
    fi

    if ! $installed; then
        error "No installable package found. You may need to run in development mode."
        exit 1
    fi

    log "Installation completed successfully"
}

# Launch the application
launch_app() {
    log "Launching application..."

    # Try different launch methods
    if command -v "$APP_DISPLAY_NAME" &> /dev/null; then
        log "Launching via command: $APP_DISPLAY_NAME"
        nohup "$APP_DISPLAY_NAME" > /dev/null 2>&1 &
        sleep 2
    elif command -v "$APP_NAME" &> /dev/null; then
        log "Launching via command: $APP_NAME"
        nohup "$APP_NAME" > /dev/null 2>&1 &
        sleep 2
    elif [ -f "/usr/local/bin/$APP_DISPLAY_NAME" ]; then
        log "Launching AppImage from /usr/local/bin/"
        nohup "/usr/local/bin/$APP_DISPLAY_NAME" > /dev/null 2>&1 &
        sleep 2
    else
        warn "Application not found in PATH. Try running in development mode:"
        echo "  make dev"
        exit 1
    fi

    # Check if it's running
    sleep 3
    if pgrep -f "$APP_NAME\|$APP_DISPLAY_NAME" > /dev/null; then
        log "Application launched successfully!"
        info "Application is running. Check system monitor or use 'pgrep -f $APP_NAME' to verify."
    else
        warn "Application may not have started properly. Check logs:"
        echo "  tail -f $LOG_FILE"
        echo "  journalctl -f | grep -i bluetooth"
    fi
}

# Development mode launcher with debugging
dev_mode() {
    log "Starting in development mode with debugging..."

    # Check if port 1420 is available (Tauri dev server default)
    if lsof -i :1420 &>/dev/null; then
        warn "Port 1420 is in use. Killing existing process..."
        kill $(lsof -t -i :1420) 2>/dev/null || true
        sleep 2
    fi

    # Start Bluetooth monitoring for debugging
    info "Starting Bluetooth debug monitoring..."
    bluetoothctl monitor > "$PROJECT_DIR/bluetooth-debug.log" 2>&1 &
    local bt_pid=$!

    # Start development server
    log "Starting Tauri development server..."
    cd "$PROJECT_DIR"
    cargo tauri dev &
    local dev_pid=$!

    # Wait a bit for startup
    sleep 5

    # Check if processes are running
    if kill -0 $dev_pid 2>/dev/null; then
        log "Development server started successfully (PID: $dev_pid)"
        log "Bluetooth monitoring started (PID: $bt_pid)"
        info ""
        info "Development mode active!"
        info "  - Frontend: http://localhost:1420"
        info "  - Logs: tail -f $LOG_FILE"
        info "  - Bluetooth logs: tail -f $PROJECT_DIR/bluetooth-debug.log"
        info "  - Stop with: kill $dev_pid $bt_pid"
        info ""
        info "Press Ctrl+C to stop all processes"

        # Wait for user interrupt
        trap "log 'Stopping development mode...'; kill $dev_pid $bt_pid 2>/dev/null; exit 0" INT
        wait $dev_pid
    else
        error "Failed to start development server"
        kill $bt_pid 2>/dev/null || true
        exit 1
    fi
}

# Debug helper
debug_info() {
    log "Generating debug information..."

    {
        echo "=== Debug Information ==="
        echo "Generated: $(date)"
        echo ""

        echo "=== Process Status ==="
        ps aux | grep -E "($APP_NAME|$APP_DISPLAY_NAME|tauri)" | grep -v grep || echo "No related processes found"
        echo ""

        echo "=== Bluetooth Status ==="
        bluetoothctl show || echo "bluetoothctl show failed"
        bluetoothctl devices || echo "bluetoothctl devices failed"
        echo ""

        echo "=== System Services ==="
        systemctl status bluetooth --no-pager -l || echo "Bluetooth service status check failed"
        echo ""

        echo "=== Recent Logs ==="
        if [ -f "$LOG_FILE" ]; then
            tail -20 "$LOG_FILE"
        fi
        echo ""

        echo "=== Build Status ==="
        if [ -d "src-tauri/target" ]; then
            echo "Rust build exists"
            ls -la src-tauri/target/release/ 2>/dev/null | head -5 || echo "No release build found"
        else
            echo "No build directory found"
        fi
        echo ""

    } > "$PROJECT_DIR/debug-info.txt"

    log "Debug information saved to: $PROJECT_DIR/debug-info.txt"
    cat "$PROJECT_DIR/debug-info.txt"
}

# Main execution
main() {
    local action="${1:-full}"

    # Initialize log file
    > "$LOG_FILE"
    log "BluestTeeth Build Script Started"
    log "Action: $action"

    cd "$PROJECT_DIR"

    case "$action" in
        "uninstall")
            check_dependencies
            uninstall_app
            ;;
        "build")
            check_dependencies
            collect_system_info
            install_dependencies
            build_app
            ;;
        "install")
            install_app
            ;;
        "launch")
            launch_app
            ;;
        "dev")
            check_dependencies
            collect_system_info
            dev_mode
            ;;
        "debug")
            debug_info
            ;;
        "full")
            check_dependencies
            collect_system_info
            uninstall_app
            install_dependencies
            build_app
            package_app
            install_app
            launch_app
            ;;
        *)
            echo "Usage: $0 {full|uninstall|build|install|launch|dev|debug}"
            echo ""
            echo "Actions:"
            echo "  full      - Complete cycle: uninstall → build → install → launch"
            echo "  uninstall - Remove existing installation"
            echo "  build     - Build the application"
            echo "  install   - Install built application"
            echo "  launch    - Launch installed application"
            echo "  dev       - Start development mode with debugging"
            echo "  debug     - Generate debug information"
            exit 1
            ;;
    esac

    log "Script completed successfully"
}

# Run main function with all arguments
main "$@"