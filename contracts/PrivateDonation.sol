// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Private Donation Platform using FHEVM
/// @author ZamaLink
/// @notice A privacy-preserving donation platform where donation amounts are encrypted
contract PrivateDonation is SepoliaConfig, ReentrancyGuard, Pausable, Ownable {
    struct Creator {
        address wallet;
        string name;
        string description;
        euint64 totalDonations; // Encrypted total donations
        euint32 donationCount;   // Encrypted donation count
        bool isRegistered;
    }

    struct Donation {
        address donor;
        bytes32 creatorId;
        euint64 amount; // Encrypted donation amount
        uint256 timestamp;
    }

    mapping(bytes32 => Creator) public creators;
    mapping(bytes32 => Donation[]) public creatorDonations;
    mapping(address => bytes32[]) public donorDonations;
    mapping(address => mapping(bytes32 => bool)) public hasDonatedTo;
    
    bytes32[] public allCreators;
    
    // Decryption state for amount verification
    mapping(uint256 => PendingDonation) public pendingDonations;
    uint256 public nextRequestId;
    
    struct PendingDonation {
        address donor;
        bytes32 creatorId;
        uint256 ethAmount;
        euint64 encryptedAmount;
        bool isActive;
    }

    event CreatorRegistered(bytes32 indexed creatorId, address indexed wallet, string name);
    event DonationMade(bytes32 indexed creatorId, address indexed donor, uint256 timestamp);
    event CreatorUpdated(bytes32 indexed creatorId, string name, string description);
    event DonationVerificationRequested(uint256 indexed requestId, bytes32 indexed creatorId, address indexed donor);
    event DonationVerified(uint256 indexed requestId, bytes32 indexed creatorId, address indexed donor, bool success);

    modifier onlyRegisteredCreator(bytes32 creatorId) {
        require(creators[creatorId].isRegistered, "Creator not registered");
        _;
    }

    modifier onlyCreatorOwner(bytes32 creatorId) {
        require(creators[creatorId].wallet == msg.sender, "Not creator owner");
        _;
    }
    
    constructor() Ownable(msg.sender) {}

    /// @notice Register a new creator
    /// @param creatorId Unique identifier for the creator
    /// @param name Creator's display name
    /// @param description Creator's description
    function registerCreator(
        bytes32 creatorId,
        string calldata name,
        string calldata description
    ) external {
        require(!creators[creatorId].isRegistered, "Creator already registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        euint64 initialDonations = FHE.asEuint64(0);
        euint32 initialCount = FHE.asEuint32(0);
        
        // Set ACL permissions for the creator to access their encrypted data
        FHE.allow(initialDonations, msg.sender);
        FHE.allow(initialCount, msg.sender);
        FHE.allowThis(initialDonations);
        FHE.allowThis(initialCount);
        
        creators[creatorId] = Creator({
            wallet: msg.sender,
            name: name,
            description: description,
            totalDonations: initialDonations,
            donationCount: initialCount,
            isRegistered: true
        });

        allCreators.push(creatorId);

        emit CreatorRegistered(creatorId, msg.sender, name);
    }

    /// @notice Update creator information
    /// @param creatorId Creator's unique identifier
    /// @param name New display name
    /// @param description New description
    function updateCreator(
        bytes32 creatorId,
        string calldata name,
        string calldata description
    ) external onlyRegisteredCreator(creatorId) onlyCreatorOwner(creatorId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        
        creators[creatorId].name = name;
        creators[creatorId].description = description;

        emit CreatorUpdated(creatorId, name, description);
    }

    /// @notice Make an encrypted donation to a creator with amount verification
    /// @param creatorId Target creator's ID
    /// @param encryptedAmount Encrypted donation amount in wei
    /// @param inputProof Proof for the encrypted input
    function donate(
        bytes32 creatorId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external payable onlyRegisteredCreator(creatorId) nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH with donation");
        require(msg.value <= 10 ether, "Donation too large"); // Reasonable cap

        // Validate and convert external encrypted input
        euint64 donationAmount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Store pending donation for verification
        uint256 requestId = nextRequestId++;
        pendingDonations[requestId] = PendingDonation({
            donor: msg.sender,
            creatorId: creatorId,
            ethAmount: msg.value,
            encryptedAmount: donationAmount,
            isActive: true
        });
        
        // Request decryption to verify encrypted amount matches ETH sent
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(donationAmount);
        FHE.requestDecryption(cts, this.verifyDonationCallback.selector, requestId);
        
        emit DonationVerificationRequested(requestId, creatorId, msg.sender);
    }
    
    /// @notice Callback function for donation amount verification
    /// @param requestId The request ID for verification
    /// @param decryptedAmount The decrypted donation amount
    /// @param signatures Cryptographic signatures for verification
    function verifyDonationCallback(
        uint256 requestId,
        uint64 decryptedAmount,
        bytes[] memory signatures
    ) public {
        require(pendingDonations[requestId].isActive, "Invalid or processed request");
        
        // Verify the signatures
        FHE.checkSignatures(requestId, signatures);
        
        PendingDonation memory pending = pendingDonations[requestId];
        bool verificationSuccess = (decryptedAmount == pending.ethAmount);
        
        if (verificationSuccess) {
            _processDonation(requestId, pending);
        } else {
            // Refund if verification fails
            _refundDonation(requestId, pending);
        }
        
        // Clean up
        delete pendingDonations[requestId];
        emit DonationVerified(requestId, pending.creatorId, pending.donor, verificationSuccess);
    }
    
    /// @notice Internal function to process verified donation
    function _processDonation(uint256 /* requestId */, PendingDonation memory pending) internal {
        // Update creator's encrypted totals
        creators[pending.creatorId].totalDonations = FHE.add(
            creators[pending.creatorId].totalDonations, 
            pending.encryptedAmount
        );
        creators[pending.creatorId].donationCount = FHE.add(
            creators[pending.creatorId].donationCount, 
            FHE.asEuint32(1)
        );

        // Store donation record
        Donation memory newDonation = Donation({
            donor: pending.donor,
            creatorId: pending.creatorId,
            amount: pending.encryptedAmount,
            timestamp: block.timestamp
        });

        creatorDonations[pending.creatorId].push(newDonation);
        donorDonations[pending.donor].push(pending.creatorId);
        hasDonatedTo[pending.donor][pending.creatorId] = true;

        // Set ACL permissions for donor to access their donation
        FHE.allow(pending.encryptedAmount, pending.donor);

        // Transfer ETH to creator using call for better security
        (bool success, ) = payable(creators[pending.creatorId].wallet).call{value: pending.ethAmount}("");
        require(success, "Transfer failed");

        emit DonationMade(pending.creatorId, pending.donor, block.timestamp);
    }
    
    /// @notice Internal function to refund failed donation
    function _refundDonation(uint256 /* requestId */, PendingDonation memory pending) internal {
        (bool success, ) = payable(pending.donor).call{value: pending.ethAmount}("");
        require(success, "Refund failed");
    }

    /// @notice Get creator's encrypted total donations (only accessible by creator)
    /// @param creatorId Creator's unique identifier
    /// @return Encrypted total donations
    function getCreatorTotalDonations(bytes32 creatorId) 
        external 
        view 
        onlyRegisteredCreator(creatorId) 
        returns (euint64) 
    {
        return creators[creatorId].totalDonations;
    }

    /// @notice Get creator's encrypted donation count (only accessible by creator)
    /// @param creatorId Creator's unique identifier
    /// @return Encrypted donation count
    function getCreatorDonationCount(bytes32 creatorId) 
        external 
        view 
        onlyRegisteredCreator(creatorId) 
        returns (euint32) 
    {
        return creators[creatorId].donationCount;
    }

    /// @notice Get creator's public information
    /// @param creatorId Creator's unique identifier
    /// @return wallet Creator's wallet address
    /// @return name Creator's name
    /// @return description Creator's description
    /// @return isRegistered Registration status
    function getCreatorInfo(bytes32 creatorId) 
        external 
        view 
        returns (
            address wallet,
            string memory name,
            string memory description,
            bool isRegistered
        ) 
    {
        Creator memory creator = creators[creatorId];
        return (creator.wallet, creator.name, creator.description, creator.isRegistered);
    }

    /// @notice Get all registered creator IDs
    /// @return Array of creator IDs
    function getAllCreators() external view returns (bytes32[] memory) {
        return allCreators;
    }
    
    /// @notice Get total number of creators
    /// @return Total creators count
    function getTotalCreatorsCount() external view returns (uint256) {
        return allCreators.length;
    }

    /// @notice Get number of donations for a creator (public count, not encrypted)
    /// @param creatorId Creator's unique identifier
    /// @return Number of donations received
    function getPublicDonationCount(bytes32 creatorId) 
        external 
        view 
        onlyRegisteredCreator(creatorId) 
        returns (uint256) 
    {
        return creatorDonations[creatorId].length;
    }

    /// @notice Get donor's donation history (only accessible by donor or owner)
    /// @param donor Donor's address
    /// @return Array of creator IDs the donor has supported
    function getDonorHistory(address donor) external view returns (bytes32[] memory) {
        require(msg.sender == donor || msg.sender == owner(), "Unauthorized access");
        return donorDonations[donor];
    }

    /// @notice Check if an address has donated to a specific creator (optimized)
    /// @param donor Donor's address
    /// @param creatorId Creator's unique identifier
    /// @return True if donor has donated to creator
    function hasDonated(address donor, bytes32 creatorId) external view returns (bool) {
        return hasDonatedTo[donor][creatorId];
    }

    /// @notice Emergency function to update creator wallet (only by current owner)
    /// @param creatorId Creator's unique identifier  
    /// @param newWallet New wallet address
    function updateCreatorWallet(bytes32 creatorId, address newWallet) 
        external 
        onlyRegisteredCreator(creatorId) 
        onlyCreatorOwner(creatorId) 
    {
        require(newWallet != address(0), "Invalid wallet address");
        // address oldWallet = creators[creatorId].wallet; // Unused for now
        creators[creatorId].wallet = newWallet;
        
        // Update ACL permissions for new wallet
        FHE.allow(creators[creatorId].totalDonations, newWallet);
        FHE.allow(creators[creatorId].donationCount, newWallet);
    }
    
    /// @notice Emergency pause function (only owner)
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Emergency unpause function (only owner)
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Emergency withdrawal for stuck funds (only owner)
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
}
