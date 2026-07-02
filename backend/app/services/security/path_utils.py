"""Path expansion helper — %USERPROFILE%, $HOME, ~ vb. kisaltmalari guvenli sekilde acar.

Bu modul olmadan literal "%USERPROFILE%\\Desktop\\foo.txt" sandbox kontrolunu
atlatip backend dizininde sub-dir olusturuyordu.

Tum tool'lar Path girdisi alirken `expand_path()` kullanmali.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Union


def expand_path(p: Union[str, Path, None]) -> Path:
    """Bir kullanici girdi yolunu guvenli sekilde mutlak Path'e cevirir.

    - Cevre degiskenleri (%USERPROFILE%, $HOME, %APPDATA%, ${VAR}) genisletilir
    - ~ kullanici klasoruyle degistirilir
    - Path normalize/resolve edilir
    """
    raw = "" if p is None else str(p)
    expanded = os.path.expandvars(raw)
    return Path(expanded).expanduser().resolve()


__all__ = ["expand_path"]