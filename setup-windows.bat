@echo off
echo =========================================================
echo   FairTrace DApp - Windows Setup Script
echo =========================================================
echo.

:: Check Node.js
echo [1/7] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo       Node.js found: 
node --version

:: Check Truffle
echo [2/7] Checking Truffle...
truffle version >nul 2>&1
if %errorlevel% neq 0 (
    echo       Truffle not found. Installing globally...
    npm install -g truffle
)
echo       Truffle OK

:: Install dependencies
echo [3/7] Installing blockchain dependencies...
cd blockchain
call npm install
cd ..

echo [4/7] Installing backend dependencies...
cd backend
call npm install
cd ..

echo [5/7] Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: Create .env files if missing
echo [6/7] Setting up environment files...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo       Created backend\.env — EDIT THIS FILE with your contract address!
) else (
    echo       backend\.env already exists
)

if not exist "frontend\.env" (
    copy frontend\.env.example frontend\.env
    echo       Created frontend\.env — EDIT THIS FILE with your contract address!
) else (
    echo       frontend\.env already exists
)

echo.
echo =========================================================
echo   SETUP COMPLETE!
echo =========================================================
echo.
echo   Next steps:
echo.
echo   1. Start Ganache (GUI or run: ganache --port 7545)
echo   2. Start MongoDB (run: mongod)
echo   3. Compile and deploy the smart contract:
echo        cd blockchain
echo        truffle compile
echo        truffle migrate --network development
echo   4. COPY the contract address from the output
echo   5. PASTE it into backend\.env (CONTRACT_ADDRESS=...)
echo   6. PASTE it into frontend\.env (VITE_CONTRACT_ADDRESS=...)
echo   7. Copy the ABI:
echo        node -e "const c = require('./build/contracts/SupplyChain.json'); const fs = require('fs'); fs.writeFileSync('../backend/config/SupplyChainABI.json', JSON.stringify(c.abi, null, 2));"
echo        copy ..\backend\config\SupplyChainABI.json ..\frontend\src\config\SupplyChainABI.json
echo   8. Start backend: cd backend ^&^& npm run dev
echo   9. Start frontend: cd frontend ^&^& npm run dev
echo  10. Open http://localhost:5173
echo.
pause
