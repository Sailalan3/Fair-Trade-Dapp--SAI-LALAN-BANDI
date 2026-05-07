const { ethers } = require("ethers");
const SupplyChainABI = require("./SupplyChainABI.json");

let provider;
let contract;
let adminWallet;

const initBlockchain = () => {
  try {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:7545"
    );

    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress || contractAddress === "0x2A2E32BBfF4241C14D5917cd4bfE96a5942762d7") {
      console.warn("WARNING: Contract address not set. Update .env after deploying.");
      return;
    }

    contract = new ethers.Contract(contractAddress, SupplyChainABI, provider);

    if (process.env.ADMIN_PRIVATE_KEY && process.env.ADMIN_PRIVATE_KEY !== "0xb1dc75252b20eae91a84d93b1b425d85d8fc5aaa4e62bd0b744ba97d7faf635c") {
      adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    }

    console.log("Blockchain connection initialized");
  } catch (error) {
    console.error("Blockchain init error:", error.message);
  }
};

const getProvider = () => provider;
const getContract = () => contract;
const getAdminWallet = () => adminWallet;

const getSignedContract = (privateKey) => {
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, SupplyChainABI, wallet);
};

module.exports = {
  initBlockchain,
  getProvider,
  getContract,
  getAdminWallet,
  getSignedContract,
};
