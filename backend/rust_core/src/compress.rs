// ─────────────────────────────────────────────────────────────
// Compress modülü — ZIP / TAR.GZ sıkıştırma ve açma
// ─────────────────────────────────────────────────────────────
// Python shutil.make_archive / zipfile yerine Rust-native
// flate2 + zip crate'leri kullanır. Büyük dizinlerde ~30x hızlıdır.

use pyo3::prelude::*;

use flate2::write::GzEncoder;
use flate2::read::GzDecoder;
use flate2::Compression;
use std::fs::{self, File};
use std::io::{self, BufReader, BufWriter};
use std::path::Path;
use tar;
use walkdir::WalkDir;

// ── ZIP Sıkıştırma ─────────────────────────────────────────

/// Bir dizini veya dosyayı ZIP formatında sıkıştırır.
/// Dönen değer: oluşan ZIP dosyasının boyutu (bytes).
#[pyfunction]
fn zip_compress(source_path: &str, output_path: &str) -> PyResult<u64> {
    let source = Path::new(source_path);
    if !source.exists() {
        return Err(PyErr::new::<pyo3::exceptions::PyFileNotFoundError, _>(
            format!("Kaynak bulunamadi: {source_path}"),
        ));
    }

    let file = File::create(output_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let mut zip_writer = zip::ZipWriter::new(BufWriter::new(file));
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(6));

    if source.is_file() {
        // Tek dosya
        let name = source.file_name().unwrap().to_string_lossy();
        zip_writer
            .start_file(name.as_ref(), options)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        let mut f = File::open(source)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        io::copy(&mut f, &mut zip_writer)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    } else {
        // Dizin — recursive walk
        let prefix = source;
        for entry in WalkDir::new(source).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            let relative = path.strip_prefix(prefix).unwrap();

            if path.is_dir() {
                if relative.as_os_str().is_empty() {
                    continue;
                }
                let dir_name = format!("{}/", relative.to_string_lossy());
                zip_writer
                    .add_directory(&dir_name, options)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
            } else {
                let name = relative.to_string_lossy().replace('\\', "/");
                zip_writer
                    .start_file(&name, options)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
                let mut f = File::open(path)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
                io::copy(&mut f, &mut zip_writer)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
            }
        }
    }

    zip_writer
        .finish()
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let meta = fs::metadata(output_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    Ok(meta.len())
}

/// ZIP dosyasını açar.
#[pyfunction]
fn zip_extract(zip_path: &str, output_dir: &str) -> PyResult<usize> {
    let file = File::open(zip_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let mut archive = zip::ZipArchive::new(BufReader::new(file))
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let out = Path::new(output_dir);
    fs::create_dir_all(out)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let count = archive.len();
    for i in 0..count {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

        let entry_path = out.join(entry.name());

        if entry.is_dir() {
            fs::create_dir_all(&entry_path)
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        } else {
            if let Some(parent) = entry_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
            }
            let mut outfile = File::create(&entry_path)
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
            io::copy(&mut entry, &mut outfile)
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        }
    }
    Ok(count)
}

// ── TAR.GZ Sıkıştırma ──────────────────────────────────────

/// Bir dizini tar.gz formatında sıkıştırır.
#[pyfunction]
fn tar_gz_compress(source_path: &str, output_path: &str) -> PyResult<u64> {
    let source = Path::new(source_path);
    if !source.exists() {
        return Err(PyErr::new::<pyo3::exceptions::PyFileNotFoundError, _>(
            format!("Kaynak bulunamadi: {source_path}"),
        ));
    }

    let file = File::create(output_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let enc = GzEncoder::new(BufWriter::new(file), Compression::default());
    let mut tar_builder = tar::Builder::new(enc);

    if source.is_file() {
        let name = source.file_name().unwrap().to_string_lossy();
        tar_builder
            .append_path_with_name(source, name.as_ref())
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    } else {
        let dir_name = source.file_name().unwrap().to_string_lossy();
        tar_builder
            .append_dir_all(dir_name.as_ref(), source)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    }

    tar_builder
        .finish()
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let meta = fs::metadata(output_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    Ok(meta.len())
}

/// tar.gz dosyasını açar.
#[pyfunction]
fn tar_gz_extract(archive_path: &str, output_dir: &str) -> PyResult<usize> {
    let file = File::open(archive_path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let dec = GzDecoder::new(BufReader::new(file));
    let mut archive = tar::Archive::new(dec);

    fs::create_dir_all(output_dir)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let mut count = 0usize;
    for entry in archive
        .entries()
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?
    {
        let mut entry =
            entry.map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        entry
            .unpack_in(output_dir)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        count += 1;
    }
    Ok(count)
}

// ── Modül Kaydı ─────────────────────────────────────────────

pub fn register(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(zip_compress, m)?)?;
    m.add_function(wrap_pyfunction!(zip_extract, m)?)?;
    m.add_function(wrap_pyfunction!(tar_gz_compress, m)?)?;
    m.add_function(wrap_pyfunction!(tar_gz_extract, m)?)?;
    Ok(())
}
