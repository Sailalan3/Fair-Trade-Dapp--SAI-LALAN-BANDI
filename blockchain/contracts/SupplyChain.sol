// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    enum Stage { Registered, Processed, Exported, Retailed, Sold }
    enum Role { None, Farmer, Processor, Exporter, Retailer, Admin }

    struct Product {
        uint256 id;
        string batchId;
        string productName;
        address currentOwner;
        address farmer;
        Stage currentStage;
        uint256 initialPrice;
        uint256 quantity;
        uint256 createdAt;
        bool exists;
    }

    struct ProductDetails {
        string farmerName;
        string farmLocation;
        string harvestDate;
        string certification;
    }

    struct SupplyChainTx {
        uint256 productId;
        address seller;
        address buyer;
        uint256 price;
        Stage fromStage;
        Stage toStage;
        uint256 timestamp;
    }

    address public admin;
    uint256 public productCount;
    uint256 public transactionCount;

    mapping(uint256 => Product) public products;
    mapping(uint256 => ProductDetails) public productDetails;
    mapping(uint256 => SupplyChainTx) public supplyChainTxs;
    mapping(uint256 => uint256[]) public productTransactions;
    mapping(address => Role) public userRoles;
    mapping(address => uint256[]) public userProducts;

    event ProductRegistered(uint256 indexed productId, string batchId, address indexed farmer, uint256 timestamp);
    event OwnershipTransferred(uint256 indexed productId, address indexed seller, address indexed buyer, uint256 price, uint8 toStage, uint256 timestamp);
    event RoleAssigned(address indexed user, Role role);

    modifier onlyAdmin() { require(msg.sender == admin, "Only admin"); _; }
    modifier onlyRole(Role _role) { require(userRoles[msg.sender] == _role, "Unauthorized role"); _; }
    modifier productExists(uint256 _id) { require(products[_id].exists, "Product does not exist"); _; }
    modifier onlyOwner(uint256 _id) { require(products[_id].currentOwner == msg.sender, "Not the owner"); _; }

    constructor() {
        admin = msg.sender;
        userRoles[msg.sender] = Role.Admin;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    function assignRole(address _user, Role _role) external onlyAdmin {
        require(_user != address(0), "Invalid address");
        require(_role != Role.None, "Cannot assign None role");
        userRoles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    function getRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }

    function registerProduct(
        string calldata _batchId,
        string calldata _productName,
        uint256 _quantity,
        uint256 _initialPrice
    ) external onlyRole(Role.Farmer) returns (uint256) {
        productCount++;
        uint256 newId = productCount;
        products[newId] = Product({
            id: newId,
            batchId: _batchId,
            productName: _productName,
            currentOwner: msg.sender,
            farmer: msg.sender,
            currentStage: Stage.Registered,
            initialPrice: _initialPrice,
            quantity: _quantity,
            createdAt: block.timestamp,
            exists: true
        });
        userProducts[msg.sender].push(newId);
        emit ProductRegistered(newId, _batchId, msg.sender, block.timestamp);
        return newId;
    }

    function setProductDetails(
        uint256 _productId,
        string calldata _farmerName,
        string calldata _farmLocation,
        string calldata _harvestDate,
        string calldata _certification
    ) external productExists(_productId) {
        require(products[_productId].farmer == msg.sender, "Not the farmer");
        productDetails[_productId] = ProductDetails({
            farmerName: _farmerName,
            farmLocation: _farmLocation,
            harvestDate: _harvestDate,
            certification: _certification
        });
    }

    function transferOwnership(
        uint256 _productId,
        address _buyer,
        uint256 _price
    ) external productExists(_productId) onlyOwner(_productId) {
        require(_buyer != address(0), "Invalid buyer address");
        Product storage product = products[_productId];
        Stage nextStage = _getNextStage(product.currentStage, userRoles[_buyer]);
        transactionCount++;
        supplyChainTxs[transactionCount] = SupplyChainTx({
            productId: _productId,
            seller: msg.sender,
            buyer: _buyer,
            price: _price,
            fromStage: product.currentStage,
            toStage: nextStage,
            timestamp: block.timestamp
        });
        productTransactions[_productId].push(transactionCount);
        product.currentOwner = _buyer;
        product.currentStage = nextStage;
        userProducts[_buyer].push(_productId);
        emit OwnershipTransferred(_productId, msg.sender, _buyer, _price, uint8(nextStage), block.timestamp);
    }

    function _getNextStage(Stage _current, Role _buyerRole) internal pure returns (Stage) {
        if (_current == Stage.Registered && _buyerRole == Role.Processor) return Stage.Processed;
        if (_current == Stage.Processed && _buyerRole == Role.Exporter) return Stage.Exported;
        if (_current == Stage.Exported && _buyerRole == Role.Retailer) return Stage.Retailed;
        if (_current == Stage.Retailed) return Stage.Sold;
        revert("Invalid stage transition");
    }

    function getProduct(uint256 _id) external view productExists(_id) returns (Product memory) {
        return products[_id];
    }

    function getProductDetails(uint256 _id) external view productExists(_id) returns (ProductDetails memory) {
        return productDetails[_id];
    }

    function getProductTransactions(uint256 _id) external view productExists(_id) returns (SupplyChainTx[] memory) {
        uint256[] memory txIds = productTransactions[_id];
        SupplyChainTx[] memory txs = new SupplyChainTx[](txIds.length);
        for (uint256 i = 0; i < txIds.length; i++) {
            txs[i] = supplyChainTxs[txIds[i]];
        }
        return txs;
    }

    function getUserProducts(address _user) external view returns (uint256[] memory) {
        return userProducts[_user];
    }

    function getProductCount() external view returns (uint256) { return productCount; }
    function getTransactionCount() external view returns (uint256) { return transactionCount; }

    function getProducts(uint256 _start, uint256 _limit) external view returns (Product[] memory) {
        uint256 end = _start + _limit;
        if (end > productCount) end = productCount;
        uint256 count = end >= _start ? end - _start : 0;
        Product[] memory result = new Product[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = products[_start + i + 1];
        }
        return result;
    }
}
