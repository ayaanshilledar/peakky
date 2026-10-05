use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use image::{ImageFormat, RgbaImage};
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, Position, WindowEvent};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ClipboardPayload {
  pub id: String,
  #[serde(rename = "type")]
  pub item_type: String,
  pub content: String,
  pub preview: String,
  #[serde(rename = "charCount", skip_serializing_if = "Option::is_none")]
  pub char_count: Option<usize>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub width: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub height: Option<u32>,
  pub timestamp: u64,
}

#[tauri::command]
fn copy_to_clipboard(content: String, item_type: String) -> Result<(), String> {
  let mut clipboard = arboard::Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
  if item_type == "text" {
    clipboard
      .set_text(content)
      .map_err(|e| format!("Failed to set text: {}", e))?;
  } else if item_type == "image" {
    let b64 = if let Some(stripped) = content.strip_prefix("data:image/png;base64,") {
      stripped
    } else if let Some(pos) = content.find(",") {
      &content[pos + 1..]
    } else {
      &content
    };
    let bytes = BASE64
      .decode(b64)
      .map_err(|e| format!("Base64 decode error: {}", e))?;
    let img =
      image::load_from_memory(&bytes).map_err(|e| format!("Image decode error: {}", e))?;
    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();
    let img_data = arboard::ImageData {
      width: w as usize,
      height: h as usize,
      bytes: std::borrow::Cow::Owned(rgba.into_raw()),
    };
    clipboard
      .set_image(img_data)
      .map_err(|e| format!("Failed to set image: {}", e))?;
  }
  Ok(())
}

#[tauri::command]
fn clear_system_clipboard() -> Result<(), String> {
  let mut clipboard = arboard::Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
  let _ = clipboard.clear();
  Ok(())
}

#[tauri::command]
fn open_settings(app: AppHandle) -> Result<(), String> {
  if let Some(settings_win) = app.get_webview_window("settings") {
    let _ = settings_win.show();
    let _ = settings_win.unminimize();
    let _ = settings_win.set_focus();
  }
  if let Some(notch_win) = app.get_webview_window("notch") {
    let _ = notch_win.hide();
  }
  Ok(())
}

#[tauri::command]
fn close_settings(app: AppHandle) -> Result<(), String> {
  if let Some(settings_win) = app.get_webview_window("settings") {
    let _ = settings_win.hide();
  }
  if let Some(notch_win) = app.get_webview_window("notch") {
    let _ = notch_win.show();
  }
  Ok(())
}

#[tauri::command]
fn get_notch_x(app: AppHandle) -> Result<i32, String> {
  if let Some(notch_win) = app.get_webview_window("notch") {
    if let Ok(pos) = notch_win.outer_position() {
      return Ok(pos.x);
    }
  }
  Ok(0)
}

#[tauri::command]
fn set_notch_x(app: AppHandle, x: i32) -> Result<(), String> {
  if let Some(notch_win) = app.get_webview_window("notch") {
    if let Ok(Some(monitor)) = notch_win.primary_monitor() {
      let monitor_width = monitor.size().width as i32;
      let win_width = notch_win.outer_size().unwrap_or(tauri::PhysicalSize::new(480, 260)).width as i32;
      let clamped_x = x.max(0).min(monitor_width - win_width);
      let _ = notch_win.set_position(Position::Physical(PhysicalPosition::new(clamped_x, 0)));
    }
  }
  Ok(())
}

#[tauri::command]
fn set_notch_position(app: AppHandle, position: String) -> Result<(), String> {
  if let Some(notch_win) = app.get_webview_window("notch") {
    if let Ok(Some(monitor)) = notch_win.primary_monitor() {
      let monitor_size = monitor.size();
      let win_size = notch_win.outer_size().unwrap_or(tauri::PhysicalSize::new(480, 260));
      let x = match position.as_str() {
        "left" => 24,
        "right" => monitor_size.width as i32 - win_size.width as i32 - 24,
        _ => (monitor_size.width as i32 - win_size.width as i32) / 2,
      };
      let y = 0;
      let _ = notch_win.set_position(Position::Physical(PhysicalPosition::new(x, y)));
    }
  }
  Ok(())
}

#[tauri::command]
fn fetch_calendar_feed(url: String) -> Result<String, String> {
  let target_url = if url.starts_with("webcal://") {
    format!("https://{}", &url[9..])
  } else {
    url
  };

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    let output = std::process::Command::new("curl.exe")
      .args(["-s", "-L", "-A", "Peaky-Calendar-Sync/1.0", &target_url])
      .creation_flags(0x08000000) // CREATE_NO_WINDOW
      .output()
      .map_err(|e| format!("Failed to execute curl: {}", e))?;

    if output.status.success() {
      let body = String::from_utf8_lossy(&output.stdout).to_string();
      if body.is_empty() {
        return Err("Empty response from calendar feed".to_string());
      }
      return Ok(body);
    } else {
      let err = String::from_utf8_lossy(&output.stderr).to_string();
      return Err(format!("Fetch error: {}", err));
    }
  }

  #[cfg(not(target_os = "windows"))]
  {
    let output = std::process::Command::new("curl")
      .args(["-s", "-L", "-A", "Peaky-Calendar-Sync/1.0", &target_url])
      .output()
      .map_err(|e| format!("Failed to execute curl: {}", e))?;

    if output.status.success() {
      return Ok(String::from_utf8_lossy(&output.stdout).to_string());
    } else {
      return Err("Failed to fetch feed".to_string());
    }
  }
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    let _ = std::process::Command::new("cmd")
      .args(["/c", "start", "", &url])
      .creation_flags(0x08000000) // CREATE_NO_WINDOW
      .spawn();
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = std::process::Command::new("open").arg(&url).spawn();
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      open_settings,
      close_settings,
      get_notch_x,
      set_notch_x,
      set_notch_position,
      fetch_calendar_feed,
      open_external_url,
      copy_to_clipboard,
      clear_system_clipboard
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Position notch window at top-center of primary monitor
      if let Some(notch_win) = app.get_webview_window("notch") {
        if let Ok(Some(monitor)) = notch_win.primary_monitor() {
          let monitor_size = monitor.size();
          let win_size = notch_win.outer_size().unwrap_or(tauri::PhysicalSize::new(420, 220));
          let x = (monitor_size.width as i32 - win_size.width as i32) / 2;
          let y = 0;
          let _ = notch_win.set_position(Position::Physical(PhysicalPosition::new(x, y)));
        }

        // Lock window Y position strictly to top edge (y = 0)
        let win_clone = notch_win.clone();
        notch_win.on_window_event(move |event| {
          if let WindowEvent::Moved(pos) = event {
            if pos.y != 0 {
              let _ = win_clone.set_position(Position::Physical(PhysicalPosition::new(pos.x, 0)));
            }
          }
        });
      }

      // Intercept settings window close request to hide settings and restore notch
      if let Some(settings_win) = app.get_webview_window("settings") {
        let win_clone = settings_win.clone();
        let app_handle = app.handle().clone();
        settings_win.on_window_event(move |event| {
          if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = win_clone.hide();
            if let Some(notch_win) = app_handle.get_webview_window("notch") {
              let _ = notch_win.show();
            }
          }
        });
      }

      // Background thread to monitor system clipboard for text & screenshots
      let monitor_handle = app.handle().clone();
      std::thread::spawn(move || {
        let mut last_text: Option<String> = None;
        let mut last_img_hash: Option<u64> = None;

        loop {
          std::thread::sleep(std::time::Duration::from_millis(400));

          if let Ok(mut clipboard) = arboard::Clipboard::new() {
            let now_ms = SystemTime::now()
              .duration_since(UNIX_EPOCH)
              .unwrap_or_default()
              .as_millis() as u64;

            // 1. Check for Screenshot / Image in clipboard
            if let Ok(img) = clipboard.get_image() {
              let len = img.bytes.len();
              if len > 0 {
                let mut hasher = std::collections::hash_map::DefaultHasher::new();
                img.width.hash(&mut hasher);
                img.height.hash(&mut hasher);
                len.hash(&mut hasher);
                if len >= 32 {
                  img.bytes[0..16].hash(&mut hasher);
                  img.bytes[len / 2..len / 2 + 16].hash(&mut hasher);
                  img.bytes[len - 16..].hash(&mut hasher);
                }
                let hash = hasher.finish();

                if last_img_hash != Some(hash) {
                  last_img_hash = Some(hash);

                  if let Some(rgba) = RgbaImage::from_raw(
                    img.width as u32,
                    img.height as u32,
                    img.bytes.to_vec(),
                  ) {
                    let mut png_bytes: Vec<u8> = Vec::new();
                    let mut cursor = Cursor::new(&mut png_bytes);
                    if rgba.write_to(&mut cursor, ImageFormat::Png).is_ok() {
                      let b64_str = BASE64.encode(&png_bytes);
                      let data_url = format!("data:image/png;base64,{}", b64_str);

                      let payload = ClipboardPayload {
                        id: format!("clip_img_{}", now_ms),
                        item_type: "image".to_string(),
                        content: data_url,
                        preview: format!("Screenshot ({}×{})", img.width, img.height),
                        char_count: None,
                        width: Some(img.width as u32),
                        height: Some(img.height as u32),
                        timestamp: now_ms,
                      };

                      let _ = monitor_handle.emit("clipboard-new-item", &payload);
                    }
                  }
                }
              }
            } else if let Ok(text) = clipboard.get_text() {
              // 2. Check for copied text
              let trimmed = text.trim();
              if !trimmed.is_empty() {
                if last_text.as_deref() != Some(trimmed) {
                  last_text = Some(trimmed.to_string());

                  let char_count = trimmed.chars().count();
                  let preview = if char_count > 100 {
                    format!("{}...", &trimmed.chars().take(100).collect::<String>())
                  } else {
                    trimmed.to_string()
                  };

                  let payload = ClipboardPayload {
                    id: format!("clip_txt_{}", now_ms),
                    item_type: "text".to_string(),
                    content: trimmed.to_string(),
                    preview,
                    char_count: Some(char_count),
                    width: None,
                    height: None,
                    timestamp: now_ms,
                  };

                  let _ = monitor_handle.emit("clipboard-new-item", &payload);
                }
              }
            }
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

