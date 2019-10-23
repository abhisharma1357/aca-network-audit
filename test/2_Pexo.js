const ACATokenSale = artifacts.require('ACATokenSale.sol');
const SampleERC20 = artifacts.require('SampleERC20.sol');
const ACAToken = artifacts.require('ACAToken.sol');
const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');

var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); 

//wallet address accounts[1]
//admin address accounts[2]
//total supply 10 million
//soft cap 1 million
// hardcap 5 million

contract('ACAToken Contract Unchecked functions', async (accounts) => {

  it('Should Deploy ACA Token Sale Contract', async () => {
    
    this.salenhold = await ACATokenSale.new(accounts[1],accounts[2],2000000000000000000000000000,9*10**18,20*10**18, { from : accounts[0],gas: 60000000 });
      
  });

  it('Should correctly initialize constructor values of ACA Token Sale Contract', async () => {
    
    let admin = await this.salenhold.admin.call();
    let wallet = await this.salenhold.wallet.call();
    let hardCap = await this.salenhold.hardCap.call();
    let softCap = await this.salenhold.softCap.call();
    assert.equal(admin,accounts[2]);
    assert.equal(wallet,accounts[1]);
    assert.equal(hardCap.toNumber()/10**18,20);
    assert.equal(softCap.toNumber()/10**18,9);
  });

  it('Should Deploy ACA Token Contract', async () => {
    
    this.tokenhold = await ACAToken.new(2000000000000000000000000000,this.salenhold.address,accounts[2],{ from : accounts[0],gas: 60000000 });
      
  });

  it('Should correctly initialize constructor values of ACA Token Contract', async () => {
    
    let owner = await this.tokenhold.owner.call();
    let admin = await this.tokenhold.admin.call();
    let saleAddress = await this.tokenhold.saleAddress.call();
    let totalSupply = await this.tokenhold.totalSupply();
    assert.equal(totalSupply.toNumber(),2000000000000000000000000000);
    assert.equal(owner,accounts[0]);
    assert.equal(admin,accounts[2]);
    assert.equal(saleAddress,this.salenhold.address);
  
  });

  it("Should WhiteList for accounts [4],[5],[6] using Add many users function", async () => {

    var isAccountWhitelistedBeforeAccounstFour = await this.salenhold.isAccountWhitelisted(accounts[4]);
    assert.equal(isAccountWhitelistedBeforeAccounstFour, false, 'not white listed');
    var isAccountWhitelistedBeforeAccountsFive = await this.salenhold.isAccountWhitelisted(accounts[5]);
    assert.equal(isAccountWhitelistedBeforeAccountsFive, false, 'not white listed');
    var isAccountWhitelistedBeforeAccountsSix = await this.salenhold.isAccountWhitelisted(accounts[6]);
    assert.equal(isAccountWhitelistedBeforeAccountsSix, false, 'not white listed');
    await this.salenhold.addManyToWhitelist([accounts[4],accounts[5],accounts[6]],{ from: accounts[0] });
    var isAccountWhitelistedAfterAcccountsFour = await this.salenhold.isAccountWhitelisted(accounts[4]);
    assert.equal(isAccountWhitelistedAfterAcccountsFour, true, 'not white listed');
    var isAccountWhitelistedBeforeAfterAcccountsFive = await this.salenhold.isAccountWhitelisted(accounts[5]);
    assert.equal(isAccountWhitelistedBeforeAfterAcccountsFive, true, 'not white listed');
    var isAccountWhitelistedBeforeAfterAcccountsSix = await this.salenhold.isAccountWhitelisted(accounts[6]);
    assert.equal(isAccountWhitelistedBeforeAfterAcccountsSix, true, 'not white listed');

  });

  it("Should Verify for accounts [3]", async () => {

    var isAccountVerifiedBefore = await this.salenhold.isAccountVerified(accounts[3]);
    assert.equal(isAccountVerifiedBefore, false, 'not Verified listed');
    await this.salenhold.setAccountVerified(accounts[3],{ from: accounts[0] });
    var isAccountVerifiedAfter = await this.salenhold.isAccountVerified(accounts[3]);
    assert.equal(isAccountVerifiedAfter, true, 'verified listed');

  });

  it("Should Verfiy for accounts [4],[5],[6] using Add many users function", async () => {

    var isAccountVerified4 = await this.salenhold.isAccountVerified(accounts[4]);
    assert.equal(isAccountVerified4, false, 'not white listed');
    var isAccountVerified5 = await this.salenhold.isAccountVerified(accounts[5]);
    assert.equal(isAccountVerified5, false, 'not white listed');
    var isAccountVerified6 = await this.salenhold.isAccountVerified(accounts[6]);
    assert.equal(isAccountVerified6, false, 'not white listed');
    await this.salenhold.setManyAccountsVerified([accounts[4],accounts[5],accounts[6]],{ from: accounts[0] });
    var isAccountVerified4 = await this.salenhold.isAccountVerified(accounts[4]);
    assert.equal(isAccountVerified4, true, 'not white listed');
    var isAccountVerified5 = await this.salenhold.isAccountVerified(accounts[5]);
    assert.equal(isAccountVerified5, true, 'not white listed');
    var isAccountVerified6 = await this.salenhold.isAccountVerified(accounts[6]);
    assert.equal(isAccountVerified6, true, 'not white listed');

  });

    it("Should UnVerify for accounts [6]", async () => {

      var isAccountVerifiedBefore = await this.salenhold.isAccountVerified(accounts[6]);
      assert.equal(isAccountVerifiedBefore,true, 'not Verified listed');
      await this.salenhold.unverifyAccount(accounts[6],{ from: accounts[0] });
      var isAccountVerifiedAfter = await this.salenhold.isAccountVerified(accounts[6]);
      assert.equal(isAccountVerifiedAfter,false, ' now verified listed');
  
    });
  
    it("Should remove From White list for accounts [6]", async () => {
  
      var isAccountWhitelistedBefore = await this.salenhold.isAccountWhitelisted(accounts[6]);
      assert.equal(isAccountWhitelistedBefore,true, 'not Verified listed');
      await this.salenhold.removeFromWhitelist(accounts[6],{ from: accounts[0] });
      var isAccountWhitelistedAfter = await this.salenhold.isAccountVerified(accounts[6]);
      assert.equal(isAccountWhitelistedAfter,false, ' now verified listed');
  
    });

    it("Should be able to Setup Bounty from Owner Acccounts", async () => {
      
      this.openingTime = (await latestTime());
      var _whitelistBonusClosingTime = this.openingTime + duration.seconds(500)
      await this.salenhold.setupBounty(1*10**18,2,4,1*10**18,_whitelistBonusClosingTime,1,1*10**18,{from : accounts[0] });    
      var referralAmount = await this.salenhold.referralAmount.call();
      assert.equal(referralAmount.toNumber()/10**18,1);
      var referralRateInviter = await this.salenhold.referralRateInviter.call();
      assert.equal(referralRateInviter.toNumber(),2);
      var referralRateInvitee = await this.salenhold.referralRateInvitee.call();
      assert.equal(referralRateInvitee.toNumber(),4);
      var bountyAmount = await this.salenhold.bountyAmount.call();
      assert.equal(bountyAmount.toNumber()/10**18,1);
      var whitelistBonusClosingTime = await this.salenhold.whitelistBonusClosingTime.call();
      assert.equal(whitelistBonusClosingTime.toNumber(),_whitelistBonusClosingTime);

    });

    it("Should WhiteList for accounts [3]", async () => {

      var isAccountWhitelistedBefore = await this.salenhold.isAccountWhitelisted(accounts[3]);
      assert.equal(isAccountWhitelistedBefore, false, 'not white listed');
      await this.salenhold.addToWhitelist(accounts[3],{ from: accounts[0] });
      var isAccountWhitelistedAfter = await this.salenhold.isAccountWhitelisted(accounts[3]);
      assert.equal(isAccountWhitelistedAfter, true, 'white listed');
  
    });

  it("Should be able to add Private Stage from Owner Acccounts", async () => {

    this.openingTime = (await latestTime());
    await this.salenhold.addStage(this.openingTime,this.openingTime + duration.seconds(100),5*10**18,1*10**18,4*10**18,1,{from : accounts[0] });    
  });

  it("Should be able to check private sale token sold", async () => {

    let stages = await this.salenhold.stages.call(0);
    assert.equal(stages[6].toNumber(),0);
  });

  it("Should be able to check capacity of a current stage ", async () => {

    let getCurrentCapacity = await this.salenhold.getCurrentCapacity();
    assert.equal(getCurrentCapacity.toNumber(),5*10**18);
  });

  it("Should be able to add Private sale Tokens", async () => {

    await this.salenhold.addPrivateSale(1*10**18);
    let stages = await this.salenhold.stages.call(0);
    assert.equal(stages[6].toNumber()/10**18,1);    
  });

  it("Should be able to check current stage token sold", async () => {

    let getCurrentSold = await this.salenhold.getCurrentSold();
    assert.equal(getCurrentSold.toNumber()/10**18,1);
  });

  it("Should be able to sub Private sale Tokens", async () => {
    let stages = await this.salenhold.stages.call(0);
    assert.equal(stages[6].toNumber()/10**18,1);    
    await this.salenhold.subPrivateSale(500000000000000000);
    let stagesNew = await this.salenhold.stages.call(0);
    assert.equal(stagesNew[6].toNumber(),500000000000000000);    
  });

  it("Should be able to add another Private sale Tokens", async () => {

    await this.salenhold.addPrivateSale(500000000000000000);
    let stages = await this.salenhold.stages.call(0);
    assert.equal(stages[6].toNumber()/10**18,1);    
  });

  it("Should be able to add Pre Stage from Owner Acccounts", async () => {

    this.openingTime = (await latestTime());
    this.openingTimeOfPreSale = this.openingTime + duration.seconds(100);
    this.closingTimeOfPreSale = this.openingTime + duration.seconds(200);
    await this.salenhold.addStage(this.openingTime + duration.seconds(101),this.openingTime + duration.seconds(200),6*10**18,1*10**18,2*10**18,2,{from : accounts[0] });    

  });

  it("Should be able to add Public Stage from Owner Acccounts", async () => {

    this.openingTime = (await latestTime());
    await this.salenhold.addStage(this.openingTime + duration.seconds(201),this.openingTime + duration.seconds(300),6*10**18,1*10**18,2*10**18,2,{from : accounts[0] });    

  });

  it("Should Not be able to set capacity of a stage equal to hardcap ", async () => {

try{    
  await this.salenhold.setCapacity(1,30*10**18);
   }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted '); 
   }

  });

  it("Should be able to set capacity of a stage equal to hardcap(should fail as capacity can't be equal to hardcap) ", async () => {

    let getCapacity = await this.salenhold.getCapacity(1);
    assert.equal(getCapacity.toNumber(),6*10**18);
    await this.salenhold.setCapacity(1,10*10**18);
    let getCapacityNow = await this.salenhold.getCapacity(1);
    assert.equal(getCapacityNow.toNumber(),10*10**18);

  });

  it("Should be able to set Sale Period for Pre Stage", async () => {
    this.openingTime = (await latestTime());
    await this.salenhold.setSalePeriod(1,this.openingTime + duration.seconds(100),this.openingTime + duration.seconds(210));
    let stages = await this.salenhold.stages.call(1);
    assert.equal(stages[1].toNumber(),this.openingTime + duration.seconds(210));
  });

  it("Should be able to set Rate for Pre Stage", async () => {

    let stages = await this.salenhold.stages.call(1);
    assert.equal(stages[5].toNumber(),2);
    await this.salenhold.setRate(1,1);
    let stagesNow = await this.salenhold.stages.call(1);
    assert.equal(stagesNow[5].toNumber(),1);
  });

  it("Should be able to enable Token Sale", async () => {

    this.openingTime = (await latestTime());
    await increaseTimeTo(this.openingTime + duration.seconds(102));
    let tokenSaleEnabledBefore = await this.salenhold.tokenSaleEnabled.call();
    assert.equal(tokenSaleEnabledBefore,false, 'token Sale not enabled');
    await this.salenhold.enableTokenSale({ from: accounts[0] });
    let tokenSaleEnabledAfter = await this.salenhold.tokenSaleEnabled.call();
    assert.equal(tokenSaleEnabledAfter,true, 'token Sale not enabled');
  });

  it("Should be able to buy Tokens from accounts[3] in Pre Sale", async () => {
    var getSalesBefore = await this.salenhold.getSales(accounts[3]); 
    assert.equal(getSalesBefore.toNumber(),0);
    await this.salenhold.buyTokens(accounts[3],{ from: accounts[3],value: web3.toWei("1", "ether") });
    getTotalTokenSold = await this.salenhold.getTotalTokenSold();
    assert.equal(getTotalTokenSold.toNumber()/10**18,2,'token Sold');
    var getSalesAfter = await this.salenhold.getSales(accounts[3]); 
    assert.equal(getSalesAfter.toNumber()/10**18,1);
  });

  it("Should be able to check current stage token sold", async () => {

    let getSold = await this.salenhold.getSold(1);
    assert.equal(getSold.toNumber()/10**18,1);
  });

  it("Should be able to check opening time ", async () => {

    let getOpeningTime = await this.salenhold.getOpeningTime();
    //assert.equal(getOpeningTime.toNumber(),this.openingTimeOfPreSale);
  });

  it("Should be able to check closing time ", async () => {

    let getClosingTime = await this.salenhold.getClosingTime();
    //assert.equal(getClosingTime.toNumber(),this.closingTimeOfPreSale);
  });

  it("Should invite accounts[4] by accounts[3]", async () => {

    let getReferralBefore = await this.salenhold.getReferral(accounts[4]);
    assert.equal(getReferralBefore,0x0000000000000000000000000000000000000000);  
    await this.salenhold.addReferral(accounts[3],accounts[4],{from : accounts[0]});//inviter - accounts[3], invitee - accounts[4]
    let getReferralAfter = await this.salenhold.getReferral(accounts[4]);
    assert.equal(getReferralAfter,accounts[3]);
  });

  it("Should be able to buy Tokens from accounts[4] Pre Sale", async () => {
  
    await this.salenhold.buyTokens(accounts[4],{ from: accounts[4],value: web3.toWei("1", "ether") });
    getTotalTokenSold = await this.salenhold.getTotalTokenSold();
    assert.equal(getTotalTokenSold.toNumber()/10**18,3,'token Sold');
  });

  it("Should check if soft cap Reached", async () => {
  
    isGoalReached = await this.salenhold.isGoalReached();
    assert.equal(isGoalReached,false,'soft cap');
  });

  it("Should add Token Address to Crowdsale", async () => {

    tokenAddress = await this.salenhold.token.call();
    assert.equal(tokenAddress,0x0000000000000000000000000000000000000000);  
    await this.salenhold.setToken(this.tokenhold.address,{from : accounts[0]});
    tokenAddress = await this.salenhold.token.call();
    assert.equal(tokenAddress,this.tokenhold.address);

  });

  it("Should be able to buy Tokens from accounts[4] Pre sale", async () => {
  
    await this.salenhold.buyTokens(accounts[4],{ from: accounts[4],value: web3.toWei("2", "ether") });
    getTotalTokenSold = await this.salenhold.getTotalTokenSold();
    assert.equal(getTotalTokenSold.toNumber()/10**18,5,'token Sold');
  });

  it("Should be able to check Stage of Crowdsale", async () => {

    let stage = await this.salenhold.currentStage.call();
    assert.equal(stage.toNumber(),1);     
  });

  it("Should be able to update Stage ", async () => {
    this.openingTime = (await latestTime());
    await increaseTimeTo(this.openingTime + duration.seconds(200));
    let stage = await this.salenhold.currentStage.call();
    assert.equal(stage.toNumber(),1,'current stage before');     
    await this.salenhold.updateStage({from : accounts[0]});
    let stageLater = await this.salenhold.currentStage.call();
    assert.equal(stageLater.toNumber(),2,'current stage After');     
  });

  it("Should be able to check Balance Of Smart contract", async () => {

    let vaultAddress = await this.salenhold.vault.call();
    let fundWalletAfter = await web3.eth.getBalance(vaultAddress);
    assert.equal(fundWalletAfter.toNumber()/10**18,4);
  });

  it("Should be able to check sale Status and finalize stage ", async () => {
 
    this.openingTime = (await latestTime());
    await increaseTimeTo(this.openingTime + duration.seconds(400));
    let stage = await this.salenhold.currentStage.call();
    assert.equal(stage.toNumber(),2);     
    let isFinalized = await this.salenhold.isFinalized.call();
    assert.equal(isFinalized,false);
    await this.salenhold.finalize({from : accounts[0]});
    let isFinalizedLater = await this.salenhold.isFinalized.call();
    assert.equal(isFinalizedLater,true);
    
  });

  it("Should be able to Refund Balance Of Investors", async () => {

    let vaultAddress = await this.salenhold.vault.call();
    let fundWalletBefore = await web3.eth.getBalance(vaultAddress);
    console.log(fundWalletBefore.toNumber()/10**18,'fund wallet before');
    let fundWalletaccountsOne = await web3.eth.getBalance(accounts[3]);
    console.log(fundWalletaccountsOne.toNumber()/10**18,'accounts 3 before');
    let fundWalletaccountsFour = await web3.eth.getBalance(accounts[4]);
    console.log(fundWalletaccountsFour.toNumber()/10**18,'accounts 4 before');
    await this.salenhold.claimRefund({from: accounts[3]});
    let fundWalletBefore1 = await web3.eth.getBalance(vaultAddress);
    console.log(fundWalletBefore1.toNumber()/10**18,'fund wallet After 3 withdraw');
    await this.salenhold.claimRefund({from: accounts[4]});
    let fundWalletBefore2 = await web3.eth.getBalance(vaultAddress);
    console.log(fundWalletBefore2.toNumber()/10**18,'fund wallet After 4 withdraw');
    let fundWalletaccountsOneLater = await web3.eth.getBalance(accounts[3]);
    console.log(fundWalletaccountsOneLater.toNumber()/10**18,'accounts 3 After');
    let fundWalletaccountsFourLater = await web3.eth.getBalance(accounts[4]);
    console.log(fundWalletaccountsFourLater.toNumber()/10**18,'accounts 4 after');
  });

  it('Should Deploy SampleERC20 Token Contract', async () => {
    
    this.SampleERC20 = await SampleERC20.new(accounts[0],{ from : accounts[0],gas: 60000000 });
      
  });

  it("Should be able to transfer Tokens to Token contract address ", async () => {

    var balanceContractBefore = await this.SampleERC20.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceContractBefore.toNumber(),0);  
    await this.SampleERC20.releaseTokens(this.tokenhold.address,100,{from : accounts[0]});
    var balanceContractBefore = await this.SampleERC20.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceContractBefore.toNumber()/10**18,100);  
  });

  it("Should be able to transfer Tokens from Token contract  to Owner address using Emergency drain function", async () => {

    var balanceContractBefore = await this.SampleERC20.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceContractBefore.toNumber()/10**18,100);  
    var balanceOwnerSampleTokensBefore = await this.SampleERC20.balanceOf.call(accounts[0]);
    assert.equal(balanceOwnerSampleTokensBefore.toNumber(),0);  
    await this.tokenhold.emergencyERC20Drain(this.SampleERC20.address,100*10**18,{from : accounts[0]});
    var balanceContractAfter = await this.SampleERC20.balanceOf.call(this.tokenhold.address);
    assert.equal(balanceContractAfter.toNumber(),0);  
    var balanceOwnerSampleTokensAfter = await this.SampleERC20.balanceOf.call(accounts[0]);
    assert.equal(balanceOwnerSampleTokensAfter.toNumber()/10**18,100);
  });

})

