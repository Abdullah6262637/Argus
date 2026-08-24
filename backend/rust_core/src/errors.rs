//! Merkezi hata yonetimi - Rust hatalarini PyO3 Exception'larina cevirir.

use pyo3::exceptions::{PyIOError, PyValueError, PyRuntimeError};
use pyo3::PyErr;
use std::fmt;

#[derive(Debug)]
pub enum ArgusError {
    Io(std::io::Error),
    Value(String),
    Runtime(String),
}

impl fmt::Display for ArgusError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArgusError::Io(e) => write!(f, "IO hatasi: {}", e),
            ArgusError::Value(msg) => write!(f, "Deger hatasi: {}", msg),
            ArgusError::Runtime(msg) => write!(f, "Calisma zamani hatasi: {}", msg),
        }
    }
}

impl From<std::io::Error> for ArgusError {
    fn from(err: std::io::Error) -> Self {
        ArgusError::Io(err)
    }
}

impl From<ArgusError> for PyErr {
    fn from(err: ArgusError) -> PyErr {
        match err {
            ArgusError::Io(e) => PyIOError::new_err(e.to_string()),
            ArgusError::Value(msg) => PyValueError::new_err(msg),
            ArgusError::Runtime(msg) => PyRuntimeError::new_err(msg),
        }
    }
}

impl From<zip::result::ZipError> for ArgusError {
    fn from(err: zip::result::ZipError) -> Self {
        ArgusError::Runtime(format!("ZIP hatasi: {}", err))
    }
}
