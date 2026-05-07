import { ethers } from "ethers";
import SupplyChainABI from "../config/SupplyChainABI.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// Strict mode: every write requires a connected wallet, valid contract,
// and a successful on-chain transaction. No simulated calls.
export const isWalletReady = async () => {
  if (!window.ethereum) return false;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return Array.isArray(accounts) && accounts.length > 0;
  } catch {
    return false;
  }
};

const requireWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to register on the blockchain.");
  }
  const ready = await isWalletReady();
  if (!ready) {
    throw new Error("Please connect your wallet (MetaMask) before registering a product on the blockchain.");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("Smart contract address is not configured. Set VITE_CONTRACT_ADDRESS in frontend/.env.");
  }
};

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  throw new Error("MetaMask not installed");
};

export const getSigner = () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const getContract = (signerOrProvider) => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, SupplyChainABI, signerOrProvider);
};

export const getSignedContract = () => {
  const signer = getSigner();
  return getContract(signer);
};

export const getReadContract = () => {
  const provider = getProvider();
  return getContract(provider);
};

// Connect MetaMask wallet — always prompts the user for confirmation,
// even if the site was previously connected.
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to use this DApp");
  }

  try {
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (err) {
    if (err?.code === 4001) {
      throw new Error("Connection request was rejected in MetaMask.");
    }
    throw err;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  if (!accounts?.length) throw new Error("No account selected in MetaMask.");
  return accounts[0];
};

// Get current connected account
export const getCurrentAccount = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};

// Register product on blockchain (two-step: core data + details)
export const registerProductOnChain = async (
  batchId,
  productName,
  farmerName,
  farmLocation,
  harvestDate,
  certification,
  quantity,
  initialPrice
) => {
  await requireWallet();
  const contract = getSignedContract();

  // Step 1: Register core product data
  const tx1 = await contract.registerProduct(
    batchId,
    productName,
    quantity,
    initialPrice
  );
  const receipt1 = await tx1.wait();

  // Extract product ID from event
  const event = receipt1.events?.find((e) => e.event === "ProductRegistered");
  if (!event) throw new Error("ProductRegistered event not found in transaction receipt");
  const productId = event.args.productId.toNumber();

  // Step 2: Set product details (farm metadata)
  const tx2 = await contract.setProductDetails(
    productId,
    farmerName,
    farmLocation,
    harvestDate,
    certification
  );
  await tx2.wait();

  return { productId, txHash: receipt1.transactionHash };
};

// Transfer ownership on blockchain
export const transferOwnershipOnChain = async (productId, buyerAddress, price) => {
  await requireWallet();
  const contract = getSignedContract();
  const tx = await contract.transferOwnership(productId, buyerAddress, price);
  const receipt = await tx.wait();

  return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber };
};

// Read product from blockchain
export const getProductFromChain = async (productId) => {
  const contract = getReadContract();
  return await contract.getProduct(productId);
};

// Read product transactions from blockchain
export const getProductTransactionsFromChain = async (productId) => {
  const contract = getReadContract();
  return await contract.getProductTransactions(productId);
};

// Assign role (admin only)
export const assignRoleOnChain = async (userAddress, role) => {
  await requireWallet();
  const contract = getSignedContract();
  const tx = await contract.assignRole(userAddress, role);
  await tx.wait();
  return tx.hash;
};

// Stage name mapping
export const STAGE_NAMES = ["Registered", "Processed", "Exported", "Retailed", "Sold"];
export const ROLE_NAMES = ["None", "Farmer", "Processor", "Exporter", "Retailer", "Admin"];
export const ROLE_MAP = {
  farmer: 1,
  processor: 2,
  exporter: 3,
  retailer: 4,
  admin: 5,
};
