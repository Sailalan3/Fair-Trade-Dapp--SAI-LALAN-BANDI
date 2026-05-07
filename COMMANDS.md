<div align="center">

# 🚀 FairTrace — Quick Command Reference

*Print this · pin it to your terminal · live by it.*

</div>

---

## 📑 Contents

1. [First-time setup](#1️⃣-first-time-setup)
2. [Daily startup (5 terminals)](#2️⃣-daily-startup--5-terminals)
3. [Smart-contract commands](#3️⃣-smart-contract-commands)
4. [After deploying the contract](#4️⃣-after-deploying-the-contract)
5. [Useful URLs](#5️⃣-useful-urls)
6. [MetaMask network](#6️⃣-metamask-network)
7. [Audit commands](#7️⃣-audit-commands)
8. [Common fixes](#8️⃣-common-fixes)
9. [Handy one-liners](#9️⃣-handy-one-liners)

---

## 1️⃣ First-time setup

### Option A — bootstrap script

```bash
./setup-mac-linux.sh           # 🍎 macOS / 🐧 Linux
setup-windows.bat              # 🪟 Windows
```

### Option B — manual

```bash
cd blockchain && npm install && cd ..
cd backend    && npm install && cd ..
cd frontend   && npm install && cd ..
```

---

## 2️⃣ Daily startup — 5 terminals

| # | Tab | Command | Port |
|---|---|---|---|
| 1 | 🍦 **Ganache** | `ganache --port 7545` | `:7545` |
| 2 | 🍃 **MongoDB** | `mongod` | `:27017` |
| 3 | ⛓ **Migrate** (one-shot) | `cd blockchain && truffle migrate --reset --network development` | — |
| 4 | 🔌 **Backend** | `cd backend && npm run dev` | `:5050` |
| 5 | 🖥 **Frontend** | `cd frontend && npm run dev` | `:5173` |

---

## 3️⃣ Smart-contract commands

```bash
cd blockchain

truffle compile                                # 🔨 compile .sol
truffle compile --all                          # 🔨 force-recompile everything
truffle migrate --network development          # 🚀 deploy (first time)
truffle migrate --reset --network development  # 🔁 redeploy after changes
truffle test                                   # 🧪 14 tests + gas report
truffle console --network development          # 💻 interactive REPL
```

---

## 4️⃣ After deploying the contract

1. 📋 **Copy the contract address** from the migrate output.
2. 🔧 Paste into `backend/.env`  → `CONTRACT_ADDRESS=0x...`
3. 🔧 Paste into `frontend/.env` → `VITE_CONTRACT_ADDRESS=0x...`
4. 🔁 **Sync the ABI** to both layers:

```bash
cd blockchain
node -e "const c=require('./build/contracts/SupplyChain.json'); \
require('fs').writeFileSync('../backend/config/SupplyChainABI.json', \
JSON.stringify(c.abi,null,2));"
cp ../backend/config/SupplyChainABI.json \
   ../frontend/src/config/SupplyChainABI.json
```

---

## 5️⃣ Useful URLs

| Service | URL |
|---|---|
| 🖥 Frontend | http://localhost:5173 |
| 🔌 Backend API | http://localhost:5050/api |
| 💚 Health check | http://localhost:5050/api/health |
| ⛓ Ganache RPC | http://127.0.0.1:7545 |
| 🔍 Public tracking | http://localhost:5173/track/{productId} |

---

## 6️⃣ MetaMask network

| Field | Value |
|---|---|
| Network name | Ganache Local |
| RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `1337` |
| Currency symbol | ETH |

> 💡 Import the test mnemonic Ganache prints on startup so accounts come pre-funded.

---

## 7️⃣ Audit commands

| 🎯 Audit | Command | Expected |
|---|---|---|
| Unit tests + gas | `cd blockchain && truffle test` | 14/14 ✅ + `gas-report.txt` |
| Clean compile | `cd blockchain && truffle compile --all` | 0 warnings |
| Frontend lint | `cd frontend && npm run lint` | 0 errors, 0 warnings |
| Production bundle | `cd frontend && npm run build` | bundle in `dist/` |

---

## 8️⃣ Common fixes

| 🚨 Symptom | 🔧 Fix |
|---|---|
| MetaMask **"nonce too high"** | Settings → Advanced → Clear activity tab data |
| `Cannot find module ...` | Run `npm install` in that workspace |
| `Could not detect network` | Start Ganache first |
| `Network up to date` on migrate | Add `--reset` flag |
| Frontend blank page | DevTools (F12) → check console; verify backend `:5050` is up |
| `MongoNetworkError` | Start `mongod` or set `MONGODB_URI` to Atlas |
| Stage transition reverts | Confirm wallet has correct role (Admin must assign) |
| `Invalid JSON RPC response` | Re-import Ganache mnemonic; reset MetaMask account |
| Frontend can't reach backend | Check CORS + `VITE_API_URL` in `frontend/.env` |

---

## 9️⃣ Handy one-liners

```bash
# 🪵  Tail backend logs filtered to API hits
cd backend && npm run dev | grep -E "(POST|GET|PUT|DELETE) /api"

# 📊  Count lines of code per workspace (excludes node_modules)
find blockchain backend frontend \
  -name node_modules -prune -o \
  \( -name "*.js" -o -name "*.jsx" -o -name "*.sol" \) -print | xargs wc -l

# 🧹  Clear browser localStorage between manual tests
#     (paste in DevTools console)
localStorage.clear(); location.reload();

# 🔄  Reset Ganache + redeploy + re-test in one shot
cd blockchain && \
truffle migrate --reset --network development && \
truffle test

# 📤  Quick smoke-test the backend
curl -s http://localhost:5050/api/health | jq
```

---

<div align="center">

**🌱 FairTrace · BSc CS Final-Year Project · UEL CN6000**

[← back to README](README.md)

</div>
