# =========================================================================
#  FairTrace — Blockchain Fair-Trade Supply Chain DApp
#  COMPLETE SETUP & RUN GUIDE (Beginner-Friendly)
# =========================================================================

## TABLE OF CONTENTS

1.  What Is This Project?
2.  What Software You Need To Install First
3.  Project Folder Structure Explained (Every File)
4.  Step-by-Step Run Commands (Copy-Paste Ready)
5.  How To Configure MetaMask
6.  How To Use The App
7.  DO's and DON'Ts
8.  Troubleshooting Common Errors
9.  API Endpoints Reference
10. Smart Contract Reference

---

## 1. WHAT IS THIS PROJECT?

This is a **Blockchain-Enabled Fair-Trade Supply Chain Tracking System**.

It is a Decentralized Application (DApp) that tracks products (coffee,
cocoa, cotton, tea, etc.) from the farmer all the way to the consumer
using blockchain smart contracts.

**The product journey:**
```
Farmer  →  Processor  →  Exporter  →  Retailer  →  Consumer
```

Every time a product changes hands, the system records:
- Who sold it
- Who bought it
- The price
- The timestamp
- The blockchain transaction hash
- The supply chain stage

This data is stored BOTH on the blockchain (for immutability) and in
MongoDB (for fast querying and extra metadata).

**The system has 3 separate parts that all need to run together:**

```
┌─────────────────────┐
│   FRONTEND          │  ← What the user sees (React website)
│   http://localhost:5173 │
└──────────┬──────────┘
           │ talks to
┌──────────▼──────────┐
│   BACKEND API       │  ← Handles logic, database, QR codes
│   http://localhost:5000 │
└──────────┬──────────┘
           │ connects to
┌──────────▼──────────┐    ┌──────────────────┐
│   MONGODB           │    │  GANACHE          │
│   Database           │    │  (Local Blockchain)│
│   Port 27017        │    │  Port 7545        │
└─────────────────────┘    └──────────────────┘
```

---

## 2. WHAT SOFTWARE YOU NEED TO INSTALL FIRST

You MUST install ALL of these before running the project.

### A. Node.js (v18 or higher)
- Download: https://nodejs.org/
- Pick the LTS version
- This gives you both `node` and `npm` commands
- Verify: Open terminal and type:
  ```
  node --version
  npm --version
  ```

### B. MongoDB
- Download: https://www.mongodb.com/try/download/community
- Install MongoDB Community Server
- **Or** use MongoDB Atlas (free cloud): https://www.mongodb.com/atlas
- Verify: Open terminal and type:
  ```
  mongod --version
  ```

### C. Truffle (Smart Contract Compiler & Deployer)
- Install globally after Node.js is installed:
  ```
  npm install -g truffle
  ```
- Verify:
  ```
  truffle version
  ```

### D. Ganache (Local Blockchain for Testing)
- Download GUI version: https://trufflesuite.com/ganache/
- **Or** install CLI version:
  ```
  npm install -g ganache
  ```
- Ganache gives you a fake blockchain on your computer with
  10 test accounts, each loaded with 100 fake ETH

### E. MetaMask (Browser Extension)
- Install from: https://metamask.io/
- This is a crypto wallet that lives in your browser
- You need this to sign blockchain transactions from the frontend

### F. Git (Optional but recommended)
- Download: https://git-scm.com/

---

## 3. PROJECT FOLDER STRUCTURE EXPLAINED

Here is every single file and what it does:

```
fairtrade-dapp/
│
├── README.md                          ← THIS FILE (setup guide)
│
├── blockchain/                        ← SMART CONTRACT CODE
│   ├── contracts/
│   │   ├── Migrations.sol             ← Required by Truffle (do NOT edit)
│   │   └── SupplyChain.sol            ← THE MAIN SMART CONTRACT
│   │                                     Contains all blockchain logic:
│   │                                     product registration, ownership
│   │                                     transfer, role management
│   │
│   ├── migrations/
│   │   ├── 1_initial_migration.js     ← Deploys Migrations.sol (do NOT edit)
│   │   └── 2_deploy_supply_chain.js   ← Deploys SupplyChain.sol (do NOT edit)
│   │
│   ├── test/
│   │   └── SupplyChain.test.js        ← Unit tests for the smart contract
│   │                                     Tests role management, product
│   │                                     registration, ownership transfers
│   │
│   ├── truffle-config.js              ← Truffle settings: which network
│   │                                     to deploy to (Ganache, Polygon, etc.)
│   │
│   └── package.json                   ← Blockchain dependencies list
│
├── backend/                           ← SERVER-SIDE CODE (Node.js + Express)
│   ├── config/
│   │   ├── db.js                      ← MongoDB connection setup
│   │   ├── blockchain.js              ← Ethers.js connection to smart contract
│   │   └── SupplyChainABI.json        ← ABI file (interface definition for
│   │                                     the smart contract — tells the backend
│   │                                     what functions the contract has)
│   │
│   ├── middleware/
│   │   └── auth.js                    ← JWT authentication + role checking
│   │                                     Protects API routes so only logged-in
│   │                                     users can add/transfer products
│   │
│   ├── models/                        ← MongoDB data schemas
│   │   ├── User.js                    ← User model (wallet, name, role)
│   │   ├── Product.js                 ← Product model (name, batch, QR code)
│   │   ├── Transaction.js             ← Transaction model (seller, buyer, price)
│   │   └── Certification.js           ← Certification types (Fair Trade, Organic)
│   │
│   ├── routes/                        ← API endpoint handlers
│   │   ├── auth.js                    ← Login/register with MetaMask wallet
│   │   ├── products.js                ← Create products, list, search, QR codes
│   │   ├── transactions.js            ← View transaction history
│   │   └── admin.js                   ← Admin dashboard stats, user management
│   │
│   ├── server.js                      ← MAIN BACKEND FILE — starts Express server
│   ├── .env.example                   ← Template for environment variables
│   └── package.json                   ← Backend dependencies list
│
└── frontend/                          ← REACT WEBSITE CODE
    ├── public/                        ← Static files (favicon, etc.)
    ├── index.html                     ← Main HTML page (React mounts here)
    ├── vite.config.js                 ← Vite bundler settings + API proxy
    ├── tailwind.config.js             ← Tailwind CSS theme settings
    ├── postcss.config.js              ← PostCSS config (required by Tailwind)
    ├── .env.example                   ← Template for frontend env variables
    ├── package.json                   ← Frontend dependencies list
    │
    └── src/
        ├── main.jsx                   ← React entry point (renders <App />)
        ├── App.jsx                    ← Main app with routing (all page routes)
        ├── index.css                  ← Global styles + Tailwind imports
        │
        ├── config/
        │   └── SupplyChainABI.json    ← Same ABI file (frontend copy)
        │
        ├── context/
        │   └── AuthContext.jsx        ← Global auth state (wallet, user, login)
        │
        ├── components/
        │   └── Layout.jsx             ← Sidebar navigation + page wrapper
        │
        ├── pages/
        │   ├── LoginPage.jsx          ← MetaMask wallet connect + role select
        │   ├── Dashboard.jsx          ← Stats overview after login
        │   ├── ProductsPage.jsx       ← Browse/search all products
        │   ├── AddProductPage.jsx     ← Register new product (farmer only)
        │   ├── ProductDetailPage.jsx  ← Single product view + QR + timeline
        │   ├── TransferPage.jsx       ← Transfer ownership to next participant
        │   ├── TransactionsPage.jsx   ← View all blockchain transactions
        │   ├── TrackingPage.jsx       ← PUBLIC page (QR code scan destination)
        │   └── AdminPage.jsx          ← Admin dashboard (stats, user mgmt)
        │
        └── utils/
            ├── api.js                 ← Axios HTTP client (talks to backend)
            └── contract.js            ← Ethers.js helpers (talks to blockchain)
```

---

## 4. STEP-BY-STEP RUN COMMANDS

Open your terminal (Command Prompt, PowerShell, or macOS Terminal).
Navigate to the project folder first:

```bash
cd fairtrade-dapp
```

### STEP 1: Install All Dependencies (Run Once)

You need to run `npm install` inside each of the 3 sub-folders.
This downloads all required packages.

```bash
# Install blockchain packages
cd blockchain
npm install

# Install backend packages
cd ../backend
npm install

# Install frontend packages
cd ../frontend
npm install

# Go back to project root
cd ..
```

### STEP 2: Start Ganache (Local Blockchain)

**Option A — Ganache GUI (Recommended for beginners):**
- Open the Ganache application
- Click "Quickstart" (Ethereum)
- It will start on port 7545
- You will see 10 accounts with addresses and private keys
- KEEP THIS OPEN while working

**Option B — Ganache CLI:**
```bash
ganache --port 7545
```
Keep this terminal window open. Do NOT close it.

### STEP 3: Compile & Deploy Smart Contract

Open a NEW terminal window (keep Ganache running).

```bash
cd fairtrade-dapp/blockchain

# Compile the Solidity code into bytecode
truffle compile

# Deploy to your local Ganache blockchain
truffle migrate --network development
```

**IMPORTANT — After deployment you will see output like this:**
```
Deploying 'SupplyChain'
   > contract address:    0x1234567890AbCdEf1234567890AbCdEf12345678
   > transaction hash:    0xabc...
```

**COPY the contract address** (the 0x... after "contract address").
You need it in the next step.

### STEP 4: Update the ABI (After Compile)

After `truffle compile`, Truffle generates a full ABI in the build folder.
Copy it to the backend and frontend:

```bash
# Still inside blockchain/ folder
node -e "const c = require('./build/contracts/SupplyChain.json'); const fs = require('fs'); fs.writeFileSync('../backend/config/SupplyChainABI.json', JSON.stringify(c.abi, null, 2));"

# Copy to frontend too
cp ../backend/config/SupplyChainABI.json ../frontend/src/config/SupplyChainABI.json
```

### STEP 5: Create Environment Files

**Backend .env file:**
```bash
cd ../backend
cp .env.example .env
```

Now open `backend/.env` in any text editor and fill in:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fairtrade_supply_chain
JWT_SECRET=my_super_secret_key_12345
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=PASTE_YOUR_CONTRACT_ADDRESS_HERE
ADMIN_PRIVATE_KEY=PASTE_FIRST_GANACHE_ACCOUNT_PRIVATE_KEY_HERE
FRONTEND_URL=http://localhost:5173
```

**How to get the private key from Ganache:**
- Ganache GUI: Click the key icon next to the first account
- Ganache CLI: It prints private keys when it starts

**Frontend .env file:**
```bash
cd ../frontend
cp .env.example .env
```

Open `frontend/.env` and fill in:
```
VITE_API_URL=/api
VITE_CONTRACT_ADDRESS=PASTE_YOUR_CONTRACT_ADDRESS_HERE
```

Use the SAME contract address from Step 3.

### STEP 6: Start MongoDB

Open a NEW terminal window:

```bash
# If MongoDB is installed locally:
mongod

# If using MongoDB Atlas, just make sure MONGODB_URI in
# backend/.env points to your Atlas connection string
```

Keep this running.

### STEP 7: Start the Backend Server

Open a NEW terminal window:

```bash
cd fairtrade-dapp/backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost
Blockchain connection initialized
```

Keep this running.

### STEP 8: Start the Frontend

Open a NEW terminal window:

```bash
cd fairtrade-dapp/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

### STEP 9: Open in Browser

Go to: **http://localhost:5173**

---

### SUMMARY — You need 4 terminal windows running:

```
Terminal 1:  Ganache         (ganache --port 7545)
Terminal 2:  MongoDB         (mongod)
Terminal 3:  Backend         (cd backend && npm run dev)
Terminal 4:  Frontend        (cd frontend && npm run dev)
```

### QUICK RESTART COMMANDS (After First Setup)

If you close everything and want to restart next time:

```bash
# Terminal 1 — Start Ganache
ganache --port 7545

# Terminal 2 — Start MongoDB
mongod

# Terminal 3 — Start Backend
cd fairtrade-dapp/backend
npm run dev

# Terminal 4 — Start Frontend
cd fairtrade-dapp/frontend
npm run dev
```

**If you changed the smart contract code:**
```bash
cd fairtrade-dapp/blockchain
truffle compile
truffle migrate --reset --network development
# Then update .env files with the NEW contract address
# Then copy the new ABI (Step 4 above)
# Then restart the backend
```

### RUN SMART CONTRACT TESTS

```bash
cd fairtrade-dapp/blockchain
truffle test
```

This runs the unit tests in `test/SupplyChain.test.js` against Ganache.

---

## 5. HOW TO CONFIGURE METAMASK

After installing MetaMask in your browser:

### A. Add Ganache Network to MetaMask:
1. Open MetaMask
2. Click the network dropdown (top-left, says "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Fill in:
   - Network Name: **Ganache Local**
   - New RPC URL: **http://127.0.0.1:7545**
   - Chain ID: **1337**
   - Currency Symbol: **ETH**
5. Click Save
6. Switch to "Ganache Local" network

### B. Import a Ganache Test Account:
1. In Ganache, copy the **private key** of any account
2. In MetaMask, click your avatar → "Import Account"
3. Select "Private Key" and paste it
4. Click Import
5. You now have 100 test ETH in MetaMask

### C. Import Multiple Accounts (for testing):
- Import Account 1 as **Farmer**
- Import Account 2 as **Processor**
- Import Account 3 as **Exporter**
- Import Account 4 as **Retailer**
- Import Account 5 as **Admin**
- You can switch between them in MetaMask to test different roles

---

## 6. HOW TO USE THE APP

### First Time Setup:
1. Open http://localhost:5173
2. You see the Login page
3. Enter your name
4. Select "Admin" role
5. Click "Connect MetaMask"
6. MetaMask popup appears → Click "Connect"
7. You are now logged in as Admin

### Register as Farmer (to add products):
1. Switch MetaMask to a different account (Account 2)
2. Refresh the page or click Sign Out
3. Login again, this time select "Farmer" role

### Assign Roles via Admin (Blockchain-level):
- The Admin must assign roles on the blockchain too
- Go to Admin Panel → Users tab
- Change user roles via the dropdown
- This calls the smart contract's assignRole function

### Add a Product (as Farmer):
1. Login as Farmer
2. Click "Add Product" in the sidebar
3. Fill in: Batch ID, Product Name, Location, etc.
4. Click "Register Product"
5. MetaMask will ask to confirm the transaction → Confirm
6. Product is now on the blockchain + database

### Transfer Ownership:
1. Go to Products → Click on your product
2. Click "Transfer Ownership"
3. Paste the Processor's wallet address
4. Enter the sale price
5. Confirm in MetaMask
6. The product stage changes from Registered → Processed

### View as Consumer (QR Code):
- Each product has a QR code
- The QR links to `/track/{id}`
- This is a public page — no login needed
- Shows the full supply chain journey

---

## 7. DO's AND DON'Ts

### DO:
- Keep Ganache running while developing
- Keep MongoDB running while developing
- Always run `truffle compile` after editing .sol files
- Always run `truffle migrate --reset` after compile if the
  contract structure changed
- Update BOTH .env files if the contract address changes
- Copy the ABI to both backend and frontend after compiling
- Import multiple Ganache accounts into MetaMask for testing
- Assign roles via the Admin panel BEFORE trying to register products
- Use `npm run dev` (not `npm start`) for backend to get auto-reload

### DON'T:
- Don't close Ganache while the app is running
- Don't close MongoDB while the app is running
- Don't use real ETH or real money — this is a test environment
- Don't edit files in `blockchain/build/` — these are auto-generated
- Don't edit `node_modules/` folders — these are auto-generated
- Don't change the Solidity pragma version unless you also update
  truffle-config.js compiler version to match
- Don't deploy to Polygon mainnet without understanding gas costs
- Don't share your real private keys — Ganache keys are test-only
- Don't skip the ABI copy step — if frontend/backend have old ABI,
  blockchain calls will fail silently or throw confusing errors
- Don't edit `Migrations.sol` — Truffle needs it exactly as-is
- Don't use `truffle migrate` (without --reset) if you changed the
  contract — it will skip redeployment and your changes won't apply

---

## 8. TROUBLESHOOTING COMMON ERRORS

### "Error: Cannot find module"
→ You forgot to run `npm install`. Run it inside the folder that
  has the error (blockchain/, backend/, or frontend/).

### "MongoServerError: connect ECONNREFUSED"
→ MongoDB is not running. Open a new terminal and run `mongod`.

### "Error: could not detect network"
→ Ganache is not running. Start Ganache first.

### "MetaMask - RPC Error: execution reverted"
→ Usually means the smart contract rejected the transaction.
  Check if:
  - The user has the correct role (Farmer for register, etc.)
  - The product exists (correct ID)
  - The user is the current owner (for transfers)
  - The stage transition is valid (can't skip stages)

### "CORS error" in browser console
→ Make sure FRONTEND_URL in backend/.env matches the frontend URL
  (http://localhost:5173)

### "Error: Returned values aren't valid, did it run Out of Gas?"
→ The ABI is outdated. Re-run the ABI copy step (Step 4).

### "Contract has not been deployed to detected network"
→ MetaMask is on the wrong network. Switch to Ganache Local
  (Chain ID 1337, RPC http://127.0.0.1:7545).

### "truffle migrate" says "Network up to date"
→ Use `truffle migrate --reset` to force redeployment.

### Frontend shows blank page
→ Check the browser console (F12) for errors.
  Common fix: Make sure backend is running on port 5000.

### "Nonce too high" in MetaMask
→ When you restart Ganache, MetaMask gets confused.
  Fix: MetaMask → Settings → Advanced → Clear activity tab data.

---

## 9. API ENDPOINTS REFERENCE

Base URL: http://localhost:5000/api

### Authentication
| Method | Endpoint            | Auth? | Description                 |
|--------|---------------------|-------|-----------------------------|
| POST   | /auth/login         | No    | Login with wallet address   |
| GET    | /auth/me            | Yes   | Get current user info       |
| PUT    | /auth/profile       | Yes   | Update profile details      |

### Products
| Method | Endpoint                | Auth? | Description                |
|--------|-------------------------|-------|----------------------------|
| POST   | /products               | Yes   | Register product (farmer)  |
| GET    | /products               | No    | List all products          |
| GET    | /products/my            | Yes   | My products                |
| GET    | /products/:id           | No    | Get product by ID          |
| GET    | /products/:id/history   | No    | Supply chain history       |
| GET    | /products/:id/qr        | No    | Get QR code                |
| PUT    | /products/:id/transfer  | Yes   | Transfer ownership         |

### Transactions
| Method | Endpoint                | Auth? | Description                |
|--------|-------------------------|-------|----------------------------|
| GET    | /transactions           | No    | All transactions           |
| GET    | /transactions/my        | Yes   | My transactions            |
| GET    | /transactions/:txHash   | No    | Get by transaction hash    |

### Admin
| Method | Endpoint                         | Auth?  | Description            |
|--------|----------------------------------|--------|------------------------|
| GET    | /admin/stats                     | Admin  | Dashboard statistics   |
| GET    | /admin/users                     | Admin  | List all users         |
| PUT    | /admin/users/:address/role       | Admin  | Change user role       |

---

## 10. SMART CONTRACT REFERENCE

Contract: `blockchain/contracts/SupplyChain.sol`

### Enums
```
Stage:  Registered(0), Processed(1), Exported(2), Retailed(3), Sold(4)
Role:   None(0), Farmer(1), Processor(2), Exporter(3), Retailer(4), Admin(5)
```

### Key Functions
| Function              | Who Can Call | What It Does                        |
|-----------------------|-------------|--------------------------------------|
| assignRole()          | Admin only  | Give a wallet address a role         |
| registerProduct()     | Farmer only | Create a new product on blockchain   |
| transferOwnership()   | Owner only  | Transfer product to next participant |
| getProduct()          | Anyone      | Read product details                 |
| getProductTransactions()| Anyone    | Read product's transaction history   |
| getProducts()         | Anyone      | List products (paginated)            |
| getRole()             | Anyone      | Check a user's role                  |

### Valid Stage Transitions
```
Registered  →  Processed   (Farmer sells to Processor)
Processed   →  Exported    (Processor sells to Exporter)
Exported    →  Retailed    (Exporter sells to Retailer)
Retailed    →  Sold        (Retailer sells to market)
```

You CANNOT skip stages. The contract will reject invalid transitions.

---

## GOOD LUCK WITH YOUR DISSERTATION!

If something doesn't work, re-read the troubleshooting section above.
Most errors come from:
1. Forgetting to start Ganache or MongoDB
2. Wrong contract address in .env files
3. Outdated ABI files
4. Wrong MetaMask network
