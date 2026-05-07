module.exports = {
  networks: {
    // Local Ganache development
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777", // Match any network id
    },

    // Ganache CLI
    ganache_cli: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
    },

    // Polygon Mumbai Testnet (for testing before mainnet)
    polygon_mumbai: {
      // provider: () => new HDWalletProvider(
      //   process.env.MNEMONIC,
      //   `https://rpc-mumbai.maticvigil.com`
      // ),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 10000000000,
    },

    // Polygon Mainnet (final deployment)
    polygon_mainnet: {
      // provider: () => new HDWalletProvider(
      //   process.env.MNEMONIC,
      //   `https://polygon-rpc.com`
      // ),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 50000000000,
    },
  },

  // Compiler configuration
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "paris",
      },
    },
  },

  // Plugin configuration
  plugins: [],

  // Mocha test configuration
  mocha: {
    timeout: 100000,
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      gasPrice: 30,
      showTimeSpent: true,
      excludeContracts: ["Migrations"],
      noColors: true,
      outputFile: "gas-report.txt",
    },
  },
};
