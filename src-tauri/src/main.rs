// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn check_tauri_window() -> bool {
    true
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![check_tauri_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
