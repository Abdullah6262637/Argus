; UmtalAgent NSIS Installer Script
; ---------------------------------
; ⚠️ Sprint C.4 NOTU:
;   electron-builder native NSIS desteği aktif (frontend/package.json `build.nsis`).
;   Standart akış:
;     1) cd backend && python -m PyInstaller umtalagent.spec --clean --noconfirm
;     2) cd ../frontend && npm run build && npx electron-builder --win --x64
;   electron-builder otomatik olarak NSIS installer üretir; bu .nsi dosyası
;   yalnızca özel/manuel installer ihtiyacı için referans olarak tutulmaktadır.
;
; Manuel build (gerekirse):
;   makensis installer/umtalagent.nsi
;
; Cikti:
;   dist/UmtalAgent-Setup.exe
;
; Bu script asagidaki klasorleri bekler:
;   - frontend/release/win-unpacked/                 (electron-builder --dir cikti)
;   - backend/dist/umtalagent-backend/               (pyinstaller cikti)

!define APP_NAME "UmtalAgent"
!define APP_VERSION "0.3.0"
!define APP_PUBLISHER "UmtalAgent"
!define APP_URL "https://github.com/umtalagent"
!define APP_EXE "UmtalAgent.exe"
!define BACKEND_EXE "umtalagent-backend.exe"

SetCompressor /SOLID lzma
Unicode true

; Modern UI
!include "MUI2.nsh"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "..\dist\UmtalAgent-Setup.exe"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
InstallDirRegKey HKCU "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel user
ShowInstDetails show
ShowUnInstDetails show

; UI sayfalari
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "Turkish"
!insertmacro MUI_LANGUAGE "English"

; -----------------------------------------------------------------------------
; Yukleme
; -----------------------------------------------------------------------------
Section "Ana Uygulama" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Frontend Electron buildi
  File /r "..\frontend\release\win-unpacked\*.*"

  ; Backend PyInstaller buildi -> resources/backend/
  SetOutPath "$INSTDIR\resources\backend"
  File /r "..\backend\dist\umtalagent-backend\*.*"

  ; Souls + workflows + .env.example
  SetOutPath "$INSTDIR\resources\backend\agents"
  File /r "..\backend\agents\*.*"

  SetOutPath "$INSTDIR"

  ; Registry
  WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\${APP_NAME}" "Version" "${APP_VERSION}"

  ; Uninstall registry (Add/Remove Programs)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                   "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                   "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                   "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                   "URLInfoAbout" "${APP_URL}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                   "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" \
                    "NoRepair" 1

  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Masaustu Kisayolu" SecDesktop
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
SectionEnd

Section "Baslat Menusu" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd

; -----------------------------------------------------------------------------
; Kaldirma
; -----------------------------------------------------------------------------
Section "Uninstall"
  ; Calismakta olan process'leri kibarca durdur
  ExecWait 'taskkill /F /IM "${APP_EXE}"' $0
  ExecWait 'taskkill /F /IM "${BACKEND_EXE}"' $0

  RMDir /r "$INSTDIR"

  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"

  DeleteRegKey HKCU "Software\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd