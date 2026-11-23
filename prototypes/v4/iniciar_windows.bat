@echo off
setlocal
cd /d "%~dp0"
echo Umbra V4 - Servidor local
echo Abre http://127.0.0.1:8000/ en tu navegador.
echo Mantiene esta ventana abierta. Para detener: Ctrl+C.
echo.
where py >nul 2>nul
if errorlevel 1 goto usar_python
py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist
goto fin
:usar_python
where python >nul 2>nul
if errorlevel 1 goto falta_python
python -m http.server 8000 --bind 127.0.0.1 --directory dist
goto fin
:falta_python
echo Necesitas Python 3 para usar este servidor.
echo Tambien puedes abrir dist\index.html directamente.
:fin
pause
