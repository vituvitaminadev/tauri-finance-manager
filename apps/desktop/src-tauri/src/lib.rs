use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Polls `check` up to `max_attempts` times, sleeping `delay_ms` between each.
/// Returns Ok(()) as soon as `check` returns true, or Err if attempts are exhausted.
fn poll_until_healthy<F>(mut check: F, max_attempts: u32, delay_ms: u64) -> Result<(), String>
where
  F: FnMut() -> bool,
{
  for _ in 0..max_attempts {
    if check() {
      return Ok(());
    }
    std::thread::sleep(std::time::Duration::from_millis(delay_ms));
  }
  Err("Server did not start in time".to_string())
}

#[tauri::command]
async fn wait_for_server() -> Result<(), String> {
  tauri::async_runtime::spawn_blocking(|| {
    poll_until_healthy(
      || {
        reqwest::blocking::get("http://localhost:3001/health")
          .map(|r| r.status().is_success())
          .unwrap_or(false)
      },
      60,  // 60 attempts
      500, // 500ms each = 30s total
    )
  })
  .await
  .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![wait_for_server])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let sidecar_command = app.shell().sidecar("server")?;
      let (_rx, _child) = sidecar_command.spawn()?;
      app.manage(_child);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn returns_ok_when_check_succeeds_immediately() {
    let result = poll_until_healthy(|| true, 3, 0);
    assert!(result.is_ok());
  }

  #[test]
  fn returns_err_when_check_always_fails() {
    let result = poll_until_healthy(|| false, 3, 0);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Server did not start in time");
  }

  #[test]
  fn returns_ok_when_check_succeeds_on_second_attempt() {
    let mut attempts = 0u32;
    let result = poll_until_healthy(
      || {
        attempts += 1;
        attempts >= 2
      },
      5,
      0,
    );
    assert!(result.is_ok());
    assert_eq!(attempts, 2);
  }

  #[test]
  fn exhausts_exactly_max_attempts_before_failing() {
    let mut count = 0u32;
    let _ = poll_until_healthy(
      || {
        count += 1;
        false
      },
      5,
      0,
    );
    assert_eq!(count, 5);
  }
}
