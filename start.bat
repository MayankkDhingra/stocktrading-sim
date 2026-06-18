@echo off
echo ============================================
echo  TradeX - Stock Trading Simulator Launcher
echo ============================================
echo.

echo Starting Backend Server...
start "TradeX Backend" cmd /c "cd /d F:\stocktrading-sim\backend && C:\Users\mayankk\AppData\Local\Python\pythoncore-3.14-64\python.exe app.py"
echo Backend starting on http://localhost:5000

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server...
start "TradeX Frontend" cmd /c "cd /d C:\Users\mayankk\stocktrading-sim\frontend && npm run dev"
echo Frontend starting on http://localhost:5173

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo  TradeX is starting up!
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5000
echo.
echo  Demo Login:
echo    Email: demo@tradex.com
echo    Password: demo123
echo ============================================
echo.
pause
