#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use std::sync::Arc;
use tokio::process::{Command, Child};
use tokio::sync::{RwLock, Mutex};
use tokio::io::BufReader;
use serde::{Serialize, Deserialize};
use tauri::{State, Manager, Emitter};
use std::collections::HashMap;
use regex::Regex;
use once_cell::sync::Lazy;
use std::time::{Duration, Instant};
use serde_json::Value;

// Global regex patterns
static DEVICE_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Device\s+([0-9A-Fa-f:]{17})\s+(.+)").unwrap()
});

static CONTROLLER_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Controller\s+([0-9A-Fa-f:]{17})\s+(.+)").unwrap()
});

static MONITOR_DEVICE_FOUND: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[NEW\]\s+Device\s+([0-9A-Fa-f:]{17})\s+(.+)").unwrap()
});

static MONITOR_DEVICE_CONNECTED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+Connected:\s+yes").unwrap()
});

static MONITOR_DEVICE_DISCONNECTED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+Connected:\s+no").unwrap()
});

static MONITOR_RSSI: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+RSSI:\s+(-?\d+)").unwrap()
});

static MONITOR_BATTERY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+BatteryPercentage:\s+(\d+)").unwrap()
});

static MONITOR_PAIRED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+Paired:\s+yes").unwrap()
});

static MONITOR_UNPAIRED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Device\s+([0-9A-Fa-f:]{17})\s+Paired:\s+no").unwrap()
});

static MONITOR_CONTROLLER_POWERED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Controller\s+([0-9A-Fa-f:]{17})\s+Powered:\s+(yes|no)").unwrap()
});

static MONITOR_CONTROLLER_DISCOVERABLE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\[CHG\]\s+Controller\s+([0-9A-Fa-f:]{17})\s+Discoverable:\s+(yes|no)").unwrap()
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDevice {
    pub mac: String,
    pub name: String,
    pub icon: String,
    pub paired: bool,
    pub trusted: bool,
    pub blocked: bool,
    pub connected: bool,
    pub rssi: Option<i32>,
    pub battery: Option<u8>,
    pub address_type: String,
    pub alias: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothController {
    pub mac: String,
    pub name: String,
    pub powered: bool,
    pub discoverable: bool,
    pub pairable: bool,
    pub discovering: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum BluetoothEvent {
    DeviceFound { mac: String, name: String, rssi: Option<i32> },
    DeviceConnected { mac: String },
    DeviceDisconnected { mac: String },
    RSSIUpdated { mac: String, rssi: i32 },
    BatteryUpdated { mac: String, battery: u8 },
    DevicePaired { mac: String },
    DeviceUnpaired { mac: String },
    ControllerPoweredChanged { mac: String, powered: bool },
    ControllerDiscoverableChanged { mac: String, discoverable: bool },
}

#[derive(Debug, Clone)]
pub struct CachedDevice {
    device: BluetoothDevice,
    cached_at: Instant,
}

impl CachedDevice {
    fn new(device: BluetoothDevice) -> Self {
        CachedDevice {
            device,
            cached_at: Instant::now(),
        }
    }

    fn is_expired(&self, ttl: Duration) -> bool {
        self.cached_at.elapsed() > ttl
    }
}

// App state
pub struct AppState {
    pub scanning: Arc<RwLock<bool>>,
    pub devices: Arc<RwLock<HashMap<String, BluetoothDevice>>>,
    pub controller: Arc<RwLock<Option<BluetoothController>>>,
    pub scan_process: Arc<Mutex<Option<Child>>>,
    pub device_cache: Arc<RwLock<HashMap<String, CachedDevice>>>,
    pub monitor_process: Arc<Mutex<Option<Child>>>,
}

impl AppState {
    fn new() -> Self {
        AppState {
            scanning: Arc::new(RwLock::new(false)),
            devices: Arc::new(RwLock::new(HashMap::new())),
            controller: Arc::new(RwLock::new(None)),
            scan_process: Arc::new(Mutex::new(None)),
            device_cache: Arc::new(RwLock::new(HashMap::new())),
            monitor_process: Arc::new(Mutex::new(None)),
        }
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let state = AppState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_controllers,
            get_devices,
            start_scan,
            stop_scan,
            connect_device,
            disconnect_device,
            connect_profile,
            disconnect_profile,
            pair_device,
            remove_device,
            block_device,
            unblock_device,
            trust_device,
            untrust_device,
            set_device_alias,
            set_controller_power,
            set_controller_discoverable,
            get_device_info,
            send_file_to_device,
            run_automation_command,
            send_automation_webhook,
        ])
        .setup(|app| {
            let app_handle_1 = app.handle().clone();
            let app_handle_2 = app.handle().clone();

            tokio::spawn(async move {
                let _ = start_bluetooth_monitor(app_handle_1).await;
            });

            tokio::spawn(async move {
                let _ = refresh_controller_periodically(app_handle_2).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_bluetooth_monitor(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let state = app_handle.state::<AppState>();

    let mut child = Command::new("bluetoothctl")
        .args(&["monitor"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start bluetoothctl monitor: {}", e))?;

    let stdout = child.stdout.take().ok_or("Stdout not captured")?;

    {
        let mut monitor_process = state.monitor_process.lock().await;
        *monitor_process = Some(child);
    }

    use tokio::io::AsyncBufReadExt;

    let mut reader = BufReader::new(stdout);
    let mut line = String::new();

    loop {
        line.clear();
        let bytes_read = reader.read_line(&mut line).await?;

        if bytes_read == 0 {
            break;
        }

        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if let Some(event) = parse_monitor_line(line) {
            match &event {
                BluetoothEvent::DeviceFound { mac, .. } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get(mac) {
                        let mut updated_device = device.clone();
                        if let BluetoothEvent::DeviceFound { rssi, .. } = &event {
                            updated_device.rssi = *rssi;
                        }
                        devices.insert(mac.clone(), updated_device);
                    } else {
                        if let Ok(info) = get_device_info_internal(mac).await {
                            let new_device = BluetoothDevice {
                                mac: mac.clone(),
                                name: info.get("Alias").or_else(|| info.get("Name")).cloned().unwrap_or_else(|| "Unknown Device".to_string()),
                                icon: info.get("Icon").cloned().unwrap_or_else(|| "bluetooth".to_string()),
                                paired: info.get("Paired").map(|v| v == "yes").unwrap_or(false),
                                trusted: info.get("Trusted").map(|v| v == "yes").unwrap_or(false),
                                blocked: info.get("Blocked").map(|v| v == "yes").unwrap_or(false),
                                connected: info.get("Connected").map(|v| v == "yes").unwrap_or(false),
                                rssi: info.get("RSSI").and_then(|v| v.parse::<i32>().ok()),
                                battery: info.get("BatteryPercentage").and_then(|v| v.trim_end_matches('%').parse::<u8>().ok()),
                                address_type: info.get("AddressType").cloned().unwrap_or_default(),
                                alias: info.get("Alias").cloned().unwrap_or_else(|| "Unknown Device".to_string()),
                            };
                            devices.insert(mac.clone(), new_device);
                        }
                    }
                }
                BluetoothEvent::DeviceConnected { mac } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.connected = true;
                    }
                }
                BluetoothEvent::DeviceDisconnected { mac } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.connected = false;
                    }
                }
                BluetoothEvent::RSSIUpdated { mac, rssi } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.rssi = Some(*rssi);
                    }
                }
                BluetoothEvent::BatteryUpdated { mac, battery } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.battery = Some(*battery);
                    }
                }
                BluetoothEvent::DevicePaired { mac } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.paired = true;
                    }
                }
                BluetoothEvent::DeviceUnpaired { mac } => {
                    let mut devices = state.devices.write().await;
                    if let Some(device) = devices.get_mut(mac) {
                        device.paired = false;
                    }
                }
                BluetoothEvent::ControllerPoweredChanged { mac: _, powered } => {
                    let mut controller = state.controller.write().await;
                    if let Some(ctrl) = controller.as_mut() {
                        ctrl.powered = *powered;
                    }
                }
                BluetoothEvent::ControllerDiscoverableChanged { mac: _, discoverable } => {
                    let mut controller = state.controller.write().await;
                    if let Some(ctrl) = controller.as_mut() {
                        ctrl.discoverable = *discoverable;
                    }
                }
            }

            let _ = app_handle.emit("bluetooth-event", &event);
        }
    }

    Ok(())
}

async fn refresh_controller_periodically(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));

    loop {
        interval.tick().await;

        if let Ok(controllers) = list_controllers().await {
            let state = app_handle.state::<AppState>();
            let mut ctrl = state.controller.write().await;

            if let Some(new_controller) = controllers.into_iter().next() {
                if ctrl.is_none() || ctrl.as_ref().map(|c| c.mac != new_controller.mac).unwrap_or(true) {
                    *ctrl = Some(new_controller);
                }
            }
        }
    }
}

fn parse_monitor_line(line: &str) -> Option<BluetoothEvent> {
    if let Some(caps) = MONITOR_DEVICE_FOUND.captures(line) {
        let mac = caps[1].to_string();
        let name = caps[2].trim().to_string();
        return Some(BluetoothEvent::DeviceFound {
            mac,
            name,
            rssi: None,
        });
    }

    if let Some(caps) = MONITOR_DEVICE_CONNECTED.captures(line) {
        let mac = caps[1].to_string();
        return Some(BluetoothEvent::DeviceConnected { mac });
    }

    if let Some(caps) = MONITOR_DEVICE_DISCONNECTED.captures(line) {
        let mac = caps[1].to_string();
        return Some(BluetoothEvent::DeviceDisconnected { mac });
    }

    if let Some(caps) = MONITOR_RSSI.captures(line) {
        let mac = caps[1].to_string();
        let rssi = caps[2].parse::<i32>().ok()?;
        return Some(BluetoothEvent::RSSIUpdated { mac, rssi });
    }

    if let Some(caps) = MONITOR_BATTERY.captures(line) {
        let mac = caps[1].to_string();
        let battery = caps[2].parse::<u8>().ok()?;
        return Some(BluetoothEvent::BatteryUpdated { mac, battery });
    }

    if let Some(caps) = MONITOR_PAIRED.captures(line) {
        let mac = caps[1].to_string();
        return Some(BluetoothEvent::DevicePaired { mac });
    }

    if let Some(caps) = MONITOR_UNPAIRED.captures(line) {
        let mac = caps[1].to_string();
        return Some(BluetoothEvent::DeviceUnpaired { mac });
    }

    if let Some(caps) = MONITOR_CONTROLLER_POWERED.captures(line) {
        let mac = caps[1].to_string();
        let powered = &caps[2] == "yes";
        return Some(BluetoothEvent::ControllerPoweredChanged { mac, powered });
    }

    if let Some(caps) = MONITOR_CONTROLLER_DISCOVERABLE.captures(line) {
        let mac = caps[1].to_string();
        let discoverable = &caps[2] == "yes";
        return Some(BluetoothEvent::ControllerDiscoverableChanged { mac, discoverable });
    }

    None
}

async fn run_bluetoothctl(args: &[&str]) -> Result<String, String> {
    let output = Command::new("bluetoothctl")
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Failed to execute bluetoothctl: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() || stdout.contains("Device") || stdout.contains("Controller") {
        Ok(stdout)
    } else {
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

#[tauri::command]
async fn get_controllers() -> Result<Vec<BluetoothController>, String> {
    list_controllers().await
}

async fn list_controllers() -> Result<Vec<BluetoothController>, String> {
    let output = run_bluetoothctl(&["list"]).await?;
    let show_output = run_bluetoothctl(&["show"]).await.unwrap_or_default();
    
    let mut controllers = Vec::new();
    
    for line in output.lines() {
        if let Some(caps) = CONTROLLER_REGEX.captures(line) {
            let mac = caps[1].to_string();
            let name = caps[2].trim().to_string();
            
            let (powered, discoverable, pairable, discovering) = parse_controller_info(&show_output);
            
            controllers.push(BluetoothController {
                mac,
                name,
                powered,
                discoverable,
                pairable,
                discovering,
            });
        }
    }
    
    Ok(controllers)
}

fn parse_controller_info(output: &str) -> (bool, bool, bool, bool) {
    let mut powered = false;
    let mut discoverable = false;
    let mut pairable = false;
    let mut discovering = false;
    
    for line in output.lines() {
        let line = line.trim();
        if line.starts_with("Powered:") {
            powered = line.contains("yes");
        } else if line.starts_with("Discoverable:") {
            discoverable = line.contains("yes");
        } else if line.starts_with("Pairable:") {
            pairable = line.contains("yes");
        } else if line.starts_with("Discovering:") {
            discovering = line.contains("yes");
        }
    }
    
    (powered, discoverable, pairable, discovering)
}

#[tauri::command]
async fn get_devices(state: State<'_, AppState>) -> Result<Vec<BluetoothDevice>, String> {
    let output = run_bluetoothctl(&["devices"]).await?;
    let mut devices = Vec::new();
    let cache_ttl = Duration::from_secs(300);
    let mut cache = state.device_cache.write().await;

    for line in output.lines() {
        if let Some(caps) = DEVICE_REGEX.captures(line) {
            let mac = caps[1].to_string();
            let name = caps[2].trim().to_string();

            if let Some(cached) = cache.get(&mac) {
                if !cached.is_expired(cache_ttl) {
                    devices.push(cached.device.clone());
                    continue;
                }
            }

            let info = get_device_info_internal(&mac).await.unwrap_or_default();

            let device = BluetoothDevice {
                mac: mac.clone(),
                name: name.clone(),
                icon: info.get("Icon").cloned().unwrap_or_else(|| "bluetooth".to_string()),
                paired: info.get("Paired").map(|v| v == "yes").unwrap_or(false),
                trusted: info.get("Trusted").map(|v| v == "yes").unwrap_or(false),
                blocked: info.get("Blocked").map(|v| v == "yes").unwrap_or(false),
                connected: info.get("Connected").map(|v| v == "yes").unwrap_or(false),
                rssi: info.get("RSSI").and_then(|v| v.parse::<i32>().ok()),
                battery: info.get("BatteryPercentage").and_then(|v| {
                    v.trim_end_matches('%').parse::<u8>().ok()
                }),
                address_type: info.get("AddressType").cloned().unwrap_or_default(),
                alias: info.get("Alias").cloned().unwrap_or(name),
            };

            cache.insert(mac.clone(), CachedDevice::new(device.clone()));
            devices.push(device);
        }
    }

    Ok(devices)
}

async fn get_device_info_internal(mac: &str) -> Result<HashMap<String, String>, String> {
    let output = run_bluetoothctl(&["info", mac]).await?;
    let mut info = HashMap::new();
    
    for line in output.lines() {
        let line = line.trim();
        if line.starts_with("Device ") {
            continue;
        }
        if let Some(pos) = line.find(':') {
            let key = line[..pos].trim().to_string();
            let value = line[pos + 1..].trim().to_string();
            info.insert(key, value);
        }
    }
    
    Ok(info)
}

#[tauri::command]
async fn get_device_info(mac: String) -> Result<HashMap<String, String>, String> {
    get_device_info_internal(&mac).await
}

#[tauri::command]
async fn start_scan(state: State<'_, AppState>) -> Result<(), String> {
    let mut scanning = state.scanning.write().await;
    
    // If already scanning, don't start again
    if *scanning {
        return Ok(());
    }
    
    *scanning = true;
    
    // Start the scan process and store the handle
    let child = Command::new("bluetoothctl")
        .args(&["scan", "on"])
        .spawn()
        .map_err(|e| format!("Failed to start scan: {}", e))?;
    
    let mut scan_process = state.scan_process.lock().await;
    *scan_process = Some(child);
    
    Ok(())
}

#[tauri::command]
async fn stop_scan(state: State<'_, AppState>) -> Result<(), String> {
    let mut scanning = state.scanning.write().await;
    
    // If not scanning, nothing to do
    if !*scanning {
        return Ok(());
    }
    
    *scanning = false;
    
    // Kill the scan process if it exists
    let mut scan_process = state.scan_process.lock().await;
    if let Some(mut child) = scan_process.take() {
        let _ = child.kill().await;
    }
    
    // Also run scan off to be safe
    let _ = run_bluetoothctl(&["scan", "off"]).await;
    
    Ok(())
}

#[tauri::command]
async fn connect_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["connect", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn disconnect_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["disconnect", &mac]).await?;
    Ok(())
}

// Audio profile UUIDs
const A2DP_UUID: &str = "0000110d-0000-1000-8000-00805f9b34fb";  // Audio Sink (A2DP)
const HSP_UUID: &str = "00001108-0000-1000-8000-00805f9b34fb";    // Headset (HSP)
const HFP_UUID: &str = "0000111e-0000-1000-8000-00805f9b34fb";    // Handsfree (HFP)

#[tauri::command]
async fn connect_profile(mac: String, profile: String) -> Result<(), String> {
    let uuid = match profile.as_str() {
        "a2dp" => A2DP_UUID,
        "hsp" => HSP_UUID,
        "hfp" => HFP_UUID,
        _ => return Err(format!("Unknown profile: {}", profile)),
    };
    run_bluetoothctl(&["connect", &mac, uuid]).await?;
    Ok(())
}

#[tauri::command]
async fn disconnect_profile(mac: String, profile: String) -> Result<(), String> {
    let uuid = match profile.as_str() {
        "a2dp" => A2DP_UUID,
        "hsp" => HSP_UUID,
        "hfp" => HFP_UUID,
        _ => return Err(format!("Unknown profile: {}", profile)),
    };
    run_bluetoothctl(&["disconnect", &mac, uuid]).await?;
    Ok(())
}

#[tauri::command]
async fn pair_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["pair", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn remove_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["remove", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn block_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["block", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn unblock_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["unblock", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn set_device_alias(mac: String, alias: String) -> Result<(), String> {
    run_bluetoothctl(&["set-alias", &mac, &alias]).await?;
    Ok(())
}

#[tauri::command]
async fn trust_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["trust", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn untrust_device(mac: String) -> Result<(), String> {
    run_bluetoothctl(&["untrust", &mac]).await?;
    Ok(())
}

#[tauri::command]
async fn set_controller_power(powered: bool) -> Result<(), String> {
    let arg = if powered { "on" } else { "off" };
    run_bluetoothctl(&["power", arg]).await?;
    Ok(())
}

#[tauri::command]
async fn set_controller_discoverable(discoverable: bool) -> Result<(), String> {
    let arg = if discoverable { "on" } else { "off" };
    run_bluetoothctl(&["discoverable", arg]).await?;
    Ok(())
}

#[tauri::command]
async fn send_file_to_device(mac: String, file_path: String) -> Result<(), String> {
    // Launch bluetooth-sendto independently. It provides its own GUI for progress on Linux.
    let _ = Command::new("bluetooth-sendto")
        .args(&["--device", &mac, &file_path])
        .spawn()
        .map_err(|e| format!("Failed to launch bluetooth-sendto: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn run_automation_command(command: String, event_payload: Value) -> Result<(), String> {
    let payload = event_payload.to_string();
    let output = Command::new("sh")
        .args(&["-c", &command])
        .env("BLUEST_TEETH_EVENT", payload)
        .output()
        .await
        .map_err(|e| format!("Failed to run automation command: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

#[tauri::command]
async fn send_automation_webhook(
    url: String,
    event_name: String,
    event_payload: Value,
) -> Result<(), String> {
    let body = serde_json::json!({
        "source": "bluest-teeth",
        "event": event_name,
        "payload": event_payload,
    });

    let response = reqwest::Client::new()
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to send webhook: {}", e))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Webhook returned HTTP {}", response.status()))
    }
}
