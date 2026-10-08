// SPDX-License-Identifier: MIT
// ============================================================================
// GOLD EVIDENCE LEDGER — Smart Contract
// ============================================================================
// عقد ذكي لتوثيق الأدلة على البلوكشين (Polygon / EVM)
//
// المبادئ:
// 1. أدلة فقط — لا PII أو KYC على السلسلة
// 2. كل حدث له hash فريد مرتبط بالحدث السابق (سلسلة خيطية)
// 3. لا يمكن حذف أو تعديل الأدلة بعد التسجيل
// 4. خادم الجهة الموثقة فقط يسجل (Authorization)
// 5. كل سجل يحتوي: eventId, eventType, evidenceHash, previousHash, timestamp
//
// أنواع الأحداث المدعومة:
// - ASSET_REGISTRATION: تسجيل أصل جديد
// - ASSAY_RESULT: نتيجة فحص مختبري
// - CUSTODY_TRANSFER: نقل الحيازة
// - PASSPORT_ISSUED: إصدار جواز رقمي
// - PASSPORT_REVOKED: إلغاء جواز
// - NFC_LOCKED: قفل شريحة NFC
// - MARKETPLACE_LISTED: إعلان في السوق
// - MARKETPLACE_SOLD: بيع في السوق

pragma solidity ^0.8.20;

/**
 * @title GoldEvidenceLedger
 * @notice سجل أدلة البلوكشين للذهب والمعادن الثمينة
 * @dev كل سجل (Evidence Record) يمثل حدثاً واحداً في حياة الأصل
 */
contract GoldEvidenceLedger {
    // ─── structs ───────────────────────────────────────────

    /** نوع الحدث */
    enum EventType {
        ASSET_REGISTRATION,
        ASSAY_RESULT,
        CUSTODY_TRANSFER,
        PASSPORT_ISSUED,
        PASSPORT_REVOKED,
        NFC_LOCKED,
        MARKETPLACE_LISTED,
        MARKETPLACE_SOLD
    }

    /** سجل الدليل */
    struct EvidenceRecord {
        uint256 id;               // معرف الدليل الفريد
        bytes32 goldIdHash;       // hash(Gold ID) — لا نخزن Gold ID كنص
        EventType eventType;      // نوع الحدث
        bytes32 evidenceHash;     // SHA-256 للبيانات الأصلية
        bytes32 previousHash;     // hash للسجل السابق لنفس الأصل
        uint256 blockNumber;      // رقم البلوك عند التسجيل
        uint256 timestamp;        // وقت التسجيل
        address recordedBy;       // عنوان الجهة الموثقة
        bool exists;              // هل الدليل مسجل فعلاً
    }

    /** إحصائيات الأصل */
    struct AssetStats {
        uint256 totalEvents;      // إجمالي الأحداث
        uint256 lastEventTime;    // آخر حدث
        bytes32 lastHash;         // آخر hash في السلسلة
    }

    // ─── state variables ───────────────────────────────────

    /** عداد الدلائل العام */
    uint256 private _evidenceCounter;

    /** الدلائل حسب المعرف */
    mapping(uint256 => EvidenceRecord) private _evidenceById;

    /** إحصائيات الأصول حسب hash(Gold ID) */
    mapping(bytes32 => AssetStats) private _assetStats;

    /** سجل الأحداث حسب hash(Gold ID) */
    mapping(bytes32 => uint256[]) private _eventHistory;

    /** الجهات الموثقة (الخادم فقط) */
    mapping(address => bool) private _authorizedRecorders;

    /** مالك العقد */
    address public owner;

    // ─── events ────────────────────────────────────────────

    /** حدث تسجيل دليل جديد */
    event EvidenceRecorded(
        uint256 indexed evidenceId,
        bytes32 indexed goldIdHash,
        EventType eventType,
        bytes32 evidenceHash,
        bytes32 previousHash,
        uint256 timestamp,
        address recordedBy
    );

    /** حدث إضافة جهة موثقة */
    event RecorderAuthorized(address indexed recorder, bool authorized);

    // ─── modifiers ─────────────────────────────────────────

    /** فقط المالك */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /** فقط الجهات الموثقة */
    modifier onlyAuthorized() {
        require(_authorizedRecorders[msg.sender], "Not authorized to record evidence");
        _;
    }

    /** التحقق من عدم التكرار */
    modifier evidenceNotExists(uint256 evidenceId) {
        require(!_evidenceById[evidenceId].exists, "Evidence already recorded");
        _;
    }

    // ─── constructor ───────────────────────────────────────

    /**
     * تهيئة العقد
     * @param _owner عنوان المالك الأولي
     */
    constructor(address _owner) {
        owner = _owner;
        _authorizedRecorders[_owner] = true;
        _evidenceCounter = 0;
    }

    // ─── external functions ────────────────────────────────

    /**
     * تسجيل دليل جديد على السلسلة
     *
     * @param goldIdHash hash(Gold ID) — SHA-256
     * @param eventType نوع الحدث
     * @param evidenceHash hash للبيانات الأصلية (JSON)
     * @return evidenceId معرف الدليل الفريد
     *
     * ⚠️ لا يقبل Gold ID كنص — يجب hash مسبقاً
     * ⚠️ لا يقبل PII أو KYC — أدلة فقط
     */
    function recordEvidence(
        bytes32 goldIdHash,
        EventType eventType,
        bytes32 evidenceHash
    ) external onlyAuthorized evidenceNotExists(_evidenceCounter) returns (uint256) {
        _evidenceCounter++;

        // جلب آخر hash للسلسلة
        bytes32 previousHash = _assetStats[goldIdHash].lastHash;

        // إنشاء سجل الدليل
        _evidenceById[_evidenceCounter] = EvidenceRecord({
            id: _evidenceCounter,
            goldIdHash: goldIdHash,
            eventType: eventType,
            evidenceHash: evidenceHash,
            previousHash: previousHash,
            blockNumber: block.number,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            exists: true
        });

        // تحديث إحصائيات الأصل
        _assetStats[goldIdHash].totalEvents++;
        _assetStats[goldIdHash].lastEventTime = block.timestamp;
        _assetStats[goldIdHash].lastHash = keccak256(
            abi.encodePacked(evidenceHash, previousHash, block.timestamp)
        );

        // إضافة للسجل
        _eventHistory[goldIdHash].push(_evidenceCounter);

        // إطلاق الحدث
        emit EvidenceRecorded(
            _evidenceCounter,
            goldIdHash,
            eventType,
            evidenceHash,
            previousHash,
            block.timestamp,
            msg.sender
        );

        return _evidenceCounter;
    }

    /**
     * التحقق من سلسلة الأدلة لأصل معين
     *
     * يتحقق من أن كل hash يرتبط بالسابق بشكل صحيح
     * أي تلاعب في أي سجل يُكتشف فوراً
     *
     * @param goldIdHash hash(Gold ID)
     * @return isValid true إذا كانت السلسلة سليمة
     * @return totalEvents عدد الأحداث
     */
    function verifyChain(bytes32 goldIdHash)
        external
        view
        returns (bool isValid, uint256 totalEvents)
    {
        uint256[] storage eventIds = _eventHistory[goldIdHash];
        totalEvents = eventIds.length;

        if (totalEvents == 0) {
            return (true, 0);
        }

        // التحقق من كل سجل
        for (uint256 i = 0; i < eventIds.length; i++) {
            EvidenceRecord memory record = _evidenceById[eventIds[i]];

            // التحقق من الارتباط بالسجل السابق
            if (i > 0) {
                EvidenceRecord memory prevRecord = _evidenceById[eventIds[i - 1]];
                bytes32 expectedPrevHash = keccak256(
                    abi.encodePacked(
                        prevRecord.evidenceHash,
                        prevRecord.previousHash,
                        prevRecord.timestamp
                    )
                );
                if (record.previousHash != expectedPrevHash) {
                    return (false, i);
                }
            }
        }

        return (true, totalEvents);
    }

    // ─── view functions ────────────────────────────────────

    /** جلب سجل دليل بالتفصيل */
    function getEvidence(uint256 evidenceId)
        external
        view
        returns (EvidenceRecord memory)
    {
        require(_evidenceById[evidenceId].exists, "Evidence not found");
        return _evidenceById[evidenceId];
    }

    /** جلب إحصائيات أصل */
    function getAssetStats(bytes32 goldIdHash)
        external
        view
        returns (uint256 totalEvents, uint256 lastEventTime, bytes32 lastHash)
    {
        AssetStats memory stats = _assetStats[goldIdHash];
        return (stats.totalEvents, stats.lastEventTime, stats.lastHash);
    }

    /** جلب تاريخ أحداث أصل */
    function getEventHistory(bytes32 goldIdHash)
        external
        view
        returns (uint256[] memory)
    {
        return _eventHistory[goldIdHash];
    }

    /** التحقق من صلاحية جهة التسجيل */
    function isAuthorized(address recorder) external view returns (bool) {
        return _authorizedRecorders[recorder];
    }

    /** جلب عدد الدلائل الكلي */
    function getTotalEvidence() external view returns (uint256) {
        return _evidenceCounter;
    }

    // ─── admin functions ───────────────────────────────────

    /** إضافة/حذف جهة موثقة */
    function setAuthorizedRecorder(address recorder, bool authorized)
        external
        onlyOwner
    {
        _authorizedRecorders[recorder] = authorized;
        emit RecorderAuthorized(recorder, authorized);
    }
}
