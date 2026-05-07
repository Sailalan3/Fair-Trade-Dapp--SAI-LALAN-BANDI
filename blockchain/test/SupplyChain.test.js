const SupplyChain = artifacts.require("SupplyChain");

contract("SupplyChain", (accounts) => {
  const [admin, farmer, processor, exporter, retailer] = accounts;

  let instance;

  beforeEach(async () => {
    instance = await SupplyChain.new({ from: admin });
  });

  describe("Deployment", () => {
    it("should set the deployer as admin", async () => {
      const contractAdmin = await instance.admin();
      assert.equal(contractAdmin, admin, "Admin should be the deployer");
    });

    it("should assign Admin role to deployer", async () => {
      const role = await instance.getRole(admin);
      assert.equal(role.toNumber(), 5, "Deployer should have Admin role (5)");
    });
  });

  describe("Role Management", () => {
    it("admin can assign roles", async () => {
      await instance.assignRole(farmer, 1, { from: admin }); // Farmer
      const role = await instance.getRole(farmer);
      assert.equal(role.toNumber(), 1, "Should be Farmer role");
    });

    it("non-admin cannot assign roles", async () => {
      try {
        await instance.assignRole(farmer, 1, { from: processor });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Only admin"), "Expected admin error");
      }
    });
  });

  describe("Product Registration", () => {
    beforeEach(async () => {
      await instance.assignRole(farmer, 1, { from: admin });
    });

    it("farmer can register a product", async () => {
      // Step 1: Register core product data
      const result = await instance.registerProduct(
        "BATCH-001",
        "Coffee Beans",
        100,
        120,
        { from: farmer }
      );

      // Step 2: Set product details (metadata)
      await instance.setProductDetails(
        1,
        "John Doe",
        "Ethiopia",
        "2024-03-15",
        "Fair Trade",
        { from: farmer }
      );

      const product = await instance.getProduct(1);
      assert.equal(product.productName, "Coffee Beans");
      assert.equal(product.currentOwner, farmer);
      assert.equal(Number(product.currentStage), 0); // Registered

      const details = await instance.getProductDetails(1);
      assert.equal(details.farmerName, "John Doe");
      assert.equal(details.farmLocation, "Ethiopia");
      assert.equal(details.certification, "Fair Trade");
    });

    it("non-farmer cannot register a product", async () => {
      try {
        await instance.registerProduct(
          "BATCH-002", "Tea", 50, 80,
          { from: processor }
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Unauthorized"), "Expected role error");
      }
    });
  });

  describe("Ownership Transfer", () => {
    beforeEach(async () => {
      await instance.assignRole(farmer, 1, { from: admin });
      await instance.assignRole(processor, 2, { from: admin });
      await instance.assignRole(exporter, 3, { from: admin });
      await instance.assignRole(retailer, 4, { from: admin });

      await instance.registerProduct(
        "BATCH-001", "Coffee Beans", 100, 120,
        { from: farmer }
      );

      await instance.setProductDetails(
        1, "John Doe", "Ethiopia", "2024-03-15", "Fair Trade",
        { from: farmer }
      );
    });

    it("farmer can transfer to processor", async () => {
      await instance.transferOwnership(1, processor, 150, { from: farmer });
      const product = await instance.getProduct(1);
      assert.equal(product.currentOwner, processor);
      assert.equal(Number(product.currentStage), 1); // Processed
    });

    it("tracks full supply chain journey", async () => {
      await instance.transferOwnership(1, processor, 150, { from: farmer });
      await instance.transferOwnership(1, exporter, 200, { from: processor });
      await instance.transferOwnership(1, retailer, 250, { from: exporter });

      const product = await instance.getProduct(1);
      assert.equal(Number(product.currentStage), 3); // Retailed

      const txs = await instance.getProductTransactions(1);
      assert.equal(txs.length, 3, "Should have 3 transactions");
    });

    it("prevents invalid stage transitions", async () => {
      try {
        // Farmer trying to sell directly to exporter (should fail)
        await instance.transferOwnership(1, exporter, 200, { from: farmer });
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Invalid stage"), "Expected stage error");
      }
    });

    it("prevents non-owner from transferring", async () => {
      try {
        await instance.transferOwnership(1, processor, 150, { from: processor });
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Not the owner"), "Expected owner error");
      }
    });

    it("prevents transfer to zero address", async () => {
      try {
        await instance.transferOwnership(1, "0x0000000000000000000000000000000000000000", 150, { from: farmer });
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Invalid buyer address"), "Expected invalid buyer error");
      }
    });

    it("emits OwnershipTransferred event on transfer", async () => {
      const result = await instance.transferOwnership(1, processor, 150, { from: farmer });
      const event = result.logs.find(l => l.event === "OwnershipTransferred");
      assert(event, "OwnershipTransferred event should be emitted");
      assert.equal(event.args.productId.toString(), "1");
      assert.equal(event.args.seller, farmer);
      assert.equal(event.args.buyer, processor);
    });
  });

  describe("Edge Cases and Validation", () => {
    beforeEach(async () => {
      await instance.assignRole(farmer, 1, { from: admin });
    });

    it("admin cannot assign None role to user", async () => {
      try {
        await instance.assignRole(farmer, 0, { from: admin }); // Role.None = 0
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Cannot assign None role"), "Expected None role error");
      }
    });

    it("admin cannot assign role to zero address", async () => {
      try {
        await instance.assignRole("0x0000000000000000000000000000000000000000", 1, { from: admin });
        assert.fail("Should have thrown");
      } catch (error) {
        assert(error.message.includes("Invalid address"), "Expected invalid address error");
      }
    });
  });
});
