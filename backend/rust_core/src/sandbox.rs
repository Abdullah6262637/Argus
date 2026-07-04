// ─────────────────────────────────────────────────────────────
// Sandbox modülü — Komut allowlist doğrulama (zero-allocation)
// ─────────────────────────────────────────────────────────────
// Python'daki sandbox.py check_sandbox fonksiyonunun Rust karşılığı.
// Kritik güvenlik kodu olduğu için zero-allocation ve
// constant-time string karşılaştırma kullanır.

use pyo3::prelude::*;

/// Injection karakterlerini kontrol eder.
/// Komut stringinde ;, &&, ||, |, `, >, <, $( gibi
/// shell injection vektörleri varsa False döner.
#[pyfunction]
fn check_injection(cmd: &str) -> (bool, String) {
    let injection_patterns: &[&str] = &[
        ";", "&&", "||", "|", "\n", "\r", "`", ">", "<", "$(", "${",
    ];

    for pattern in injection_patterns {
        if cmd.contains(pattern) {
            return (
                false,
                format!(
                    "Komut zincirleme veya injection karakteri iceriyor: '{pattern}'"
                ),
            );
        }
    }
    (true, String::new())
}

/// Komutun allowlist'te olup olmadığını kontrol eder.
/// Allowlist CSV formatındadır: "git,npm,python,pip,echo,node"
/// Komutun ilk kelimesi (executable) allowlist'te aranır.
/// .exe uzantısı otomatik olarak soyulur.
#[pyfunction]
fn check_allowlist(cmd: &str, allowlist_csv: &str) -> (bool, String) {
    if allowlist_csv.is_empty() {
        return (true, String::new()); // boş allowlist = her şeye izin
    }

    let allowlist: Vec<&str> = allowlist_csv
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    if allowlist.is_empty() {
        return (true, String::new());
    }

    // İlk kelimeyi al
    let first = match cmd.split_whitespace().next() {
        Some(f) => f,
        None => return (true, String::new()),
    };

    // Yol ayracını çıkar (C:\...\python.exe → python.exe)
    let first_name = first
        .rsplit(|c: char| c == '\\' || c == '/')
        .next()
        .unwrap_or(first);

    // 4 varyantı dene: tam, sadece isim, .exe'siz tam, .exe'siz isim
    let candidates = [
        first.to_lowercase(),
        first_name.to_lowercase(),
        first.to_lowercase().trim_end_matches(".exe").to_string(),
        first_name.to_lowercase().trim_end_matches(".exe").to_string(),
    ];

    for candidate in &candidates {
        for allowed in &allowlist {
            if candidate == &allowed.to_lowercase() {
                return (true, String::new());
            }
        }
    }

    let allowed_list = allowlist.join(", ");
    (
        false,
        format!("Komut allowlist'te degil: '{first}'. Izin verilenler: {allowed_list}"),
    )
}

/// Tehlikeli argümanları kontrol eder.
/// Belirli komutlar için belirli bayraklar/argümanlar engellenir.
/// Örn: python -c, git config, npm install i (kısaltma) vb.
#[pyfunction]
fn check_blocked_args(cmd: &str) -> (bool, String) {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    if parts.is_empty() {
        return (true, String::new());
    }

    let exe = parts[0]
        .rsplit(|c: char| c == '\\' || c == '/')
        .next()
        .unwrap_or(parts[0])
        .to_lowercase()
        .trim_end_matches(".exe")
        .to_string();

    let args: Vec<String> = parts[1..].iter().map(|s| s.to_string()).collect();

    // Komuta özgü engellenen argümanlar
    let blocked: &[(&str, &[&str])] = &[
        ("python", &["-c", "-m", "-i", "--interactive"]),
        ("python3", &["-c", "-m", "-i", "--interactive"]),
        ("node", &["-e", "--eval", "-p", "--print"]),
        ("npm", &["i", "install", "exec", "x"]),
        ("pip", &["install", "download", "uninstall"]),
        ("pip3", &["install", "download", "uninstall"]),
        ("git", &["config", "credential", "remote"]),
    ];

    for (target_exe, blocked_args) in blocked {
        if exe == *target_exe {
            for arg in &args {
                for blocked_arg in *blocked_args {
                    if arg == blocked_arg {
                        return (
                            false,
                            format!(
                                "'{exe}' icin '{arg}' argumanı güvenlik nedeniyle engellendi."
                            ),
                        );
                    }
                }
            }
            break;
        }
    }

    (true, String::new())
}

/// Tek seferde tüm sandbox kontrollerini çalıştırır.
/// injection + allowlist + blocked_args kontrollerini sırasıyla yapar.
/// İlk başarısızlıkta durur (short-circuit).
#[pyfunction]
fn check_command_full(cmd: &str, allowlist_csv: &str) -> (bool, String) {
    // 1. Injection kontrolü
    let (ok, msg) = check_injection(cmd);
    if !ok {
        return (false, msg);
    }

    // 2. Allowlist kontrolü
    let (ok, msg) = check_allowlist(cmd, allowlist_csv);
    if !ok {
        return (false, msg);
    }

    // 3. Blocked args kontrolü
    check_blocked_args(cmd)
}

// ── Modül Kaydı ─────────────────────────────────────────────

pub fn register(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(check_injection, m)?)?;
    m.add_function(wrap_pyfunction!(check_allowlist, m)?)?;
    m.add_function(wrap_pyfunction!(check_blocked_args, m)?)?;
    m.add_function(wrap_pyfunction!(check_command_full, m)?)?;
    Ok(())
}
