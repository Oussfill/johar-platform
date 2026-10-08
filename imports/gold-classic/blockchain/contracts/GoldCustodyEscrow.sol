// SPDX-License-Identifier: MIT
// ============================================================================
// GOLD CUSTODY ESCROW — Smart Contract
// ============================================================================
// عقد ذكي لنظام الضمان المالي (Escrow) في سوق الذهب
//
// المبادئ:
// 1. المشتري يودع المبلغ في العقد (ESCROW)
// 2. البائع يشحن الأصل
// 3. المشتري يconfirm التسليم (مسح NFC + توقيع)
// 4. الأموال تُطلق للبائع بعد التأكيد
// 5. نظام Four-Eyes: الموافقة على مبالغ > $50K تتطلب مرتدين
//
// الحالات:
// - CREATED: تم إنشاء الصفقة
// - FUNDED: تم إيداع الأموال
// - SHIPPED: تم شحن الأصل
// - DELIVERED: تم التسليم
// - CONFIRMED: تأكيد نهائي — أموال مُطلقة
// - DISPUTED: نزاع
// - REFUNDED: استرداد
// - CANCELLED: إلغاء

pragma solidity ^0.8.20;

/**
 * @title GoldCustodyEscrow
 * @notice نظام الضمان المالي للصفقات الذهبية
 */
contract GoldCustodyEscrow {
    // ─── structs ───────────────────────────────────────────

    enum EscrowStatus {
        CREATED,
        FUNDED,
        SHIPPED,
        DELIVERED,
        CONFIRMED,
        DISPUTED,
        REFUNDED,
        CANCELLED
    }

    struct Transaction {
        uint256 id;
        bytes32 listingIdHash;      // hash(Listing ID)
        bytes32 buyerHash;          // hash(Buyer Entity ID)
        bytes32 sellerHash;         // hash(Seller Entity ID)
        uint256 amount;             // المبلغ (wei)
        address paymentToken;       // عنوان العملة (ERC-20 أو address(0) للم.native)
        EscrowStatus status;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 shippedAt;
        uint256 deliveredAt;
        uint256 confirmedAt;
        bool requiresDualAuth;      // يتطلب اعتمادثنائي (> $50K)
        bool firstApproval;         // الموافقة الأولى
        bool secondApproval;        // الموافقة الثانية
        address firstApprover;
        address secondApprover;
    }

    // ─── state variables ───────────────────────────────────

    uint256 private _txCounter;
    mapping(uint256 => Transaction) private _transactions;
    mapping(address => bool) private _authorizedApprovers;
    address public owner;

    /** حد Four-Eyes: 50,000 USD = 50,000 * 10^18 wei */
    uint256 public constant DUAL_AUTH_THRESHOLD = 50000 ether;

    // ─── events ────────────────────────────────────────────

    event TransactionCreated(uint256 indexed txId, bytes32 listingIdHash, uint256 amount);
    event TransactionFunded(uint256 indexed txId, uint256 amount);
    event TransactionShipped(uint256 indexed txId);
    event TransactionDelivered(uint256 indexed txId);
    event TransactionConfirmed(uint256 indexed txId, uint256 amount);
    event TransactionRefunded(uint256 indexed txId, uint256 amount);
    event DualAuthApproved(uint256 indexed txId, address approver, bool isSecond);

    // ─── modifiers ─────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(_authorizedApprovers[msg.sender], "Not authorized");
        _;
    }

    modifier txExists(uint256 txId) {
        require(_transactions[txId].id != 0, "Transaction not found");
        _;
    }

    modifier txInStatus(uint256 txId, EscrowStatus expected) {
        require(_transactions[txId].status == expected, "Invalid status");
        _;
    }

    // ─── constructor ───────────────────────────────────────

    constructor(address _owner) {
        owner = _owner;
        _authorizedApprovers[_owner] = true;
    }

    // ─── core functions ────────────────────────────────────

    /**
     * إنشاء صفقة جديدة
     */
    function createTransaction(
        bytes32 listingIdHash,
        bytes32 buyerHash,
        bytes32 sellerHash,
        bool requiresDualAuth
    ) external onlyAuthorized returns (uint256) {
        _txCounter++;

        _transactions[_txCounter] = Transaction({
            id: _txCounter,
            listingIdHash: listingIdHash,
            buyerHash: buyerHash,
            sellerHash: sellerHash,
            amount: 0,
            paymentToken: address(0),
            status: EscrowStatus.CREATED,
            createdAt: block.timestamp,
            fundedAt: 0,
            shippedAt: 0,
            deliveredAt: 0,
            confirmedAt: 0,
            requiresDualAuth: requiresDualAuth,
            firstApproval: false,
            secondApproval: false,
            firstApprover: address(0),
            secondApprover: address(0)
        });

        emit TransactionCreated(_txCounter, listingIdHash, 0);
        return _txCounter;
    }

    /**
     * إيداع الأموال في الضمان
     */
    function fundTransaction(uint256 txId)
        external
        payable
        txExists(txId)
        txInStatus(txId, EscrowStatus.CREATED)
    {
        require(msg.value > 0, "Amount must be > 0");

        Transaction storage tx_ = _transactions[txId];
        tx_.amount = msg.value;
        tx_.paymentToken = msg.sender;
        tx_.status = EscrowStatus.FUNDED;
        tx_.fundedAt = block.timestamp;

        emit TransactionFunded(txId, msg.value);
    }

    /**
     * تأكيد الشحن (البائع)
     */
    function shipTransaction(uint256 txId)
        external
        onlyAuthorized
        txExists(txId)
        txInStatus(txId, EscrowStatus.FUNDED)
    {
        _transactions[txId].status = EscrowStatus.SHIPPED;
        _transactions[txId].shippedAt = block.timestamp;
        emit TransactionShipped(txId);
    }

    /**
     * تأكيد التسليم (المشتري — مسح NFC)
     */
    function deliverTransaction(uint256 txId)
        external
        onlyAuthorized
        txExists(txId)
        txInStatus(txId, EscrowStatus.SHIPPED)
    {
        _transactions[txId].status = EscrowStatus.DELIVERED;
        _transactions[txId].deliveredAt = block.timestamp;
        emit TransactionDelivered(txId);
    }

    /**
     * التأكيد النهائي وإطلاق الأموال
     *
     * Four-Eyes Principle:
     * إذا المبلغ > $50K → تتطلب موافقتين من شخصين مختلفين
     */
    function confirmAndRelease(uint256 txId)
        external
        onlyAuthorized
        txExists(txId)
        txInStatus(txId, EscrowStatus.DELIVERED)
    {
        Transaction storage tx_ = _transactions[txId];

        // فحص Four-Eyes Principle
        if (tx_.requiresDualAuth && tx_.amount >= DUAL_AUTH_THRESHOLD) {
            if (!tx_.firstApproval) {
                tx_.firstApproval = true;
                tx_.firstApprover = msg.sender;
                emit DualAuthApproved(txId, msg.sender, false);
                return; // ننتظر الموافقة الثانية
            }

            if (tx_.secondApprover == address(0)) {
                require(msg.sender != tx_.firstApprover, "Same approver not allowed");
                tx_.secondApproval = true;
                tx_.secondApprover = msg.sender;
                emit DualAuthApproved(txId, msg.sender, true);
            }

            require(tx_.firstApproval && tx_.secondApproval, "Dual auth incomplete");
        }

        // إطلاق الأموال للبائع
        tx_.status = EscrowStatus.CONFIRMED;
        tx_.confirmedAt = block.timestamp;

        payable(tx_.paymentToken).transfer(tx_.amount);

        emit TransactionConfirmed(txId, tx_.amount);
    }

    /**
     * استرداد الأموال (حالة نزاع)
     */
    function refundTransaction(uint256 txId)
        external
        onlyOwner
        txExists(txId)
    {
        Transaction storage tx_ = _transactions[txId];
        require(
            tx_.status == EscrowStatus.DISPUTED || tx_.status == EscrowStatus.FUNDED,
            "Cannot refund in current status"
        );

        uint256 amount = tx_.amount;
        tx_.status = EscrowStatus.REFUNDED;

        payable(tx_.paymentToken).transfer(amount);

        emit TransactionRefunded(txId, amount);
    }

    /**
     * فتح نزاع
     */
    function raiseDispute(uint256 txId)
        external
        onlyAuthorized
        txExists(txId)
    {
        Transaction storage tx_ = _transactions[txId];
        require(
            tx_.status == EscrowStatus.SHIPPED || tx_.status == EscrowStatus.DELIVERED,
            "Cannot dispute in current status"
        );
        tx_.status = EscrowStatus.DISPUTED;
    }

    // ─── view functions ────────────────────────────────────

    function getTransaction(uint256 txId)
        external
        view
        txExists(txId)
        returns (Transaction memory)
    {
        return _transactions[txId];
    }

    function getTotalTransactions() external view returns (uint256) {
        return _txCounter;
    }

    // ─── admin functions ───────────────────────────────────

    function setAuthorizedApprover(address approver, bool authorized)
        external
        onlyOwner
    {
        _authorizedApprovers[approver] = authorized;
    }
}
