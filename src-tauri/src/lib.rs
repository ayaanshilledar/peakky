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
      let win_width = notch_win.outer_size().unwrap_or(tauri::PhysicalSize::new(500, 400)).width as i32;
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
      let win_size = notch_win.outer_size().unwrap_or(tauri::PhysicalSize::new(500, 400));
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

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct MediaPayload {
  pub is_playing: bool,
  pub title: String,
  pub artist: String,
  pub album: String,
  pub thumbnail: Option<String>,
  pub source_app: String,
  pub position_ms: u64,
  pub duration_ms: u64,
}

#[cfg(target_os = "windows")]
mod media_manager {
  use super::*;
  use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
  };
  use windows::Storage::Streams::{Buffer, DataReader, InputStreamOptions};

  pub fn get_state() -> Option<MediaPayload> {
    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync().ok()?.get().ok()?;
    let session = manager.GetCurrentSession().ok()?;

    let source_app = session.SourceAppUserModelId().unwrap_or_default().to_string();
    let playback_info = session.GetPlaybackInfo().ok()?;
    let status = playback_info.PlaybackStatus().ok()?;
    let is_playing = status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;

    let media_props = session.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let title = media_props.Title().unwrap_or_default().to_string();
    let artist = media_props.Artist().unwrap_or_default().to_string();
    let album = media_props.AlbumTitle().unwrap_or_default().to_string();

    let mut thumbnail_b64: Option<String> = None;
    if let Ok(thumb_ref) = media_props.Thumbnail() {
      if let Ok(stream_op) = thumb_ref.OpenReadAsync() {
        if let Ok(stream) = stream_op.get() {
          let size = stream.Size().unwrap_or(0);
          if size > 0 && size < 8_000_000 {
            if let Ok(buf) = Buffer::Create(size as u32) {
              if let Ok(read_op) = stream.ReadAsync(&buf, size as u32, InputStreamOptions::None) {
                if let Ok(read_buf) = read_op.get() {
                  if let Ok(reader) = DataReader::FromBuffer(&read_buf) {
                    let mut bytes = vec![0u8; size as usize];
                    if reader.ReadBytes(&mut bytes).is_ok() {
                      let mime = if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
                        "image/png"
                      } else if bytes.starts_with(b"RIFF") {
                        "image/webp"
                      } else {
                        "image/jpeg"
                      };
                      thumbnail_b64 = Some(format!("data:{};base64,{}", mime, BASE64.encode(&bytes)));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    let timeline = session.GetTimelineProperties().ok();
    let position_ms = timeline.as_ref().map(|t| (t.Position().unwrap_or_default().Duration.max(0) / 10_000) as u64).unwrap_or(0);
    let duration_ms = timeline.as_ref().map(|t| {
      let end = t.EndTime().unwrap_or_default().Duration;
      let start = t.StartTime().unwrap_or_default().Duration;
      ((end - start).max(0) / 10_000) as u64
    }).unwrap_or(0);

    Some(MediaPayload {
      is_playing,
      title,
      artist,
      album,
      thumbnail: thumbnail_b64,
      source_app,
      position_ms,
      duration_ms,
    })
  }

  pub fn toggle_play_pause() -> Result<(), String> {
    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
      if let Ok(manager) = manager_op.get() {
        if let Ok(session) = manager.GetCurrentSession() {
          if let Ok(op) = session.TryTogglePlayPauseAsync() {
            let _ = op.get();
          }
        }
      }
    }
    Ok(())
  }

  pub fn skip_next() -> Result<(), String> {
    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
      if let Ok(manager) = manager_op.get() {
        if let Ok(session) = manager.GetCurrentSession() {
          if let Ok(op) = session.TrySkipNextAsync() {
            let _ = op.get();
          }
        }
      }
    }
    Ok(())
  }

  pub fn skip_previous() -> Result<(), String> {
    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
      if let Ok(manager) = manager_op.get() {
        if let Ok(session) = manager.GetCurrentSession() {
          if let Ok(op) = session.TrySkipPreviousAsync() {
            let _ = op.get();
          }
        }
      }
    }
    Ok(())
  }

  pub fn seek(position_ms: u64) -> Result<(), String> {
    if let Ok(manager_op) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
      if let Ok(manager) = manager_op.get() {
        if let Ok(session) = manager.GetCurrentSession() {
          let pos_100ns = (position_ms * 10_000) as i64;
          if let Ok(op) = session.TryChangePlaybackPositionAsync(pos_100ns) {
            let _ = op.get();
          }
        }
      }
    }
    Ok(())
  }
}

#[cfg(not(target_os = "windows"))]
mod media_manager {
  use super::*;
  pub fn get_state() -> Option<MediaPayload> { None }
  pub fn toggle_play_pause() -> Result<(), String> { Ok(()) }
  pub fn skip_next() -> Result<(), String> { Ok(()) }
  pub fn skip_previous() -> Result<(), String> { Ok(()) }
  pub fn seek(_position_ms: u64) -> Result<(), String> { Ok(()) }
}

#[tauri::command]
fn get_media_state() -> Result<Option<MediaPayload>, String> {
  Ok(media_manager::get_state())
}

#[tauri::command]
fn media_toggle_play_pause() -> Result<(), String> {
  media_manager::toggle_play_pause()
}

#[tauri::command]
fn media_next() -> Result<(), String> {
  media_manager::skip_next()
}

#[tauri::command]
fn media_previous() -> Result<(), String> {
  media_manager::skip_previous()
}

#[tauri::command]
fn media_seek(position_ms: u64) -> Result<(), String> {
  media_manager::seek(position_ms)
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct VolumePayload {
  pub volume: u32,
  pub is_muted: bool,
}

#[cfg(target_os = "windows")]
mod volume_manager {
  use super::*;
  use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
  use windows::Win32::Media::Audio::{IMMDeviceEnumerator, MMDeviceEnumerator, eMultimedia, eRender};
  use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};

  pub fn get_master_volume() -> Option<VolumePayload> {
    unsafe {
      let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
      let enumerator: IMMDeviceEnumerator = CoCreateInstance(
        &MMDeviceEnumerator,
        None,
        CLSCTX_ALL,
      ).ok()?;

      let device = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia).ok()?;
      let volume_endpoint: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None).ok()?;

      let scalar = volume_endpoint.GetMasterVolumeLevelScalar().ok()?;
      let is_muted = volume_endpoint.GetMute().ok()?.as_bool();

      let vol_percent = (scalar * 100.0).round() as u32;

      Some(VolumePayload {
        volume: vol_percent,
        is_muted,
      })
    }
  }
}

#[cfg(not(target_os = "windows"))]
mod volume_manager {
  use super::*;
  pub fn get_master_volume() -> Option<VolumePayload> {
    None
  }
}

#[tauri::command]
fn get_system_volume() -> Result<Option<VolumePayload>, String> {
  Ok(volume_manager::get_master_volume())
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct ProcessItem {
  pub pid: u32,
  pub name: String,
  pub cpu_usage: f32,
  pub memory_mb: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct SystemMetricsPayload {
  pub cpu_usage: f32,
  pub cpu_avg: f32,
  pub cpu_peak: f32,
  pub memory_used_gb: f32,
  pub memory_total_gb: f32,
  pub memory_used_percent: f32,
  pub gpu_usage: f32,
  pub disk_rate: String,
  pub net_download_rate: String,
  pub net_upload_rate: String,
  pub top_processes: Vec<ProcessItem>,
}

mod metrics_manager {
  use super::*;
  use std::sync::{Arc, Mutex};
  use sysinfo::{Networks, ProcessesToUpdate, System};

  pub struct SystemMonitor {
    sys: System,
    networks: Networks,
    cpu_history: Vec<f32>,
  }

  impl SystemMonitor {
    pub fn new() -> Self {
      let mut sys = System::new_all();
      sys.refresh_all();
      let networks = Networks::new_with_refreshed_list();
      Self {
        sys,
        networks,
        cpu_history: Vec::new(),
      }
    }

    pub fn update_and_get(&mut self) -> SystemMetricsPayload {
      self.sys.refresh_cpu_all();
      self.sys.refresh_memory();
      self.sys.refresh_processes(ProcessesToUpdate::All);
      self.networks.refresh();

      let global_cpu = self.sys.global_cpu_usage();
      self.cpu_history.push(global_cpu);
      if self.cpu_history.len() > 30 {
        self.cpu_history.remove(0);
      }

      let sum: f32 = self.cpu_history.iter().sum();
      let cpu_avg = if !self.cpu_history.is_empty() {
        sum / self.cpu_history.len() as f32
      } else {
        global_cpu
      };
      let cpu_peak = self
        .cpu_history
        .iter()
        .cloned()
        .fold(0.0f32, f32::max);

      let total_mem_bytes = self.sys.total_memory();
      let used_mem_bytes = self.sys.used_memory();
      let total_gb = (total_mem_bytes as f64 / 1_073_741_824.0) as f32;
      let used_gb = (used_mem_bytes as f64 / 1_073_741_824.0) as f32;
      let mem_percent = if total_mem_bytes > 0 {
        (used_mem_bytes as f32 / total_mem_bytes as f32) * 100.0
      } else {
        0.0
      };

      let mut total_rx: u64 = 0;
      let mut total_tx: u64 = 0;
      for (_interface_name, network) in &self.networks {
        total_rx += network.received();
        total_tx += network.transmitted();
      }

      fn format_rate(bytes: u64) -> String {
        if bytes > 1048576 {
          format!("{:.1} MB/s", bytes as f64 / 1048576.0)
        } else if bytes > 1024 {
          format!("{} KB/s", bytes / 1024)
        } else {
          format!("{} B/s", bytes)
        }
      }

      let mut processes: Vec<ProcessItem> = self
        .sys
        .processes()
        .values()
        .map(|p| ProcessItem {
          pid: p.pid().as_u32(),
          name: p.name().to_string_lossy().to_string(),
          cpu_usage: (p.cpu_usage() * 10.0).round() / 10.0,
          memory_mb: ((p.memory() as f64 / 1_048_576.0) * 10.0).round() / 10.0,
        })
        .collect();

      processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
      processes.truncate(5);

      SystemMetricsPayload {
        cpu_usage: (global_cpu * 10.0).round() / 10.0,
        cpu_avg: (cpu_avg * 10.0).round() / 10.0,
        cpu_peak: (cpu_peak * 10.0).round() / 10.0,
        memory_used_gb: (used_gb * 10.0).round() / 10.0,
        memory_total_gb: (total_gb * 10.0).round() / 10.0,
        memory_used_percent: (mem_percent * 10.0).round() / 10.0,
        gpu_usage: 3.0,
        disk_rate: "230 KB/s".to_string(),
        net_download_rate: format_rate(total_rx),
        net_upload_rate: format_rate(total_tx),
        top_processes: processes,
      }
    }
  }

  pub type SharedMonitor = Arc<Mutex<SystemMonitor>>;
}

#[tauri::command]
fn get_system_metrics(
  state: tauri::State<'_, metrics_manager::SharedMonitor>,
) -> Result<SystemMetricsPayload, String> {
  if let Ok(mut monitor) = state.lock() {
    Ok(monitor.update_and_get())
  } else {
    Ok(SystemMetricsPayload::default())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let monitor_state: metrics_manager::SharedMonitor = std::sync::Arc::new(std::sync::Mutex::new(metrics_manager::SystemMonitor::new()));

  tauri::Builder::default()
    .manage(monitor_state.clone())
    .invoke_handler(tauri::generate_handler![
      open_settings,
      close_settings,
      get_notch_x,
      set_notch_x,
      set_notch_position,
      fetch_calendar_feed,
      open_external_url,
      copy_to_clipboard,
      clear_system_clipboard,
      get_media_state,
      media_toggle_play_pause,
      media_next,
      media_previous,
      media_seek,
      get_system_volume,
      get_system_metrics
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

      // Background thread to monitor system media playback (Spotify, YouTube in browser, etc.)
      let media_monitor_handle = app.handle().clone();
      std::thread::spawn(move || {
        let mut last_title = String::new();
        let mut last_is_playing = false;
        let mut last_pos: u64 = 0;

        loop {
          std::thread::sleep(std::time::Duration::from_millis(600));

          if let Some(media) = media_manager::get_state() {
            let pos_diff = if media.position_ms > last_pos {
              media.position_ms - last_pos
            } else {
              last_pos - media.position_ms
            };

            if media.title != last_title
              || media.is_playing != last_is_playing
              || (media.is_playing && pos_diff >= 2000)
            {
              last_title = media.title.clone();
              last_is_playing = media.is_playing;
              last_pos = media.position_ms;
              let _ = media_monitor_handle.emit("media-state-changed", &media);
            }
          }
        }
      });

      // Background thread to monitor system master volume changes
      let vol_monitor_handle = app.handle().clone();
      std::thread::spawn(move || {
        let mut last_vol: Option<u32> = None;
        let mut last_muted: Option<bool> = None;

        loop {
          std::thread::sleep(std::time::Duration::from_millis(250));

          if let Some(vol_data) = volume_manager::get_master_volume() {
            if last_vol != Some(vol_data.volume) || last_muted != Some(vol_data.is_muted) {
              last_vol = Some(vol_data.volume);
              last_muted = Some(vol_data.is_muted);
              let _ = vol_monitor_handle.emit("system-volume-changed", &vol_data);
            }
          }
        }
      });

      // Background thread to stream real-time system metrics (CPU, Memory, Network, Processes)
      let metrics_handle = app.handle().clone();
      let monitor_clone = app.state::<metrics_manager::SharedMonitor>().inner().clone();
      std::thread::spawn(move || {
        loop {
          std::thread::sleep(std::time::Duration::from_millis(1000));

          if let Ok(mut monitor) = monitor_clone.lock() {
            let metrics = monitor.update_and_get();
            let _ = metrics_handle.emit("system-metrics-update", &metrics);
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

