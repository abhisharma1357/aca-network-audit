pragma solidity ^0.4.19;

import "./SafeMath.sol";
import "./RefundVault.sol";
import "./ACAToken.sol";

contract ACATokenSale {
    using SafeMath for uint256;

    address public owner;
    address public admin;

    address public wallet;
    ACAToken public token;

    uint256 totalSupply;

    struct StageInfo {
        uint256 opening;
        uint256 closing;
        uint256 capacity;
        uint256 minimumWei;
        uint256 maximumWei;
        uint256 rate;
        uint256 sold;
    }
    bool public tokenSaleEnabled = false;

    mapping(address => bool) public whitelist;
    mapping(address => bool) public kyclist;
    mapping(address => bool) public whitelistBonus;

    uint256 public whitelistBonusClosingTime;
    uint256 public whitelistBonusSent = 0;
    uint256 public whitelistBonusRate;
    uint256 public whitelistBonusAmount;

    mapping (address => uint256) public sales;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public weiRaised = 0;

    RefundVault public vault;

    mapping (address => address) public referrals;
    uint256 public referralAmount;
    uint256 public referralRateInviter;
    uint256 public referralRateInvitee;
    uint256 public referralSent = 0;
    bool public referralDone = false;

    mapping (address => uint256) public bounties;
    uint256 public bountyAmount;
    uint256 public bountySent = 0;

    StageInfo[] public stages;
    uint256 public currentStage = 0;

    bool public isFinalized = false;
    bool public isClaimable = false;

    // events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event TokenSaleCreated(address indexed wallet, uint256 totalSupply);
    event StageAdded(uint256 openingTime, uint256 closingTime, uint256 capacity, uint256 minimumWei, uint256 maximumWei, uint256 rate);
    event TokenSaleEnabled();

    event WhitelistUpdated(address indexed beneficiary, bool flag);
    event VerificationUpdated(address indexed beneficiary, bool flag);
    event BulkWhitelistUpdated(address[] beneficiary, bool flag);
    event BulkVerificationUpdated(address[] beneficiary, bool flag);

    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event TokenClaimed(address indexed beneficiary, uint256 amount);
    event Finalized();
    event BountySetupDone();
    event BountyUpdated(address indexed target, bool flag, uint256 amount);
    event PurchaseReferral(address indexed beneficiary, uint256 amount);
    event StageUpdated(uint256 stage);
    event ReferralCapReached();

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner || msg.sender == admin);
        _;
    }

    modifier isVerified(address _beneficiary) {
        require(whitelist[_beneficiary] == true);
        require(kyclist[_beneficiary] == true);
        _;
    }

    modifier claimable {
        require(isFinalized == true || isClaimable == true);
        require(isGoalReached());
        _;
    }

    // getters
    function isEnabled() public view returns (bool) {
        return tokenSaleEnabled;
    }

    function isClosed() public view returns (bool) {
        return now > stages[stages.length - 1].closing;
    }

    function isGoalReached() public view returns (bool) {
        return getTotalTokenSold() >= softCap;
    }

    function getTotalTokenSold() public view returns (uint256) {
        uint256 sold = 0;
        for ( uint i = 0; i < stages.length; ++i ) {
            sold = sold.add(stages[i].sold);
        }

        return sold;
    }

    function getOpeningTime() public view returns (uint256) {
        return stages[currentStage].opening;
    }

    function getOpeningTimeByStage(uint _index) public view returns (uint256) {
        require(_index < stages.length);
        return stages[_index].opening;
    }

    function getClosingTime() public view returns (uint256) {
        return stages[currentStage].closing;
    }

    function getClosingTimeByStage(uint _index) public view returns (uint256) {
        require(_index < stages.length);
        return stages[_index].closing;
    }

    function getCurrentCapacity() public view returns (uint256) {
        return stages[currentStage].capacity;
    }

    function getCapacity(uint _index) public view returns (uint256) {
        require(_index < stages.length);
        return stages[_index].capacity;
    }

    function getCurrentSold() public view returns (uint256) {
        return stages[currentStage].sold;
    }

    function getSold(uint _index) public view returns (uint256) {
        require(_index < stages.length);
        return stages[_index].sold;
    }

    function getCurrentRate() public view returns (uint256) {
        return stages[currentStage].rate;
    }

    function getRate(uint _index) public view returns (uint256) {
        require(_index < stages.length);
        return stages[_index].rate;
    }

    function getRateWithoutBonus() public view returns (uint256) {
        return stages[stages.length - 1].rate;
    }

    function getSales(address _beneficiary) public view returns (uint256) {
        return sales[_beneficiary];
    }
    
    // setter
    function setSalePeriod(uint _index, uint256 _openingTime, uint256 _closingTime) public onlyOwner {
        require(_openingTime > now);
        require(_closingTime > _openingTime);

        require(_index > currentStage);
        require(_index < stages.length);

        stages[_index].opening = _openingTime;        
        stages[_index].closing = _closingTime;        
    }

    function setRate(uint _index, uint256 _rate) public onlyOwner {
        require(_index > currentStage);
        require(_index < stages.length);

        require(_rate > 0);

        stages[_index].rate = _rate;
    }

    function setCapacity(uint _index, uint256 _capacity) public onlyOwner {
        require(_index > currentStage);
        require(_index < stages.length);

        require(_capacity > 0);
        require(_capacity < hardCap);
        require(stages[_index].minimumWei.mul(stages[_index].rate) < _capacity);
        require(stages[_index].maximumWei.mul(stages[_index].rate) < _capacity);

        stages[_index].capacity = _capacity;
    }

    
     function setClaimable(bool _claimable) public onlyOwner {
        if ( _claimable == true ) {
            require(isGoalReached());
        }

        isClaimable = _claimable;
    }

    function addPrivateSale(uint256 _amount) public onlyOwner {
        require(currentStage == 0);
        require(_amount > 0);
        require(_amount < stages[0].capacity.sub(stages[0].sold));

        stages[0].sold = stages[0].sold.add(_amount);
    }

    function subPrivateSale(uint256 _amount) public onlyOwner {
        require(currentStage == 0);
        require(_amount > 0);
        require(stages[0].sold > _amount);

        stages[0].sold = stages[0].sold.sub(_amount);
    }

    // permission
    function setAdmin(address _newAdmin) public onlyOwner {
        require(_newAdmin != address(0x0));
        require(_newAdmin != address(this));
        require(_newAdmin != owner);

        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        require(newOwner != address(this));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // constructor
    function ACATokenSale(
        address _wallet, 
        address _admin,
        uint256 _totalSupply,
        uint256 _softCap,
        uint256 _hardCap) public {
        owner = msg.sender;

        require(_admin != address(0));
        require(_wallet != address(0));

        require(_totalSupply > 0);
        require(_softCap > 0);
        require(_hardCap > _softCap);

        admin = _admin;
        wallet = _wallet;

        totalSupply = _totalSupply;
        softCap = _softCap;
        hardCap = _hardCap;

        emit TokenSaleCreated(wallet, _totalSupply);
    }

    // state related
    function setupBounty(
        uint256 _referralAmount,
        uint256 _referralRateInviter,
        uint256 _referralRateInvitee,
        uint256 _bountyAmount,
        uint256 _whitelistBonusClosingTime,
        uint256 _whitelistBonusRate,
        uint256 _whitelistBonusAmount
    ) onlyOwner public {
        
        require(_referralAmount > 0);

        require(_referralRateInviter > 0 && _referralRateInviter < 100);
        require(_referralRateInvitee > 0 && _referralRateInvitee < 100);

        require(_whitelistBonusClosingTime > now);
        require(_whitelistBonusRate > 0);
        require(_whitelistBonusAmount > _whitelistBonusRate);
        require(_bountyAmount > 0);

        referralAmount = _referralAmount;
        referralRateInviter = _referralRateInviter;
        referralRateInvitee = _referralRateInvitee;
        bountyAmount = _bountyAmount;
        whitelistBonusClosingTime = _whitelistBonusClosingTime;
        whitelistBonusRate = _whitelistBonusRate;
        whitelistBonusAmount = _whitelistBonusAmount;

        emit BountySetupDone();
    }
    function addStage(
        uint256 _openingTime, 
        uint256 _closingTime, 
        uint256 _capacity, 
        uint256 _minimumWei, 
        uint256 _maximumWei, 
        uint256 _rate) onlyOwner public {
        require(tokenSaleEnabled == false);

        // require(_openingTime > now);
        require(_closingTime > _openingTime);

        require(_capacity > 0);
        require(_capacity < hardCap);

        require(_minimumWei > 0);
        require(_maximumWei >= _minimumWei);

        require(_rate > 0);

        require(_minimumWei.mul(_rate) < _capacity);
        require(_maximumWei.mul(_rate) < _capacity);
        if ( stages.length > 0 ) {
            StageInfo memory prevStage = stages[stages.length - 1];
            require(_openingTime > prevStage.closing);
        }

        stages.push(StageInfo(_openingTime, _closingTime, _capacity, _minimumWei, _maximumWei, _rate, 0));

        emit StageAdded(_openingTime, _closingTime, _capacity, _minimumWei, _maximumWei, _rate);
    }

    function setToken(ACAToken _token) public onlyOwner {
        token = _token;
    }

    function enableTokenSale() public onlyOwner returns (bool) {
        require(stages.length > 0);

        vault = new RefundVault(wallet);

        tokenSaleEnabled = true;
        emit TokenSaleEnabled();
        return true;
    }

    function updateStage() public returns (uint256) {
        require(tokenSaleEnabled == true);
        require(currentStage < stages.length);
        require(now >= stages[currentStage].opening);

        uint256 remains = stages[currentStage].capacity.sub(stages[currentStage].sold);
        if ( now > stages[currentStage].closing ) {
            uint256 nextStage = currentStage.add(1);
            if ( remains > 0 && nextStage < stages.length ) {
                stages[nextStage].capacity = stages[nextStage].capacity.add(remains);
                remains = stages[nextStage].capacity;
            }

            currentStage = nextStage;
            emit StageUpdated(nextStage);
        }

        return remains;
    }

    function finalize() public onlyOwner {
        require(isFinalized == false);
        require(isClosed());

        finalization();
        emit Finalized();

        isFinalized = true;
    }

    function finalization() internal {
        if (isGoalReached()) {
            vault.close();
        } else {
            vault.enableRefunds();
        }

    }

    // transaction
    function () public payable {
        buyTokens(msg.sender);
    }

    function buyTokens(address _beneficiary) public payable {
        uint256 weiAmount = msg.value;

        _preValidatePurchase(_beneficiary, weiAmount);
        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount.mul(getCurrentRate());
    }

    function _getTokenAmountWithoutBonus(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount.mul(getRateWithoutBonus());
    }

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal isVerified(_beneficiary) {
        require(_beneficiary != address(0));
        require(_weiAmount != 0);

        require(tokenSaleEnabled == true);

        require(now >= stages[currentStage].opening);

        // lazy execution
        uint256 remains = updateStage();

        require(currentStage < stages.length);
        require(now >= stages[currentStage].opening && now <= stages[currentStage].closing);

        require(_weiAmount >= stages[currentStage].minimumWei);
        require(_weiAmount <= stages[currentStage].maximumWei);

        uint256 amount = _getTokenAmount(_weiAmount);

        require(remains >= amount);
    }

    function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        if ( getCurrentSold() == getCurrentCapacity() ) {
            currentStage = currentStage.add(1);
            emit StageUpdated(currentStage);
        }
    }

    function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
        if ( isClaimable ) {
            require(token.transferFrom(owner, _beneficiary, _tokenAmount));
        }
        else {
            sales[_beneficiary] = sales[_beneficiary].add(_tokenAmount);
        }
    }

    function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {

        stages[currentStage].sold = stages[currentStage].sold.add(_tokenAmount);
        _deliverTokens(_beneficiary, _tokenAmount);

        uint256 weiAmount = msg.value;
        address inviter = referrals[_beneficiary];
        if ( inviter != address(0x0) && referralDone == false ) {
            uint256 baseRate = _getTokenAmountWithoutBonus(weiAmount);
            uint256 referralAmountInviter = baseRate.div(100).mul(referralRateInviter);
            uint256 referralAmountInvitee = baseRate.div(100).mul(referralRateInvitee);
            uint256 referralRemains = referralAmount.sub(referralSent);
            if ( referralRemains == 0 ) {
                referralDone = true;
            }
            else {
                if ( referralAmountInviter >= referralRemains ) {
                    referralAmountInviter = referralRemains;
                    referralAmountInvitee = 0; // priority to inviter
                    emit ReferralCapReached();
                    referralDone = true;
                }
                if ( referralDone == false && referralAmountInviter >= referralRemains ) {
                    referralAmountInvitee = referralRemains.sub(referralAmountInviter);
                    emit ReferralCapReached();
                    referralDone = true;
                }

                uint256 referralAmountTotal = referralAmountInviter.add(referralAmountInvitee);
                referralSent = referralSent.add(referralAmountTotal);

                if ( referralAmountInviter > 0 ) {
                    _deliverTokens(inviter, referralAmountInviter);
                    emit PurchaseReferral(inviter, referralAmountInviter);
                }
                if ( referralAmountInvitee > 0 ) {
                    _deliverTokens(_beneficiary, referralAmountInvitee);
                    emit PurchaseReferral(_beneficiary, referralAmountInvitee);
                }
            }
        }
    }

    function _forwardFunds() internal {
        vault.deposit.value(msg.value)(msg.sender);
    }

    // claim
    function claimToken() public claimable isVerified(msg.sender) returns (bool) {
        address beneficiary = msg.sender;
        uint256 amount = sales[beneficiary];

        emit TokenClaimed(beneficiary, amount);

        sales[beneficiary] = 0;
        return token.transferFrom(owner, beneficiary, amount);
    }

    function claimRefund() isVerified(msg.sender) public {
        require(isFinalized == true);
        require(!isGoalReached());

        vault.refund(msg.sender);
    }

    function claimBountyToken() public claimable isVerified(msg.sender) returns (bool) {
        address beneficiary = msg.sender;
        uint256 amount = bounties[beneficiary];

        emit TokenClaimed(beneficiary, amount);

        bounties[beneficiary] = 0;
        return token.transferFrom(owner, beneficiary, amount);
    }

    // bounty
    function addBounty(address _address, uint256 _amount) public onlyAdmin isVerified(_address) returns (bool) {
        require(bountyAmount.sub(bountySent) >= _amount);

        bountySent = bountySent.add(_amount);
        bounties[_address] = bounties[_address].add(_amount);
        emit BountyUpdated(_address, true, _amount);
    }
    function delBounty(address _address, uint256 _amount) public onlyAdmin isVerified(_address) returns (bool) {
        require(bounties[_address] >= _amount);
        require(_amount <= bountySent);

        bountySent = bountySent.sub(_amount);
        bounties[_address] = bounties[_address].sub(_amount);
        emit BountyUpdated(_address, false, _amount);
    }
    function getBountyAmount(address _address) public view returns (uint256) {
        return bounties[_address];
    }

    // referral
    function addReferral(address _inviter, address _invitee) public onlyAdmin isVerified(_inviter) isVerified(_invitee) returns (bool) {
        referrals[_invitee] = _inviter;
    }
    function delReferral(address _inviter, address _invitee) public onlyAdmin isVerified(_inviter) isVerified(_invitee) returns (bool) {
        delete referrals[_invitee];
    }
    function getReferral(address _address) public view returns (address) {
        return referrals[_address];
    }

    // whitelist
    function _deliverWhitelistBonus(address _beneficiary) internal {
        if ( _beneficiary == address(0x0) ) {
            return;
        }

        if ( whitelistBonus[_beneficiary] == true ) {
            return;
        }
        
        if (whitelistBonusAmount.sub(whitelistBonusSent) > whitelistBonusRate ) {
            whitelistBonus[_beneficiary] = true;

            whitelistBonusSent = whitelistBonusSent.add(whitelistBonusRate);
            bounties[_beneficiary] = bounties[_beneficiary].add(whitelistBonusRate);
            emit BountyUpdated(_beneficiary, true, whitelistBonusRate);
        }
    }
    function isAccountWhitelisted(address _beneficiary) public view returns (bool) {
        return whitelist[_beneficiary];
    }

    function addToWhitelist(address _beneficiary) external onlyAdmin {
        whitelist[_beneficiary] = true;

        if ( whitelistBonus[_beneficiary] == false && now < whitelistBonusClosingTime ) {
            _deliverWhitelistBonus(_beneficiary);
        }

        emit WhitelistUpdated(_beneficiary, true);
    }

    function addManyToWhitelist(address[] _beneficiaries) external onlyAdmin {
        uint256 i = 0;
        if ( now < whitelistBonusClosingTime ) {
            for (i = 0; i < _beneficiaries.length; i++) {
                whitelist[_beneficiaries[i]] = true;
                _deliverWhitelistBonus(_beneficiaries[i]);
            }
            return;
        }

        for (i = 0; i < _beneficiaries.length; i++) {
            whitelist[_beneficiaries[i]] = true;
        }

        emit BulkWhitelistUpdated(_beneficiaries, true);
    }

    function removeFromWhitelist(address _beneficiary) external onlyAdmin {
        whitelist[_beneficiary] = false;

        emit WhitelistUpdated(_beneficiary, false);
    }

    // kyc
    function isAccountVerified(address _beneficiary) public view returns (bool) {
        return kyclist[_beneficiary];
    }

    function setAccountVerified(address _beneficiary) external onlyAdmin {
        kyclist[_beneficiary] = true;

        emit VerificationUpdated(_beneficiary, true);
    }

    function setManyAccountsVerified(address[] _beneficiaries) external onlyAdmin {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            kyclist[_beneficiaries[i]] = true;
        }

        emit BulkVerificationUpdated(_beneficiaries, true);
    }

    function unverifyAccount(address _beneficiary) external onlyAdmin {
        kyclist[_beneficiary] = false;

        emit VerificationUpdated(_beneficiary, false);
    }
}
