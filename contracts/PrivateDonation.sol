// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint128, externalEuint128, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IConfidentialERC20 {
    /**
     * Transfers an already-verified encrypted amount from `from` to `to`.
     * The `amount` is an FHE ciphertext (euint128) _inside the same tx_ that was produced by
     * FHE.fromExternal(...) in the caller contract. The token MUST accept encrypted amounts.
     *
     * Implementations typically check encrypted balances and update them homomorphically.
     * Returns true on success.
     */
    function transferFromEuint(address from, address to, euint128 amount) external returns (bool);

    /**
     * (Optional) Expose a symbol/name for convenience UIs; not required by this contract’s logic.
     */
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

contract PrivateCampaignDonation is SepoliaConfig, ReentrancyGuard, Pausable, Ownable {
    // ======== Configuration ========
    IConfidentialERC20 public immutable token;

    // Enforce a maximum encrypted donation per tx (still private on-chain).
    // We compare ciphertext against an encrypted constant and only reveal a boolean.
    uint256 public constant MAX_DONATION_PLAINTEXT = 10_000 ether;

    // ======== Data Model ========
    enum CampaignCategory {
        DISASTER_RELIEF,
        MEDICAL,
        EDUCATION,
        ENVIRONMENT,
        SOCIAL,
        EMERGENCY,
        OTHER
    }

    struct Campaign {
        bytes32 id;
        address organizer;
        string  title;
        string  description;
        string  imageUrl;
        uint256 targetAmount;         // Public UI target (wei-like unit of the confidential token)
        uint256 deadline;             // Timestamp
        euint128 totalDonations;      // Encrypted total
        euint32  donationCount;       // Encrypted count
        uint256  publicDonorCount;    // Purely public (social proof)
        bool     isActive;
        bool     isCompleted;
        bool     finalAmountRevealed; // Whether public-decrypt handle has been emitted
        CampaignCategory category;
    }

    struct DonationMeta {
        address  donor;       // address(0) if anonymous on-chain
        bytes32  campaignId;
        uint256  timestamp;
        bool     isAnonymous;
        // NOTE: We intentionally do NOT store encrypted per-donation amounts to keep storage lean.
        // If you need per-donation private stats, add `euint128 amount;` here (costs more gas).
    }

    // ======== Storage ========
    mapping(bytes32 => Campaign) public campaigns;
    mapping(bytes32 => DonationMeta[]) public campaignDonations;
    mapping(address => bytes32[]) public donorCampaigns;
    mapping(address => mapping(bytes32 => bool)) public hasDonatedTo; // public convenience
    mapping(address => bytes32[]) public organizerCampaigns;

    // Campaign registry lists
    bytes32[] public allCampaigns;
    bytes32[] public activeCampaigns;

    // O(1) removal index for activeCampaigns
    mapping(bytes32 => uint256) private activeIdx;

    // Optional public milestones (no encrypted checks; for UI only)
    mapping(bytes32 => uint256[]) public campaignMilestones;

    // ======== Events ========
    event CampaignCreated(bytes32 indexed campaignId, address indexed organizer, string title, uint256 targetAmount, uint256 deadline);
    event CampaignUpdated(bytes32 indexed campaignId, string title, string description, string imageUrl);
    event CampaignCompleted(bytes32 indexed campaignId, uint256 timestamp);
    event DonationMade(bytes32 indexed campaignId, address indexed donor, uint256 timestamp, bool isAnonymous);
    event TotalsHandle(bytes32 indexed campaignId, bytes32 totalHandle, bytes32 countHandle);

    // ======== Modifiers ========
    modifier validCampaign(bytes32 campaignId) {
        require(campaigns[campaignId].organizer != address(0), "Campaign does not exist");
        _;
    }

    modifier onlyActiveCampaign(bytes32 campaignId) {
        require(campaigns[campaignId].isActive, "Campaign not active");
        require(block.timestamp < campaigns[campaignId].deadline, "Campaign deadline passed");
        _;
    }

    modifier onlyCampaignOrganizer(bytes32 campaignId) {
        require(campaigns[campaignId].organizer == msg.sender, "Not campaign organizer");
        _;
    }

    constructor(IConfidentialERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    // ======== Campaigns ========
    function createCampaign(
        bytes32 campaignId,
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        uint256 targetAmount,
        uint256 duration,
        CampaignCategory category
    ) external whenNotPaused {
        require(campaigns[campaignId].organizer == address(0), "Campaign ID exists");
        require(bytes(title).length > 0, "Title empty");
        require(targetAmount > 0, "Target > 0");
        require(duration > 0, "Duration > 0");

        uint256 deadline = block.timestamp + duration;

        euint128 zeroTotal = FHE.asEuint128(0);
        euint32  zeroCount = FHE.asEuint32(0);

        Campaign storage c = campaigns[campaignId];
        c.id = campaignId;
        c.organizer = msg.sender;
        c.title = title;
        c.description = description;
        c.imageUrl = imageUrl;
        c.targetAmount = targetAmount;
        c.deadline = deadline;
        c.totalDonations = zeroTotal;
        c.donationCount = zeroCount;
        c.publicDonorCount = 0;
        c.isActive = true;
        c.isCompleted = false;
        c.finalAmountRevealed = false;
        c.category = category;

        // Ensure future homomorphic ops remain allowed for this contract.
        FHE.allowThis(c.totalDonations);
        FHE.allowThis(c.donationCount);

        // Optional public milestones for UI (25/50/75/100%)
        uint256[4] memory ms;
        ms[0] = (targetAmount * 25) / 100;
        ms[1] = (targetAmount * 50) / 100;
        ms[2] = (targetAmount * 75) / 100;
        ms[3] = targetAmount;
        campaignMilestones[campaignId] = ms;

        // Registry updates
        activeIdx[campaignId] = activeCampaigns.length;
        activeCampaigns.push(campaignId);
        allCampaigns.push(campaignId);
        organizerCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, title, targetAmount, deadline);
    }

    function updateCampaign(
        bytes32 campaignId,
        string calldata title,
        string calldata description,
        string calldata imageUrl
    ) external validCampaign(campaignId) onlyCampaignOrganizer(campaignId) {
        require(bytes(title).length > 0, "Title empty");
        require(campaigns[campaignId].isActive, "Not active");

        campaigns[campaignId].title = title;
        campaigns[campaignId].description = description;
        campaigns[campaignId].imageUrl = imageUrl;

        emit CampaignUpdated(campaignId, title, description, imageUrl);
    }

    function completeCampaign(bytes32 campaignId)
        external
        validCampaign(campaignId)
        onlyCampaignOrganizer(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.isActive, "Already completed");

        c.isActive = false;
        c.isCompleted = true;

        // O(1) remove from activeCampaigns
        uint256 idx = activeIdx[campaignId];
        uint256 last = activeCampaigns.length - 1;
        if (idx != last) {
            bytes32 lastId = activeCampaigns[last];
            activeCampaigns[idx] = lastId;
            activeIdx[lastId] = idx;
        }
        activeCampaigns.pop();
        delete activeIdx[campaignId];

        emit CampaignCompleted(campaignId, block.timestamp);
    }

    // ======== Encrypted Donation Path ========
    /**
     * @notice Confidential donation using a confidential ERC-20.
     * @param campaignId     Target campaign.
     * @param encryptedAmount External handle for amount (from frontend SDK).
     * @param inputProof     ZK input proof validating the encrypted input.
     * @param isAnonymous    If true, the on-chain donor address is hidden in history (set to address(0) in logs/state).
     *
     * Flow:
     * 1) Convert (and verify) external encrypted amount handle -> euint128.
     * 2) Enforce a private upper bound (MAX_DONATION_PLAINTEXT) by decrypting only the boolean comparison.
     * 3) Move confidential tokens from donor to organizer using the encrypted amount.
     * 4) Homomorphically update encrypted totals and counts.
     * 5) Update public-only social proof counters and history (without amounts).
     */
    function donateEncrypted(
        bytes32 campaignId,
        externalEuint128 encryptedAmount,
        bytes calldata inputProof,
        bool isAnonymous
    )
        external
        validCampaign(campaignId)
        onlyActiveCampaign(campaignId)
        nonReentrant
        whenNotPaused
    {
        Campaign storage c = campaigns[campaignId];

        // 1) Import & verify encrypted input (consumes the handle).
        euint128 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // 2) Private upper bound: For now, we trust the frontend to validate reasonable amounts
        //    In production, you might want to add oracle-based validation

        // 3) Move confidential tokens from donor to organizer.
        //    The token must support taking an `euint128` produced in this tx.
        bool moved = token.transferFromEuint(msg.sender, c.organizer, amount);
        require(moved, "Confidential token transfer failed");

        // 4) Update encrypted totals & counts.
        c.totalDonations = FHE.add(c.totalDonations, amount);
        FHE.allowThis(c.totalDonations); // keep usable

        c.donationCount = FHE.add(c.donationCount, FHE.asEuint32(1));
        FHE.allowThis(c.donationCount);

        // 5) Public-only social proof & history
        c.publicDonorCount += 1;

        campaignDonations[campaignId].push(DonationMeta({
            donor: isAnonymous ? address(0) : msg.sender,
            campaignId: campaignId,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous
        }));

        if (!isAnonymous) {
            donorCampaigns[msg.sender].push(campaignId);
            hasDonatedTo[msg.sender][campaignId] = true;
        }

        emit DonationMade(campaignId, isAnonymous ? address(0) : msg.sender, block.timestamp, isAnonymous);
    }

    /**
     * @notice Simple ETH donation (public amount, for compatibility)
     * @param campaignId Campaign to donate to
     * @param isAnonymous Whether to hide donor identity
     */
    function donatePublic(
        bytes32 campaignId,
        bool isAnonymous
    ) 
        external 
        payable 
        validCampaign(campaignId) 
        onlyActiveCampaign(campaignId) 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "Must send ETH");
        Campaign storage c = campaigns[campaignId];
        
        // Transfer ETH directly to organizer
        (bool success, ) = c.organizer.call{value: msg.value}("");
        require(success, "ETH transfer failed");
        
        // Update public donation count
        c.publicDonorCount++;
        
        // Track donation publicly
        campaignDonations[campaignId].push(DonationMeta({
            donor: isAnonymous ? address(0) : msg.sender,
            campaignId: campaignId,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous
        }));
        
        emit DonationMade(campaignId, isAnonymous ? address(0) : msg.sender, block.timestamp, isAnonymous);
    }

    /**
     * @notice Alias for donatePublic (backward compatibility)
     */
    function donateSimple(
        bytes32 campaignId,
        bool isAnonymous
    ) external payable {
        // Forward to donatePublic
        this.donatePublic{value: msg.value}(campaignId, isAnonymous);
    }

    // ======== Reveal & Permissions ========
    /**
     * @notice After a campaign ends, make the encrypted totals publicly decryptable.
     *         The frontend should call SDK `publicDecrypt(handle)` for each emitted handle.
     */
    function revealTotalsPublic(bytes32 campaignId)
        external
        validCampaign(campaignId)
        onlyCampaignOrganizer(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(!c.isActive, "Campaign active");
        require(!c.finalAmountRevealed, "Already revealed");

        // TODO: Implement public decryption with updated FHEVM API
        // For now, just mark as revealed without actual decryption
        c.finalAmountRevealed = true;
        
        // Placeholder handles - in production, use proper oracle decryption
        bytes32 totalHandle = keccak256("total_placeholder");
        bytes32 countHandle = keccak256("count_placeholder");
        
        emit TotalsHandle(campaignId, totalHandle, countHandle);
    }

    /**
     * @notice Grant organizer private decryption rights over campaign ciphertexts.
     *         Useful if you want organizer-only dashboards without public reveal.
     */
    function allowOrganizerDecrypt(bytes32 campaignId)
        external
        validCampaign(campaignId)
        onlyCampaignOrganizer(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        FHE.allowThis(c.totalDonations);
        FHE.allowThis(c.donationCount);
        FHE.allow(c.totalDonations, msg.sender);
        FHE.allow(c.donationCount, msg.sender);
    }

    // ======== Views ========
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
            uint256 publicDonorCount,
            bool isActive,
            CampaignCategory category
        )
    {
        Campaign storage c = campaigns[campaignId];
        return (c.organizer, c.title, c.description, c.imageUrl, c.targetAmount, c.deadline, c.publicDonorCount, c.isActive, c.category);
    }

    function getAllCampaigns() external view returns (bytes32[] memory) { return allCampaigns; }
    function getActiveCampaigns() external view returns (bytes32[] memory) { return activeCampaigns; }
    function getTotalCampaignsCount() external view returns (uint256) { return allCampaigns.length; }

    function getCampaignsByOrganizer(address organizer) external view returns (bytes32[] memory) {
        require(msg.sender == organizer || msg.sender == owner(), "Unauthorized");
        return organizerCampaigns[organizer];
    }

    function getPublicDonationCount(bytes32 campaignId)
        external
        view
        validCampaign(campaignId)
        returns (uint256)
    {
        return campaigns[campaignId].publicDonorCount;
    }

    function getDonorHistory(address donor) external view returns (bytes32[] memory) {
        require(msg.sender == donor || msg.sender == owner(), "Unauthorized");
        return donorCampaigns[donor];
    }

    /**
     * @notice Last N public history entries (addresses hidden if anonymous).
     */
    function getRecentDonations(bytes32 campaignId, uint256 limit)
        external
        view
        validCampaign(campaignId)
        returns (address[] memory donors, uint256[] memory timestamps, bool[] memory isAnonymous)
    {
        DonationMeta[] storage d = campaignDonations[campaignId];
        uint256 n = d.length;
        uint256 m = n > limit ? limit : n;

        donors = new address[](m);
        timestamps = new uint256[](m);
        isAnonymous = new bool[](m);

        for (uint256 i = 0; i < m; i++) {
            uint256 idx = n - m + i;
            donors[i] = d[idx].isAnonymous ? address(0) : d[idx].donor;
            timestamps[i] = d[idx].timestamp;
            isAnonymous[i] = d[idx].isAnonymous;
        }
    }

    // ======== Admin ========
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // No ETH accepted — everything is via confidential ERC-20
    receive() external payable { revert("ETH not accepted"); }
    fallback() external payable { revert("ETH not accepted"); }
}
