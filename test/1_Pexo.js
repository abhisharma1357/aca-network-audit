const ACATokenSale = artifacts.require('ACATokenSale.sol');
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

contract('ACAToken Contract', async (accounts) => {

  it('Should Deploy ACA Token Sale Contract', async () => {
    
    this.salenhold = await ACATokenSale.new(accounts[1],accounts[2],2000000000000000000000000000,2*10**18,20*10**18, { from : accounts[0],gas: 60000000 });
      
  });

  it('Should correctly initialize constructor values of ACA Token Sale Contract', async () => {
    
    let admin = await this.salenhold.admin.call();
    let wallet = await this.salenhold.wallet.call();
    let hardCap = await this.salenhold.hardCap.call();
    let softCap = await this.salenhold.softCap.call();
    assert.equal(admin,accounts[2]);
    assert.equal(wallet,accounts[1]);
    assert.equal(hardCap.toNumber()/10**18,20);
    assert.equal(softCap.toNumber()/10**18,2);
  });

  it('Should Not Deploy ACA Token Contract with same owner and Admin address', async () => {
    
  try{
      await ACAToken.new(2000000000000000000000000000,this.salenhold.address,accounts[2],{ from : accounts[0],gas: 60000000 });
    
  }catch(error){    
      var error_ = 'VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }
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

  it("Should Not WhiteList for accounts [3] by Non Admin Acoounts", async () => {

  try{
    var isAccountWhitelistedBefore = await this.salenhold.isAccountWhitelisted(accounts[3]);
    assert.equal(isAccountWhitelistedBefore, false, 'not white listed');
    await this.salenhold.addToWhitelist(accounts[3],{ from: accounts[3] });
    }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
}
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

  it("Should Not Verify accounts [3] by Non Admin Accounts", async () => {
   try{
    var isAccountVerifiedBefore = await this.salenhold.isAccountVerified(accounts[3]);
    assert.equal(isAccountVerifiedBefore, false, 'not Verified listed');
    await this.salenhold.setAccountVerified(accounts[3],{ from: accounts[3] });
   }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
}
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

  it("Should Not Verify accounts [6] from Non Owner Accounts", async () => {

    try{
      var isAccountVerifiedBefore = await this.salenhold.isAccountVerified(accounts[6]);
      assert.equal(isAccountVerifiedBefore,true, ' now verified listed');
      await this.salenhold.setAccountVerified(accounts[6],{ from: accounts[2] });
    }catch(error){
      var error_ = 'VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }
  });

    it("Should Not add to whitelist accounts [6] from Non Owner Accounts", async () => {

      try{

        var isAccountWhitelisted = await this.salenhold.isAccountVerified(accounts[6]);
        assert.equal(isAccountWhitelisted,true, ' now verified listed');
        await this.salenhold.addToWhitelist(accounts[6],{ from: accounts[2] });     
       }catch(error){
          var error_ = 'VM Exception while processing transaction: revert';
        assert.equal(error.message, error_, 'Reverted ');
      }
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

  it("Should Not be able to add Stage from non Owner Acccounts", async () => {

  try{
     this.openingTime = (await latestTime());
     await this.salenhold.addStage(this.openingTime,this.openingTime + duration.seconds(100),5*10**18,1*10**18,2*10**18,1,{from : accounts[3] });    
    }catch(error){
     var error_ = 'VM Exception while processing transaction: revert';
     assert.equal(error.message, error_, 'Reverted ');
  } 
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

  it("Should Not be able to enable Token Sale from Non Owner Accounts", async () => {
    try {
      let tokenSaleEnabledBefore = await this.salenhold.tokenSaleEnabled.call();
      assert.equal(tokenSaleEnabledBefore,false, 'token Sale not enabled');
      await this.salenhold.enableTokenSale({ from: accounts[1] });
    }catch(error){
      var error_ = 'VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted ');
    }
  });

  it("Should be able to add Pre Stage from Owner Acccounts", async () => {

    this.openingTime = (await latestTime());
    this.openingTimeOfPreSale = this.openingTime + duration.seconds(100);
    this.closingTimeOfPreSale = this.openingTime + duration.seconds(200);
    await this.salenhold.addStage(this.openingTime + duration.seconds(101),this.openingTime + duration.seconds(200),6*10**18,1*10**18,2*10**18,2,{from : accounts[0] });    

  });

  it("Should be able to set capacity of a stage equal to hardcap(should fail as capacity can't be equal to hardcap) ", async () => {

    let getCapacity = await this.salenhold.getCapacity(1);
    assert.equal(getCapacity.toNumber(),6*10**18);
    await this.salenhold.setCapacity(1,10*10**18);
    let getCapacityNow = await this.salenhold.getCapacity(1);
    assert.equal(getCapacityNow.toNumber(),10*10**18);

  });

  it("Should be able to check opening time through stage ", async () => {

    let getOpeningTime = await this.salenhold.getOpeningTimeByStage(1);
    //assert.equal(getOpeningTime.toNumber(),this.openingTimeOfPreSale);
  });

  it("Should be able to check closing time through stage", async () => {

    let getClosingTime = await this.salenhold.getClosingTimeByStage(1);
    //assert.equal(getClosingTime.toNumber(),this.closingTimeOfPreSale);
  });

  it("Should be able to check capacity of a stage ", async () => {

    let getCapacity = await this.salenhold.getCapacity(1);
    assert.equal(getCapacity.toNumber(),10*10**18);
  });

  it("Should be able to check Rate of a stage ", async () => {

    let getRate = await this.salenhold.getRate(1);
    assert.equal(getRate.toNumber(),2);
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

  it("Should be able to check Token Sale is enabled or not", async () => {

    let isEnabled = await this.salenhold.isEnabled.call();
    assert.equal(isEnabled,false, 'token Sale not enabled');
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

  it("Should Not be able to buy Tokens from Non KYC, Whitelist accounts ", async () => {

try{
   var isAccountWhitelistedAfter = await this.salenhold.isAccountVerified(accounts[6]);
   assert.equal(isAccountWhitelistedAfter,false, ' now verified listed');   
   var isAccountVerifiedAfter = await this.salenhold.isAccountVerified(accounts[6]);
   assert.equal(isAccountVerifiedAfter,false, ' now verified listed');
   await this.salenhold.buyTokens(accounts[6],{ from: accounts[6],value: web3.toWei("1", "ether") });
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  } 
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
    assert.equal(isGoalReached,true,'soft cap');
  });

  it("Should add Token Address to Crowdsale", async () => {

    tokenAddress = await this.salenhold.token.call();
    assert.equal(tokenAddress,0x0000000000000000000000000000000000000000);  
    await this.salenhold.setToken(this.tokenhold.address,{from : accounts[0]});
    tokenAddress = await this.salenhold.token.call();
    assert.equal(tokenAddress,this.tokenhold.address);

  });

  it("Should Not be able to set Claimable to True from Non Owner Accounts", async () => {

  try{
    let claimable = await this.salenhold.isClaimable();
    assert.equal(claimable,false);  
    await this.salenhold.setClaimable(true,{from: accounts[1]});
   }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
   }

  });

  it("Should set Claimable to True", async () => {

    let claimableBefore = await this.salenhold.isClaimable()
    assert.equal(claimableBefore,false);
    await this.salenhold.setClaimable(true,{from: accounts[0]});
    let claimable = await this.salenhold.isClaimable();
    assert.equal(claimable,true);
  });

  it("Should Not be able to claim Tokens for Non Participant Accounts[6]", async () => {

  try{
    var sales = await this.salenhold.sales(accounts[6]); 
    assert.equal(sales.toNumber(),0);
    await this.salenhold.claimToken({from : accounts[6]});
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }  

  });

  it("Should claim Tokens for Accounts[3]", async () => {

    var balanceAccountThree = await this.tokenhold.balanceOf(accounts[3]); 
    assert.equal(balanceAccountThree.toNumber(),0);
    await this.salenhold.claimToken({from : accounts[3]});
    var balanceAccountThreeAfter = await this.tokenhold.balanceOf(accounts[3]); 
    assert.equal(balanceAccountThreeAfter.toNumber()/10**18,1.02,'including referral bonus');

  });

  it("Should claim Tokens for Accounts[4]", async () => {

    var balanceAccountFour = await this.tokenhold.balanceOf(accounts[4]); 
    assert.equal(balanceAccountFour.toNumber(),0);
    await this.salenhold.claimToken({from : accounts[4]});
    var balanceAccountFourLater = await this.tokenhold.balanceOf(accounts[4]); 
    assert.equal(balanceAccountFourLater.toNumber()/10**18,1.04,'including referral bonus');

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

  it("Should claim Tokens for Accounts[4](Fail)", async () => {

    var balanceAccountFour = await this.tokenhold.balanceOf(accounts[4]); 
    assert.equal(balanceAccountFour.toNumber()/10**18,3.12);
    await this.salenhold.claimToken({from : accounts[4]});
    var balanceAccountThreeFour = await this.tokenhold.balanceOf(accounts[4]); 
    assert.equal(balanceAccountThreeFour.toNumber()/10**18,3.12);

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
    await increaseTimeTo(this.openingTime + duration.seconds(200));
    let stage = await this.salenhold.currentStage.call();
    assert.equal(stage.toNumber(),2);     
    let isFinalized = await this.salenhold.isFinalized.call();
    assert.equal(isFinalized,false);
    await this.salenhold.finalize({from : accounts[0]});
    let isFinalizedLater = await this.salenhold.isFinalized.call();
    assert.equal(isFinalizedLater,true);
    
  });

  it("Should Not be able to finalize stage Once it's finalized", async () => {
  try{
  
    let isFinalizedLater = await this.salenhold.isFinalized.call();
    assert.equal(isFinalizedLater,true);
    await this.salenhold.finalize({from : accounts[0]});
  }catch(error){
    var error_ = 'VM Exception while processing transaction: revert';
    assert.equal(error.message, error_, 'Reverted ');
  }
  });

  it("Should be able to check Balance Of Smart contract vault After Finalization", async () => {

    let vaultAddress = await this.salenhold.vault.call();
    let fundWalletAfter = await web3.eth.getBalance(vaultAddress);
    assert.equal(fundWalletAfter.toNumber(),0);
  });

  it("Should WhiteList for accounts [6] to Send Bounty Tokens ", async () => {

    var isAccountWhitelistedBefore = await this.salenhold.isAccountWhitelisted(accounts[6]);
    assert.equal(isAccountWhitelistedBefore, false, 'not white listed');
    await this.salenhold.addToWhitelist(accounts[6],{ from: accounts[0] });
    var isAccountWhitelistedAfter = await this.salenhold.isAccountWhitelisted(accounts[6]);
    assert.equal(isAccountWhitelistedAfter, true, 'white listed');

  });

  it("Should Verify for accounts [6] to Send Bounty Tokens", async () => {

    var isAccountVerifiedBefore = await this.salenhold.isAccountVerified(accounts[6]);
    assert.equal(isAccountVerifiedBefore, false, 'not Verified listed');
    await this.salenhold.setAccountVerified(accounts[6],{ from: accounts[0] });
    var isAccountVerifiedAfter = await this.salenhold.isAccountVerified(accounts[6]);
    assert.equal(isAccountVerifiedAfter, true, 'verified listed');

  });

  it("Should Not be able to Add Bounty Tokens to accounts[6] from Non owner accounts", async () => {

try{    
   var bountySent = await this.salenhold.bountySent.call();
   assert.equal(bountySent.toNumber(),0);
   await this.salenhold.addBounty(accounts[6],500000000000000000,{ from: accounts[6] });
   }catch(error){
   var error_ = 'VM Exception while processing transaction: revert';
   assert.equal(error.message, error_, 'Reverted ');
}
});

  it("Should Add Bounty Tokens to accounts[6] from owner", async () => {

    var bountySent = await this.salenhold.bountySent.call();
    assert.equal(bountySent.toNumber(),0);
    await this.salenhold.addBounty(accounts[6],1*10**18,{ from: accounts[0] });
    var bountySentLater = await this.salenhold.bountySent.call();
    assert.equal(bountySentLater.toNumber(),1*10**18);
    var bounties = await this.salenhold.bounties.call(accounts[6]);
    assert.equal(bounties.toNumber(),1*10**18);

  });

  it("Should check Bounty Tokens of accounts[6] ", async () => {

    var getBountyAmount = await this.salenhold.getBountyAmount(accounts[6]);
    assert.equal(getBountyAmount.toNumber(),1*10**18);

  });

  it("Should Delete Bounty Tokens of accounts[6] from owner (failed)", async () => {

    var bountySent = await this.salenhold.bountySent.call();
    assert.equal(bountySent.toNumber(),1*10**18);
    await this.salenhold.delBounty(accounts[6],500000000000000000,{ from: accounts[0] });
    var bountySentLater = await this.salenhold.bountySent.call();
    assert.equal(bountySentLater.toNumber(),500000000000000000);
    var bounties = await this.salenhold.bounties.call(accounts[6]);
    assert.equal(bounties.toNumber(),500000000000000000);

  });

  it("Should claim Bounty Tokens for Accounts[6]", async () => {

    var balanceAccountSix = await this.tokenhold.balanceOf(accounts[6]); 
    assert.equal(balanceAccountSix.toNumber(),0);
    await this.salenhold.claimBountyToken({from : accounts[6]});
    var balanceAccountThreeAfter = await this.tokenhold.balanceOf(accounts[6]); 
    assert.equal(balanceAccountThreeAfter.toNumber()/10**18,0.5);

  });

  //owner for sale contract is accounts[9] Now
  it("Should be able to Transfer ownership", async () => {

    let owner = await this.salenhold.owner.call();
    assert.equal(owner, accounts[0]);
    await this.salenhold.transferOwnership(accounts[9], { from: accounts[0] });
    let ownerNew = await this.salenhold.owner.call();
    assert.equal(ownerNew, accounts[9], 'Transfered ownership');
 
  });

  //Admin for sale  is accounts[0]
  it("Should be able to Transfer Admin", async () => {

    let admin = await this.salenhold.admin.call();
    assert.equal(admin, accounts[2]);
    await this.salenhold.setAdmin(accounts[0], { from: accounts[9] });
    let adminNew = await this.salenhold.admin.call();
    assert.equal(adminNew, accounts[0], 'Transfered Admin');
 
  });

  it("Should be able to check Total Supply of token contract", async () => {

    var totalSupply = await this.tokenhold.totalSupply();
    assert.equal(totalSupply.toNumber()/10**18,2000000000);
 
  });

  it("Should be able to check Tokens are transferable or not", async () => {

    var isTransferable = await this.tokenhold.isTransferable();
    assert.equal(isTransferable,false);
 
  });

  it("Should Not be able to transfer Tokens before transferable is enable", async () => {

try{    
   var balanceAccountThreeBefore = await this.tokenhold.balanceOf(accounts[3]); 
   assert.equal(balanceAccountThreeBefore.toNumber()/10**18,1.06);
   await this.tokenhold.transfer(accounts[6], 1000000000000000000, { from: accounts[3], gas: 5000000 });
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');  
}
});

  it("Should be able to check Balanceof owner", async () => {

    var balanceOfOwner = await this.tokenhold.balanceOfOwner();
    assert.equal(balanceOfOwner.toNumber()/10**18,1999999995.32);
 
  });

  //owner for token contract is accounts[9] Now
  it("Should be able to Transfer ownership", async () => {

    let owner = await this.tokenhold.owner.call();
    assert.equal(owner, accounts[0]);
    await this.tokenhold.transferOwnership(accounts[9], { from: accounts[0] });
    let ownerNew = await this.tokenhold.owner.call();
    assert.equal(ownerNew, accounts[9], 'Transfered ownership');
 
  });

  //Admin for token  is accounts[0]
  it("Should be able to Transfer Admin", async () => {

    let admin = await this.tokenhold.admin.call();
    assert.equal(admin, accounts[2]);
    await this.tokenhold.transferAdmin(accounts[0], { from: accounts[9] });
    let adminNew = await this.tokenhold.admin.call();
    assert.equal(adminNew, accounts[0], 'Transfered Admin');
 
  });

  it("Should Not be able to enable transferable by Non Admin Accounts", async () => {

try{    
  var isTransferable = await this.tokenhold.isTransferable();
  assert.equal(isTransferable,false);
  await this.tokenhold.setTransferable(true,{from : accounts[1]}) 
}catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted ');  
}
});

it("Should be able to enable transferable ", async () => {

 var isTransferable = await this.tokenhold.isTransferable();
 assert.equal(isTransferable,false);
 await this.tokenhold.setTransferable(true,{from : accounts[0]}) 
 var isTransferableLater = await this.tokenhold.isTransferable();
 assert.equal(isTransferableLater,true);
});

it("Should check transfer allowed or Not ", async () => {

  var transferAllowed = await this.tokenhold.transferAllowed(accounts[3]);
  assert.equal(transferAllowed,true);
 });

 it("Should be able to transfer Tokens after transferable is enable", async () => {

     var balanceAccountSixBefore = await this.tokenhold.balanceOf(accounts[6]); 
     assert.equal(balanceAccountSixBefore.toNumber()/10**18,0.5);
     var balanceAccountFourBefore = await this.tokenhold.balanceOf(accounts[4]); 
     assert.equal(balanceAccountFourBefore.toNumber()/10**18,3.12);
     await this.tokenhold.transfer(accounts[6], 1000000000000000000, { from: accounts[4], gas: 5000000 });
     var balanceAccountFourAfter = await this.tokenhold.balanceOf(accounts[4]); 
     assert.equal(balanceAccountFourAfter.toNumber()/10**18,2.12);
     var balanceAccountSixAfter = await this.tokenhold.balanceOf(accounts[6]); 
     assert.equal(balanceAccountSixAfter.toNumber()/10**18,1.5);
    });

    it("should Approve address to spend specific token ", async () => {

      this.tokenhold.approve(accounts[7], 1000000000000000000, { from: accounts[4] });
      let allowance = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowance, 1000000000000000000, "allowance is wrong when approve");
  
    });
  
    it("should be able to increase Approval ", async () => {
  
      let allowance1 = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowance1, 1000000000000000000, "allowance is wrong when increase approval");
      this.tokenhold.increaseApproval(accounts[7], 1000000000000000000, { from: accounts[4] });
      let allowanceNew = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowanceNew, 2000000000000000000, "allowance is wrong when increase approval done");
  
    });

    it("should be able to decrease Approval ", async () => {
  
      let allowance1 = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowance1, 2000000000000000000, "allowance is wrong when increase approval");
      this.tokenhold.decreaseApproval(accounts[7], 1000000000000000000, { from: accounts[4] });
      let allowanceNew = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowanceNew, 1000000000000000000, "allowance is wrong when increase approval done");
  
    });
  
    it("Should be able to transfer Tokens on the behalf of accounts[4]", async () => {
  
      let allowanceNew = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowanceNew.toNumber(), 1000000000000000000, "allowance is wrong before");
      await this.tokenhold.transferFrom(accounts[4],accounts[7],1000000000000000000,{from : accounts[7]});
      let allowanceNew1 = await this.tokenhold.allowance.call(accounts[4], accounts[7]);
      assert.equal(allowanceNew1.toNumber(), 0, "allowance is wrong After");
      var balanceAccountSeven = await this.tokenhold.balanceOf.call(accounts[7]);
      assert.equal(balanceAccountSeven.toNumber()/10**18,1);  
    });

    it("Should Not be able to Burn Tokens larger than balance", async () => {

    try{     
      var balanceOfAccountSeven = await this.tokenhold.balanceOf.call(accounts[7]);
      assert.equal(balanceOfAccountSeven.toNumber() / 10 ** 18, 1);
      var totalSupplyBeforeBurn = await this.tokenhold.totalSupply();
      assert.equal(totalSupplyBeforeBurn.toNumber()/10**18,2000000000);
      await this.tokenhold.burn(2000000000000000000, { gas: 5000000,from : accounts[7] });
      }catch(error){
      var error_ = 'VM Exception while processing transaction: revert';
      assert.equal(error.message, error_, 'Reverted '); 
    }
    });

    it("Should be able to Burn Tokens from token Contract", async () => {

      var balanceOfAccountSeven = await this.tokenhold.balanceOf.call(accounts[7]);
      assert.equal(balanceOfAccountSeven.toNumber() / 10 ** 18, 1);
      var totalSupplyBeforeBurn = await this.tokenhold.totalSupply();
      assert.equal(totalSupplyBeforeBurn.toNumber()/10**18,2000000000);
      await this.tokenhold.burn(1000000000000000000, { gas: 5000000,from : accounts[7] });
      var balanceOfAccountSevenLater = await this.tokenhold.balanceOf.call(accounts[5]);
      assert.equal(balanceOfAccountSevenLater.toNumber(),0);
      let totalSupplyLater = await this.tokenhold.totalSupply.call();
      assert.equal(totalSupplyLater.toNumber()/10**18,1999999999,'total supply After burn');  
    });

  it("Should be able to Lock transfer for particular Account ", async () => {

      var transferAllowed = await this.tokenhold.transferAllowed(accounts[3]);
      assert.equal(transferAllowed,true);
      await this.tokenhold.manageTransferLock(accounts[3],true,{from : accounts[9]}); 
      var transferAllowedLater = await this.tokenhold.transferAllowed(accounts[3]);
      assert.equal(transferAllowedLater,false);
  });

  it("Should Not be able to transfer Tokens after locked by Owner", async () => {

  try{
  var balanceAccountThree = await this.tokenhold.balanceOf(accounts[3]); 
  assert.equal(balanceAccountThree.toNumber()/10**18,1.06);
  await this.tokenhold.transfer(accounts[6], 1000000000000000000, { from: accounts[3], gas: 5000000 });
  }catch(error){
  var error_ = 'VM Exception while processing transaction: revert';
  assert.equal(error.message, error_, 'Reverted '); 
}
});

  it("Should be able to UnLock transfer for particular Account ", async () => {

    var transferAllowed = await this.tokenhold.transferAllowed(accounts[3]);
    assert.equal(transferAllowed,false);
    await this.tokenhold.manageTransferLock(accounts[3],false,{from : accounts[9]}); 
    var transferAllowedLater = await this.tokenhold.transferAllowed(accounts[3]);
    assert.equal(transferAllowedLater,true);
});

it("Should be able to Lock transfer for Own Account ", async () => {

  var transferAllowed = await this.tokenhold.transferAllowed(accounts[3]);
  assert.equal(transferAllowed,true);
  await this.tokenhold.transferLock({from : accounts[3]}); 
  var transferAllowedLater = await this.tokenhold.transferAllowed(accounts[3]);
  assert.equal(transferAllowedLater,false);
});

it("Should be able to check previous and current owner balance", async () => {

  var balanceOfPreviousOwner = await this.tokenhold.balanceOf.call(accounts[0]);
  assert.equal(balanceOfPreviousOwner.toNumber() / 10 ** 18,1999999995.32);
  var balanceOfNewOwner = await this.tokenhold.balanceOf.call(accounts[9]);
  assert.equal(balanceOfNewOwner.toNumber() / 10 ** 18, 0);
});

it("Should be able to check allowance of Previous owner to Token Contract", async () => {

  let allowance = await this.tokenhold.allowance.call(accounts[0],this.salenhold.address);
  assert.equal(allowance.toNumber()/10**18,1999999995.32, "allowance is wrong when approve");
});

it("Should be able to check allowance of New owner to Token Contract", async () => {

  let allowance = await this.tokenhold.allowance.call(accounts[9],this.salenhold.address);
  assert.equal(allowance,0, "allowance is wrong when approve");
});

})

