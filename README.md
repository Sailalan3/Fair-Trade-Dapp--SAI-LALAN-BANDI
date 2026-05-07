<div align="center">

# 🌱 FairTrace

### A Blockchain-Based Fair-Trade Supply Chain Transparency System

*Every custody hand-off, every price change, signed on-chain and publicly verifiable.*

[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Truffle](https://img.shields.io/badge/Truffle-5-3FE0C5?logo=truffle&logoColor=white)](https://trufflesuite.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🎓 **BSc Computer Science final-year project · University of East London (CN6000)**
> 👨‍💻 **Author:** Sai Lalan Bandi · 🧑‍🏫 **Supervisor:** Lucian Mihai Duta

</div>

---

## 📖 Table of contents

- [✨ Why FairTrace?](#-why-fairtrace)
- [🏗 Architecture](#-architecture)
- [🧰 Tech stack](#-tech-stack)
- [📂 Repository structure](#-repository-structure)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Quick start](#-quick-start)
- [👥 Roles & dashboards](#-roles--dashboards)
- [📜 Smart contract](#-smart-contract)
- [🔌 Backend API](#-backend-api)
- [🖥 Frontend](#-frontend)
- [✅ Testing & audits](#-testing--audits)
- [🔍 Public tracking page](#-public-tracking-page)
- [🛠 Troubleshooting](#-troubleshooting)
- [🛣 Future work](#-future-work)
- [📝 License](#-license)

---

## ✨ Why FairTrace?

Fair-trade certification protects **~1.9 million farmers** worldwide. But paper-based audit trails are vulnerable to:

- 📝 **Relabelling fraud** — non-certified lots passed off as Fairtrade
- 💸 **Mid-chain price suppression** — premium captured by middlemen
- 🌫 **Lost provenance** — once a product crosses borders, the trail breaks
- ⏳ **Delayed premium payments** — producers wait months for what's owed

**FairTrace replaces paper with an immutable on-chain ledger:**

| ✓ | What |
|---|---|
| ✓ | Every product registered by a Farmer wallet on chain |
| ✓ | Every transfer signed by the participating wallet, timestamped to the block |
| ✓ | Every consumer can scan a QR code and see the same ledger an auditor sees |
| ✓ | Backend mirrors state into MongoDB for fast reads — but the chain is the source of truth |

---

## 🏗 Architecture

FairTrace is a **partially decentralised dapp** — chain for state, mirror for speed.

```
                  ┌────────────────────────────┐
   👤 Browser ───▶│   React + Vite frontend    │
                  └─────┬───────────────┬──────┘
                        │               │
            🦊 MetaMask │               │ REST + JWT
            (signs tx)  │               │
                        ▼               ▼
            ┌────────────────────┐  ┌───────────────────────┐
            │  SupplyChain.sol   │  │  Express + MongoDB    │
            │  (Solidity 0.8.19) │  │  mirror layer         │
            └────────────────────┘  └───────────────────────┘
              ⛓ Canonical state       💾 Read cache + admin
```

**Design principle:** if the backend goes down, the chain still works. Products can still be registered, transferred, and tracked through MetaMask alone.

---

## 🧰 Tech stack

<table>
<tr>
<th>Layer</th><th>Technologies</th>
</tr>
<tr>
<td><strong>⛓ Smart contract</strong></td>
<td>Solidity 0.8.19 · Truffle 5 · Ganache (port 7545) · eth-gas-reporter</td>
</tr>
<tr>
<td><strong>🔌 Backend</strong></td>
<td>Node.js 20 · Express 4 · MongoDB 6 · Mongoose 7 · JWT · bcrypt · QRCode</td>
</tr>
<tr>
<td><strong>🖥 Frontend</strong></td>
<td>React 18 · Vite 5 · React Router 6 · Web3.js · TailwindCSS · jsPDF</td>
</tr>
<tr>
<td><strong>🦊 Wallet</strong></td>
<td>MetaMask</td>
</tr>
<tr>
<td><strong>🛠 Tooling</strong></td>
<td>ESLint · Lighthouse · MongoDB Compass · nodemon</td>
</tr>
</table>

---

## 📂 Repository structure

```
Fair-Trade-Dapp--SAI-LALAN-BANDI/
│
├── 📜 blockchain/                    Smart-contract workspace
│   ├── contracts/
│   │   ├── SupplyChain.sol           5-stage lifecycle + role guards
│   │   └── Migrations.sol            Truffle bookkeeping
│   ├── migrations/
│   │   ├── 1_initial_migration.js
│   │   └── 2_deploy_supply_chain.js
│   ├── test/
│   │   └── SupplyChain.test.js       14 Truffle unit tests
│   ├── package.json
│   └── truffle-config.js             Compiler + gas-reporter config
│
├── 🔌 backend/                       Express + MongoDB mirror
│   ├── config/
│   │   ├── blockchain.js             Web3 + contract loader
│   │   ├── db.js                     Mongoose connector
│   │   └── SupplyChainABI.json       Contract ABI
│   ├── middleware/
│   │   └── auth.js                   JWT verify + role guard
│   ├── models/                       Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   ├── Receipt.js
│   │   ├── Delivery.js
│   │   └── Certification.js
│   ├── routes/                       REST endpoints
│   │   ├── auth.js                   /api/auth — login, sync, profile
│   │   ├── products.js               /api/products — CRUD + sync + QR
│   │   ├── transactions.js           /api/transactions — history
│   │   ├── receipts.js               /api/receipts — PDF receipts
│   │   ├── deliveries.js             /api/deliveries — 5-stage tracking
│   │   └── admin.js                  /api/admin — role management
│   ├── nodemon.json
│   ├── package.json
│   └── server.js                     App entry, mounts /api/*
│
├── 🖥 frontend/                      React + Vite SPA
│   └── src/
│       ├── components/               Reusable UI
│       │   ├── Navbar.jsx
│       │   ├── ActionModal.jsx       Transfer / self-action modal
│       │   ├── RoleBadge.jsx
│       │   ├── ProductCard.jsx
│       │   └── Timeline.jsx
│       ├── context/
│       │   └── AuthContext.jsx       Wallet + JWT state
│       ├── pages/                    One file per route
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── AddProductPage.jsx    Farmer registration form
│       │   ├── TrackPage.jsx         Public /track/:id
│       │   └── dashboards/           Six role-based dashboards
│       │       ├── FarmerDashboard.jsx
│       │       ├── ProcessorDashboard.jsx
│       │       ├── ExporterDashboard.jsx
│       │       ├── WarehouseDashboard.jsx
│       │       ├── RetailerDashboard.jsx
│       │       ├── TransporterDashboard.jsx
│       │       └── AdminDashboard.jsx
│       ├── utils/
│       │   ├── blockchain.js         Contract bindings
│       │   ├── apiClient.js          Axios + JWT injector
│       │   ├── backendSync.js        Fail-soft mirror layer
│       │   ├── store.js              localStorage primary store
│       │   ├── receiptGenerator.js   jsPDF + QR code
│       │   └── reputation.js
│       ├── config/
│       │   └── SupplyChainABI.json
│       ├── App.jsx                   Route table + RequireAuth
│       └── main.jsx                  Entry point
│
├── 📄 README.md                      ← you are here
├── 📄 COMMANDS.md                    One-page cheat-sheet
├── 📄 SETUP_GUIDE.md                 Detailed first-time walkthrough
├── 🐚 setup-mac-linux.sh             Bootstrap script (macOS / Linux)
└── 🐚 setup-windows.bat              Bootstrap script (Windows)
```

---

## ⚙️ Prerequisites

| Requirement | Version | Install |
|---|---|---|
| 🟢 **Node.js** | 20.x | https://nodejs.org/ |
| 📦 **npm** | 10.x | (bundled with Node) |
| 🍃 **MongoDB** | 6.x | https://www.mongodb.com/try/download/community |
| ⚙️ **Truffle** | latest | `npm install -g truffle` |
| 🍦 **Ganache** | desktop or CLI | https://trufflesuite.com/ganache/ |
| 🦊 **MetaMask** | browser extension | https://metamask.io/ |

---

## 🚀 Quick start

```bash
# 1️⃣  Clone the repo
git clone https://github.com/Sailalan3/Fair-Trade-Dapp--SAI-LALAN-BANDI.git
cd Fair-Trade-Dapp--SAI-LALAN-BANDI

# 2️⃣  Install dependencies in all three workspaces
cd blockchain && npm install && cd ..
cd backend    && npm install && cd ..
cd frontend   && npm install && cd ..

# 3️⃣  Start the local Ethereum chain   [Terminal 1]
ganache --port 7545

# 4️⃣  Compile + migrate + test          [Terminal 2]
cd blockchain
truffle compile --all
truffle migrate --reset --network development
truffle test          # 14 cases must pass ✅

# 5️⃣  Wire ABI + contract address
#     → see COMMANDS.md "After deploying the contract"

# 6️⃣  Start MongoDB                      [Terminal 3]
mongod

# 7️⃣  Start backend                      [Terminal 4]
cd backend && npm run dev          # listens on :5050

# 8️⃣  Start frontend                     [Terminal 5]
cd frontend && npm run dev         # opens http://localhost:5173
```

**MetaMask config:** RPC `http://127.0.0.1:7545` · Chain ID `1337` · import test mnemonic from Ganache.

---

## 👥 Roles & dashboards

| 🎭 Role | 🛣 Route | 🔧 Capabilities |
|---|---|---|
| 🌾 **Farmer** | `/dashboard/farmer` | Register new product batches |
| 🏭 **Processor** | `/dashboard/processor` | Receive batches, mark as processed |
| 🚢 **Exporter** | `/dashboard/exporter` | Receive processed batches, mark as exported |
| 📦 **Warehouse** | `/dashboard/warehouse` | Allocate batches to rack zones |
| 🏪 **Retailer** | `/dashboard/retailer` | Receive batches, list for consumers |
| 🚚 **Transporter** | `/dashboard/transporter` | Five-stage delivery tracking |
| 👑 **Admin** | `/dashboard/admin` | Assign roles, view system health |

> **Bootstrap rule:** the first wallet to deploy the contract is Admin. New wallets sign in and are auto-registered as Farmers; the Admin promotes them.

---

## 📜 Smart contract

**File:** `blockchain/contracts/SupplyChain.sol`

```solidity
enum Stage  { Registered, Processed, Exported, Retailed, Sold }
enum Role   { None, Farmer, Processor, Exporter, Retailer, Admin }

struct Product {
    uint256 id;            string  batchId;       string  productName;
    address currentOwner;  address farmer;        Stage   currentStage;
    uint256 initialPrice;  uint256 quantity;      uint256 createdAt;
    bool    exists;
}

event ProductRegistered(uint256 indexed productId, string batchId,
    address indexed farmer, uint256 timestamp);
event OwnershipTransferred(uint256 indexed productId, address indexed seller,
    address indexed buyer, uint256 price, uint8 toStage, uint256 timestamp);
```

| Metric | Value |
|---|---|
| Compiler | Solidity 0.8.19 |
| Optimiser | Enabled, 200 runs |
| Deployment cost | ≈ 2.23 M gas (~$1.40 on Polygon @ 30 gwei) |
| `registerProduct` | ≈ 290 k gas (sub-cent on Polygon) |
| Test coverage | 14/14 unit tests pass |

Full per-method breakdown in `gas-report.txt` (auto-generated by `truffle test`).

---

## 🔌 Backend API

All routes mounted under `/api`. State-changing endpoints guarded by **JWT + role middleware**.

| Mount | Method · Path | Auth | Purpose |
|---|---|---|---|
| `/api/auth` | `POST /login` | — | Wallet login, auto-register, returns JWT |
| | `POST /sync-user` | — | Upsert user (used by mirror + seed) |
| | `GET /me` | 🔒 JWT | Return current user |
| | `PUT /profile` | 🔒 JWT | Update profile |
| `/api/products` | `POST /` | 🔒 Farmer | Register product (server generates QR) |
| | `POST /sync` | — | Mirror upsert by `blockchainId` |
| | `GET /` | — | List all products |
| | `GET /:id` | — | Get product by id |
| | `PUT /:id` | 🔒 owner | Update fields |
| `/api/transactions` | `POST /sync` | — | Mirror new transactions |
| | `GET /` | — | List all transactions |
| `/api/receipts` | `POST /` | — | Upsert receipt |
| | `GET /:id` | — | Fetch receipt |
| `/api/deliveries` | `POST /` | — | Create delivery |
| | `PUT /:id` | — | Update delivery status |
| | `GET /` | — | List deliveries |
| `/api/admin` | `POST /role` | 🔒 Admin | Assign role to wallet |
| | `GET /users` | 🔒 Admin | List all users |

---

## 🖥 Frontend

**Stack:** React 18 + Vite 5 + React Router 6.

### Key entry points

| File | Role |
|---|---|
| `src/main.jsx` | Mounts `<App />` into `#root`, imports global CSS |
| `src/App.jsx` | Route table + `RequireAuth` wrapper for protected routes |
| `src/context/AuthContext.jsx` | Wallet + JWT lifecycle, exposes `login`, `register`, `loginWithWallet` |
| `src/utils/blockchain.js` | `registerProductOnChain`, `transferOwnershipOnChain`, `advanceStageOnChain`, `fetchProductTimeline` |
| `src/utils/backendSync.js` | Fail-soft mirror — never blocks on backend outage |
| `src/utils/store.js` | localStorage primary store + mirror-call hooks |
| `src/pages/AddProductPage.jsx` | Farmer registration form |
| `src/pages/TrackPage.jsx` | Public `/track/:id` route, no login required |

### Design principle: fail-soft mirror

```js
async function tryPost(path, payload) {
  try { return (await client.post(path, payload)).data; }
  catch (err) {
    console.warn(`[backendSync] POST ${path} failed:`, err.message);
    return null;   // ← never throw, never block
  }
}
```

Backend outage → mirror logs a warning, on-chain transaction proceeds, localStorage stays primary.

---

## ✅ Testing & audits

| Audit | Command | Expected output |
|---|---|---|
| 🧪 Truffle unit tests | `cd blockchain && truffle test` | **14 / 14 passing** |
| ⛽ Gas reporter | (auto with `truffle test`) | `gas-report.txt` written |
| 🔧 Truffle compile | `cd blockchain && truffle compile --all` | **0 warnings** |
| 🧹 ESLint | `cd frontend && npm run lint` | **0 errors, 0 warnings** |
| 📦 Production bundle | `cd frontend && npm run build` | Static bundle in `dist/` |
| 💡 Lighthouse audit | (script in `Documentation/` — local only) | 11 routes, Best Practices 100/100 |

MongoDB Compass screenshots of `users`, `products` and `transactions` collections are reproduced in the dissertation report.

---

## 🔍 Public tracking page

`/track/:id` is the **only route that requires no authentication**.

| Step | What happens |
|---|---|
| 1 | Reads product id from URL |
| 2 | Calls `getProduct(id)` and `productTransactions(id)` on the contract |
| 3 | Renders a vertical timeline: every stage transition, wallet, price, timestamp, certification |
| 4 | Displays a printable QR code linking back to the same page (suitable for packaging) |

This is the page a Fairtrade auditor would consult to verify a contested batch.

---

## 🛠 Troubleshooting

<details>
<summary><strong>MetaMask "nonce too high"</strong></summary>

Settings → Advanced → Clear activity tab data. Re-import the wallet if needed.
</details>

<details>
<summary><strong><code>Cannot find module</code></strong></summary>

Run `npm install` in the affected workspace (`blockchain`, `backend`, or `frontend`).
</details>

<details>
<summary><strong><code>Could not detect network</code></strong></summary>

Make sure Ganache is running on port 7545 before invoking Truffle commands.
</details>

<details>
<summary><strong><code>Network up to date</code> on migrate</strong></summary>

Use the <code>--reset</code> flag: <code>truffle migrate --reset --network development</code>.
</details>

<details>
<summary><strong>Frontend blank page</strong></summary>

Open DevTools (F12), check console for errors. Confirm the backend is up on <code>:5050</code> and Ganache on <code>:7545</code>.
</details>

<details>
<summary><strong><code>MongoNetworkError</code></strong></summary>

Start <code>mongod</code> locally, or set <code>MONGODB_URI</code> in <code>backend/.env</code> to a MongoDB Atlas cluster.
</details>

<details>
<summary><strong>Stage transition reverts</strong></summary>

The wallet must hold the correct role assigned by the Admin via <code>assignRole</code>. New wallets default to Farmer.
</details>

---

## 🛣 Future work

- 🌐 **Sepolia testnet deployment** + Etherscan source verification
- 📎 **IPFS evidence anchoring** for off-chain documents (lab reports, photos)
- 🔐 **Multi-signature admin governance** contract
- 🪪 **Sign-then-verify nonce challenge** for wallet login (currently: raw address)
- 📥 **Persistent retry queue** for the backend mirror (IndexedDB outbox)
- 📱 **Mobile-first redesign** of the public tracking page
- 🌍 **i18n** for producer-facing dashboards (Spanish, French, Swahili, Hindi)

---

## 📝 License

**MIT License** — see `LICENSE` (if present) or contact the author.

---

<div align="center">

**🎓 BSc Computer Science Final-Year Project**
**University of East London · CN6000 · 2026**

*The accompanying written dissertation covers methodology, design rationale, evaluation and reflection.*

</div>
