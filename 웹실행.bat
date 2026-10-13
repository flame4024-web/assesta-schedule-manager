@echo off
chcp 65001 > nul
title 어세스타 인트라넷 캘린더 매니저

echo =======================================================
echo    어세스타 인트라넷 캘린더 웹 애플리케이션을 시작합니다...
echo =======================================================
echo.

cd /d "%~dp0"

:: 상위 .venv 가상환경의 python 실행
set PYTHON_EXE=%~dp0..\..\.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=..\..\.venv\Scripts\python.exe
)
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

:: 기본 브라우저로 2초 후 자동 열기
start "" cmd /c "timeout /t 2 /nobreak > nul & start http://localhost:8000"

:: 서버 실행
"%PYTHON_EXE%" server.py

pause
