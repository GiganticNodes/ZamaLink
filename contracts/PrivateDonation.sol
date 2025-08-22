// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Private Campaign Donation Platform using FHEVM
/// @author ZamaLink
/// @notice A privacy-preserving campaign donation platform like Kitabisa.com but with encrypted amounts
contract PrivateCampaignDonation is SepoliaConfig, ReentrancyGuard, Pausable, Ownable {
    struct Campaign {
        bytes32 id;
        address organizer;
        string title;
        string description;
        string imageUrl;
        uint256 targetAmount; // Target amount in wei (public)
        uint256 deadline; // Campaign deadline timestamp
        euint64 totalDonations; // Encrypted total donations (for privacy)
        euint32 donationCount;   // Encrypted donation count (for privacy)
        uint256 publicDonatorCount; // Public count for social proof
        bool isActive;
        bool isCompleted;
        bool finalAmountRevealed;
        uint256 revealedFinalAmount; // Only set if organizer reveals at end
        CampaignCategory category;
    }
    
    enum CampaignCategory {
        DISASTER_RELIEF,
        MEDICAL,
        EDUCATION,
        ENVIRONMENT,
        SOCIAL,
        EMERGENCY,
        OTHER
    }

    struct Donation {
        address donor;
        bytes32 campaignId;
        euint64 amount; // Encrypted donation amount
        uint256 timestamp;
        bool isAnonymous;
    }

    mapping(bytes32 => Campaign) public campaigns;
    mapping(bytes32 => Donation[]) public campaignDonations;
    mapping(address => bytes32[]) public donorDonations;
    mapping(address => mapping(bytes32 => bool)) public hasDonatedTo;
    mapping(address => bytes32[]) public organizerCampaigns;
    
    bytes32[] public allCampaigns;
    bytes32[] public activeCampaigns;
    
    // Milestone system for progress indication
    mapping(bytes32 => uint256[]) public campaignMilestones; // [25%, 50%, 75%, 100%] of target
    mapping(bytes32 => mapping(uint256 => bool)) public milestoneReached;
    
    // Decryption state for amount verification
    mapping(uint256 => PendingDonation) public pendingDonations;
    uint256 public nextRequestId;
    
    struct PendingDonation {
        address donor;
        bytes32 campaignId;
        uint256 ethAmount;
        euint64 encryptedAmount;
        bool isActive;
        bool isAnonymous;
    }

    event CampaignCreated(bytes32 indexed campaignId, address indexed organizer, string title, uint256 targetAmount, uint256 deadline);
    event DonationMade(bytes32 indexed campaignId, address indexed donor, uint256 timestamp, bool isAnonymous);
    event CampaignUpdated(bytes32 indexed campaignId, string title, string description);
    event CampaignCompleted(bytes32 indexed campaignId, uint256 timestamp);
    event CampaignDeadlineReached(bytes32 indexed campaignId, uint256 timestamp);
    event MilestoneReached(bytes32 indexed campaignId, uint256 milestone);
    event FinalAmountRevealed(bytes32 indexed campaignId, uint256 finalAmount);
    event DonationVerificationRequested(uint256 indexed requestId, bytes32 indexed campaignId, address indexed donor);
    event DonationVerified(uint256 indexed requestId, bytes32 indexed campaignId, address indexed donor, bool success);

    modifier onlyActiveCampaign(bytes32 campaignId) {
        require(campaigns[campaignId].isActive, "Campaign not active");
        require(block.timestamp < campaigns[campaignId].deadline, "Campaign deadline passed");
        _;
    }

    modifier onlyCampaignOrganizer(bytes32 campaignId) {
        require(campaigns[campaignId].organizer == msg.sender, "Not campaign organizer");
        _;
    }

    modifier validCampaign(bytes32 campaignId) {
        require(campaigns[campaignId].organizer != address(0), "Campaign does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {}

    /// @notice Create a new fundraising campaign
    /// @param campaignId Unique identifier for the campaign
    /// @param title Campaign title
    /// @param description Campaign description
    /// @param imageUrl Campaign image URL
    /// @param targetAmount Target amount in wei
    /// @param duration Campaign duration in seconds
    /// @param category Campaign category
    function createCampaign(
        bytes32 campaignId,
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        uint256 targetAmount,
        uint256 duration,
        CampaignCategory category
    ) external {
        require(campaigns[campaignId].organizer == address(0), "Campaign ID already exists");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 deadline = block.timestamp + duration;
        
        euint64 initialDonations = FHE.asEuint64(0);
        euint32 initialCount = FHE.asEuint32(0);
        
        // Set ACL permissions for the organizer to access their encrypted data
        FHE.allow(initialDonations, msg.sender);
        FHE.allow(initialCount, msg.sender);
        FHE.allowThis(initialDonations);
        FHE.allowThis(initialCount);
        
        campaigns[campaignId] = Campaign({
            id: campaignId,
            organizer: msg.sender,
            title: title,
            description: description,
            imageUrl: imageUrl,
            targetAmount: targetAmount,
            deadline: deadline,
            totalDonations: initialDonations,
            donationCount: initialCount,
            publicDonatorCount: 0,
            isActive: true,
            isCompleted: false,
            finalAmountRevealed: false,
            revealedFinalAmount: 0,
            category: category
        });
        
        // Set up milestones (25%, 50%, 75%, 100%)
        uint256[] memory milestones = new uint256[](4);
        milestones[0] = targetAmount * 25 / 100;
        milestones[1] = targetAmount * 50 / 100;
        milestones[2] = targetAmount * 75 / 100;
        milestones[3] = targetAmount;
        campaignMilestones[campaignId] = milestones;
        
        allCampaigns.push(campaignId);
        activeCampaigns.push(campaignId);
        organizerCampaigns[msg.sender].push(campaignId);
        
        emit CampaignCreated(campaignId, msg.sender, title, targetAmount, deadline);
    }

    /// @notice Update campaign information (only by organizer)
    /// @param campaignId Campaign's unique identifier
    /// @param title New campaign title
    /// @param description New campaign description
    /// @param imageUrl New image URL
    function updateCampaign(
        bytes32 campaignId,
        string calldata title,
        string calldata description,
        string calldata imageUrl
    ) external validCampaign(campaignId) onlyCampaignOrganizer(campaignId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(campaigns[campaignId].isActive, "Campaign is not active");
        
        campaigns[campaignId].title = title;
        campaigns[campaignId].description = description;
        campaigns[campaignId].imageUrl = imageUrl;
        
        emit CampaignUpdated(campaignId, title, description);
    }

    /// @notice Mark campaign as completed (only by organizer)
    /// @param campaignId Campaign's unique identifier
    function completeCampaign(bytes32 campaignId) 
        external 
        validCampaign(campaignId) 
        onlyCampaignOrganizer(campaignId) 
    {
        require(campaigns[campaignId].isActive, "Campaign already completed");
        
        campaigns[campaignId].isActive = false;
        campaigns[campaignId].isCompleted = true;
        
        // Remove from active campaigns
        _removeFromActiveCampaigns(campaignId);
        
        emit CampaignCompleted(campaignId, block.timestamp);
    }
    
    /// @notice Internal function to remove campaign from active list
    function _removeFromActiveCampaigns(bytes32 campaignId) internal {
        for (uint256 i = 0; i < activeCampaigns.length; i++) {
            if (activeCampaigns[i] == campaignId) {
                activeCampaigns[i] = activeCampaigns[activeCampaigns.length - 1];
                activeCampaigns.pop();
                break;
            }
        }
    }

    /// @notice Make an encrypted donation to a campaign with amount verification
    /// @param campaignId Target campaign's ID
    /// @param encryptedAmount Encrypted donation amount in wei
    /// @param inputProof Proof for the encrypted input
    /// @param isAnonymous Whether the donation should be anonymous
    function donate(
        bytes32 campaignId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        bool isAnonymous
    ) external payable validCampaign(campaignId) onlyActiveCampaign(campaignId) nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH with donation");
        require(msg.value <= 10 ether, "Donation too large"); // Reasonable cap

        // Validate and convert external encrypted input
        euint64 donationAmount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Store pending donation for verification
        uint256 requestId = nextRequestId++;
        pendingDonations[requestId] = PendingDonation({
            donor: msg.sender,
            campaignId: campaignId,
            ethAmount: msg.value,
            encryptedAmount: donationAmount,
            isActive: true,
            isAnonymous: isAnonymous
        });
        
        // Request decryption to verify encrypted amount matches ETH sent
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(donationAmount);
        FHE.requestDecryption(cts, this.verifyDonationCallback.selector, requestId);
        
        emit DonationVerificationRequested(requestId, campaignId, msg.sender);
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
        emit DonationVerified(requestId, pending.campaignId, pending.donor, verificationSuccess);
    }
    
    /// @notice Internal function to process verified donation
    function _processDonation(uint256 /* requestId */, PendingDonation memory pending) internal {
        // Update campaign's encrypted totals
        campaigns[pending.campaignId].totalDonations = FHE.add(
            campaigns[pending.campaignId].totalDonations, 
            pending.encryptedAmount
        );
        campaigns[pending.campaignId].donationCount = FHE.add(
            campaigns[pending.campaignId].donationCount, 
            FHE.asEuint32(1)
        );
        campaigns[pending.campaignId].publicDonatorCount += 1;

        // Store donation record
        Donation memory newDonation = Donation({
            donor: pending.donor,
            campaignId: pending.campaignId,
            amount: pending.encryptedAmount,
            timestamp: block.timestamp,
            isAnonymous: pending.isAnonymous
        });

        campaignDonations[pending.campaignId].push(newDonation);
        donorDonations[pending.donor].push(pending.campaignId);
        hasDonatedTo[pending.donor][pending.campaignId] = true;

        // Set ACL permissions for donor to access their donation
        FHE.allow(pending.encryptedAmount, pending.donor);

        // Transfer ETH to campaign organizer using call for better security
        (bool success, ) = payable(campaigns[pending.campaignId].organizer).call{value: pending.ethAmount}("");
        require(success, "Transfer failed");

        // Check milestones (this won't reveal the actual amount, but can trigger events)
        _checkMilestones(pending.campaignId);

        emit DonationMade(pending.campaignId, pending.donor, block.timestamp, pending.isAnonymous);
    }
    
    /// @notice Internal function to refund failed donation
    function _refundDonation(uint256 /* requestId */, PendingDonation memory pending) internal {
        (bool success, ) = payable(pending.donor).call{value: pending.ethAmount}("");
        require(success, "Refund failed");
    }

    /// @notice Internal function to check and update milestones
    function _checkMilestones(bytes32 campaignId) internal {
        // This is a simplified approach - in reality, you'd need to decrypt to check milestones
        // For now, we'll implement a basic system that can be improved later
        // Note: This is where you could implement TFHE.ge comparisons with encrypted milestones
    }

    /// @notice Get campaign's encrypted total donations (only accessible by organizer)
    /// @param campaignId Campaign's unique identifier
    /// @return Encrypted total donations
    function getCampaignTotalDonations(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId) 
        returns (euint64) 
    {
        return campaigns[campaignId].totalDonations;
    }

    /// @notice Get campaign's encrypted donation count (only accessible by organizer)
    /// @param campaignId Campaign's unique identifier
    /// @return Encrypted donation count
    function getCampaignDonationCount(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId) 
        returns (euint32) 
    {
        return campaigns[campaignId].donationCount;
    }

    /// @notice Get campaign's public information
    /// @param campaignId Campaign's unique identifier
    /// @return organizer Campaign organizer's address
    /// @return title Campaign title
    /// @return description Campaign description  
    /// @return imageUrl Campaign image URL
    /// @return targetAmount Target amount in wei
    /// @return deadline Campaign deadline
    /// @return publicDonatorCount Number of donators (public)
    /// @return isActive Whether campaign is active
    /// @return category Campaign category
    function getCampaignInfo(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId)
        returns (
            address organizer,
            string memory title,
            string memory description,
            string memory imageUrl,
            uint256 targetAmount,
            uint256 deadline,
            uint256 publicDonatorCount,
            bool isActive,
            CampaignCategory category
        ) 
    {
        Campaign memory campaign = campaigns[campaignId];
        return (
            campaign.organizer, 
            campaign.title, 
            campaign.description,
            campaign.imageUrl,
            campaign.targetAmount,
            campaign.deadline,
            campaign.publicDonatorCount,
            campaign.isActive,
            campaign.category
        );
    }

    /// @notice Get all campaign IDs
    /// @return Array of campaign IDs
    function getAllCampaigns() external view returns (bytes32[] memory) {
        return allCampaigns;
    }
    
    /// @notice Get all active campaign IDs
    /// @return Array of active campaign IDs
    function getActiveCampaigns() external view returns (bytes32[] memory) {
        return activeCampaigns;
    }
    
    /// @notice Get total number of campaigns
    /// @return Total campaigns count
    function getTotalCampaignsCount() external view returns (uint256) {
        return allCampaigns.length;
    }
    
    /// @notice Get campaigns by organizer
    /// @param organizer Organizer's address
    /// @return Array of campaign IDs created by organizer
    function getCampaignsByOrganizer(address organizer) external view returns (bytes32[] memory) {
        require(msg.sender == organizer || msg.sender == owner(), "Unauthorized access");
        return organizerCampaigns[organizer];
    }

    /// @notice Get number of donations for a campaign (public count, not encrypted)
    /// @param campaignId Campaign's unique identifier
    /// @return Number of donations received
    function getPublicDonationCount(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId) 
        returns (uint256) 
    {
        return campaignDonations[campaignId].length;
    }

    /// @notice Get donor's donation history (only accessible by donor or owner)
    /// @param donor Donor's address
    /// @return Array of creator IDs the donor has supported
    function getDonorHistory(address donor) external view returns (bytes32[] memory) {
        require(msg.sender == donor || msg.sender == owner(), "Unauthorized access");
        return donorDonations[donor];
    }

    /// @notice Check if an address has donated to a specific campaign (optimized)
    /// @param donor Donor's address
    /// @param campaignId Campaign's unique identifier
    /// @return True if donor has donated to campaign
    function hasDonated(address donor, bytes32 campaignId) external view returns (bool) {
        return hasDonatedTo[donor][campaignId];
    }

    /// @notice Reveal final amount (only by organizer after campaign completion)
    /// @param campaignId Campaign's unique identifier
    function revealFinalAmount(bytes32 campaignId) 
        external 
        validCampaign(campaignId) 
        onlyCampaignOrganizer(campaignId) 
    {
        require(!campaigns[campaignId].isActive, "Campaign still active");
        require(!campaigns[campaignId].finalAmountRevealed, "Amount already revealed");
        
        // This would require decryption in practice
        // For now, we'll set a placeholder that would be updated via callback
        campaigns[campaignId].finalAmountRevealed = true;
        
        // In practice, you'd request decryption here and update in callback
        // FHE.requestDecryption(..., this.revealCallback.selector, campaignId);
        
        emit FinalAmountRevealed(campaignId, campaigns[campaignId].revealedFinalAmount);
    }
    
    /// @notice Emergency pause function (only owner)
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Emergency unpause function (only owner)
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Simple donation without encryption (for testing/fallback)
    /// @param campaignId Target campaign's ID
    /// @param isAnonymous Whether donation should be anonymous
    function donateSimple(bytes32 campaignId, bool isAnonymous) 
        external 
        payable 
        validCampaign(campaignId)
        onlyActiveCampaign(campaignId) 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "Must send ETH with donation");
        require(msg.value <= 10 ether, "Donation too large");

        // Update campaign's public metrics
        campaigns[campaignId].publicDonatorCount += 1;
        
        // Update encrypted counts for privacy
        campaigns[campaignId].donationCount = FHE.add(
            campaigns[campaignId].donationCount, 
            FHE.asEuint32(1)
        );

        // Store donation record
        Donation memory newDonation = Donation({
            donor: msg.sender,
            campaignId: campaignId,
            amount: FHE.asEuint64(0), // Placeholder for compatibility
            timestamp: block.timestamp,
            isAnonymous: isAnonymous
        });

        campaignDonations[campaignId].push(newDonation);
        donorDonations[msg.sender].push(campaignId);
        hasDonatedTo[msg.sender][campaignId] = true;

        // Transfer ETH directly to organizer
        (bool success, ) = payable(campaigns[campaignId].organizer).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit DonationMade(campaignId, msg.sender, block.timestamp, isAnonymous);
    }

    /// @notice Get campaign metrics (public info only)
    /// @param campaignId Target campaign's ID
    /// @return targetAmount Campaign target amount
    /// @return totalDonators Total number of donators
    /// @return deadline Campaign deadline
    /// @return isActive Whether campaign is active
    /// @return daysLeft Days remaining (0 if expired)
    function getCampaignMetrics(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId) 
        returns (
            uint256 targetAmount, 
            uint256 totalDonators, 
            uint256 deadline, 
            bool isActive,
            uint256 daysLeft
        ) 
    {
        Campaign memory campaign = campaigns[campaignId];
        
        uint256 timeLeft = 0;
        if (block.timestamp < campaign.deadline) {
            timeLeft = (campaign.deadline - block.timestamp) / 86400; // Convert to days
        }
        
        return (
            campaign.targetAmount,
            campaign.publicDonatorCount,
            campaign.deadline,
            campaign.isActive,
            timeLeft
        );
    }

    /// @notice Get recent donations for campaign (last 10, respecting anonymity)
    /// @param campaignId Target campaign's ID
    /// @return donors Array of donor addresses (address(0) for anonymous)
    /// @return timestamps Array of donation timestamps
    /// @return isAnonymous Array indicating if donation was anonymous
    function getRecentDonations(bytes32 campaignId) 
        external 
        view 
        validCampaign(campaignId) 
        returns (
            address[] memory donors, 
            uint256[] memory timestamps,
            bool[] memory isAnonymous
        ) 
    {
        Donation[] memory donations = campaignDonations[campaignId];
        uint256 totalDonations = donations.length;
        
        // Get last 10 donations or all if less than 10
        uint256 recentCount = totalDonations > 10 ? 10 : totalDonations;
        
        donors = new address[](recentCount);
        timestamps = new uint256[](recentCount);
        isAnonymous = new bool[](recentCount);
        
        for (uint256 i = 0; i < recentCount; i++) {
            uint256 index = totalDonations - recentCount + i;
            donors[i] = donations[index].isAnonymous ? address(0) : donations[index].donor;
            timestamps[i] = donations[index].timestamp;
            isAnonymous[i] = donations[index].isAnonymous;
        }
        
        return (donors, timestamps, isAnonymous);
    }

    /// @notice Emergency withdrawal for stuck funds (only owner)
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
}
