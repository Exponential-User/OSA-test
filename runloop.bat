@echo off
:loop
cls
"C:\Program Files\nodejs\node.exe" --trace-warnings ".\server\server.js"
pause >nul
goto loop