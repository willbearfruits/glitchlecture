@echo off
REM Creative Destruction — launch the local server on Windows.
cd /d "%~dp0"
where py >nul 2>nul && (py serve.py %* & goto :eof)
where python >nul 2>nul && (python serve.py %* & goto :eof)
echo Python not found on PATH. Install Python 3 or run: python serve.py
pause
