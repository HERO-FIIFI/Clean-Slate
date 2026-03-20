// Prevents an extra console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Spawn the FastAPI backend sidecar on startup
            let sidecar = app.shell().sidecar("backend").expect("backend sidecar not found");
            let (_rx, _child) = sidecar
                .spawn()
                .expect("Failed to start backend sidecar");

            // Open devtools in debug builds
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Clean Slate");
}
