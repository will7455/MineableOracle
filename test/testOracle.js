/** 
* This tests the oracle functions, including mining.
*/
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));
const BN = require('bn.js');
const helper = require("./helpers/test_helpers");

const Oracle = artifacts.require("./Oracle.sol"); // globally injected artifacts helper
var Reader = artifacts.require("Reader.sol");
var oracleAbi = Oracle.abi;
var oracleByte = Oracle.bytecode;

var api = 'json(https://api.gdax.com/products/BTC-USD/ticker).price';

function promisifyLogWatch(_contract,_event) {
  return new Promise((resolve, reject) => {
    web3.eth.subscribe('logs', {
      address: _contract.options.address,
      topics:  ['0xba11e319aee26e7bbac889432515ba301ec8f6d27bf6b94829c21a65c5f6ff25']
    }, (error, result) => {
        if (error){
          console.log('Error',error);
          reject(error);
        }
        web3.eth.clearSubscriptions();
        resolve(result);
    })
  });
}

contract('Mining Tests', function(accounts) {
  let oracle;
  let oracle2;
  let owner;
  let reader;
  let logNewValueWatcher;
  let logMineWatcher;

    beforeEach('Setup contract for each test', async function () {
        owner = accounts[0];
        oracle = await Oracle.new();
        oracle2 = await new web3.eth.Contract(oracleAbi,oracle.address);
        await oracle.initStake();
        await oracle.requestData(api,0);
    });

    it("getStakersCount", async function(){
        let count = await oracle.getStakersCount({from:accounts[1]});
        assert(web3.utils.hexToNumberString(count)==5, "count is 5");
    });

   it("getStakersInfo", async function(){
        let info = await oracle.getStakerInfo(accounts[1]);
        let stake = web3.utils.hexToNumberString(info['0']);
        let state = web3.utils.hexToNumberString(info['1']);
        let index = web3.utils.hexToNumberString(info['2']);
        let today = new Date()
        let today2 = today - (today % 86400);
     });
    

    it("getVariables", async function(){
        var vars = await oracle.getVariables();
        let miningApiId = web3.utils.hexToNumberString(vars['1']);
        let difficulty = web3.utils.hexToNumberString(vars['2']);
        let sapi = vars['3'];
        assert(miningApiId == 1, "miningApiId should be 1");
        assert(difficulty == 1, "Difficulty should be 1");
        assert.equal(sapi,api, "sapi = api");
    }); 

    it("Test miner", async function () {
        console.log('Oracle Address ',oracle.address);
        console.log('START MINING RIG!!');
        var val = await oracle.getVariables();
        await promisifyLogWatch(oracle2, 'NewValue');
   });
        it("Test 5 Mines", async function () {
        for(var i = 0;i < 5;i++){
            logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
            await oracle.requestData(api,0);
            var vars = await oracle.getVariables();
            let sapi = vars['3'];
            let miningApiId = web3.utils.hexToNumberString(vars['1']);
            let difficulty = web3.utils.hexToNumberString(vars['2']);
            console.log(miningApiId,difficulty,sapi)

        }
        res = logMineWatcher.args._value;
        assert(res > 0, "Ensure miners are working by checking the submitted value of 10 miners is not zero");
    });
/*
  it("Test Total Supply Increase", async function () {
        initTotalSupply = await oracle.totalSupply();
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        newTotalSupply = await oracle.totalSupply();
        payout = await oracle.payoutTotal.call();
        it= await web3.utils.fromWei(initTotalSupply, 'ether');
        ts= await web3.utils.fromWei(newTotalSupply, 'ether');
        pt= await web3.utils.fromWei(payout, 'ether');            
        assert((ts-it) == pt , "Difference should equal the payout");
    });
    it("Test Is Data", async function () {
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        res = web3.eth.abi.decodeParameters(['uint256','uint256','uint256'],logMineWatcher)
        console.log(res);
        res = logMineWatcher.args._time;
        val = logMineWatcher.args._value;
        data = await oracle.isData(res.c[0]);
        assert(data == true, "Should be true if Data exist for that point in time");
    });
    it("Test Get Last Query", async function () {
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        res = logMineWatcher.args._time;
        val = logMineWatcher.args._value;
        await oracle.getLastQuery();       
        res = await oracle.getLastQuery();
        console.log("data", res.logs[0].args);
        assert(res.logs[0].args._value > 0, "Ensure data exist for the last mine value");
    });
    
    it("Test Data Read", async function () {
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        res = logMineWatcher.args._time;
        val = logMineWatcher.args._value;      
        begbal_sender =await oracle.balanceOf(accounts[4]);
        await oracle.requestData(res.c[0],accounts[4], {from:accounts[4]});
        data = await oracle.retrieveData(res.c[0], {from:accounts[4]});
        resValue = data.logs[0].args._value;
        resSender = data.logs[0].args._sender;
        assert((resValue- 0) == (val- 0));
        endbal_sender =await oracle.balanceOf(accounts[4]);
        assert(begbal_sender - endbal_sender == web3.toWei(1, 'ether'), "Should be equal to fee per read");
        assert(begbal_sender - endbal_sender == readFee, "Should be equal to readfee per read");
    });

   it("Test Miner Payout", async function () {
        balances = []
        for(var i = 0;i<6;i++){
            balances[i] = await oracle.balanceOf(accounts[i]);
            console.log("balance",i, web3.utils.hexToNumberString(balances[i]));
        }
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        new_balances = []
        for(var i = 0;i<6;i++){
            new_balances[i] = await oracle.balanceOf(accounts[i]);
            console.log("new balance",i, web3.utils.hexToNumberString(new_balances[i]));
        }
        assert((web3.utils.hexToNumberString(new_balances[5]) - web3.utils.hexToNumberString(balances[5])) == web3.utils.toWei('1', 'ether'));
        assert((web3.utils.hexToNumberString(new_balances[1]) - web3.utils.hexToNumberString(balances[1])) == web3.utils.toWei('5', 'ether'));
        assert((web3.utils.hexToNumberString(new_balances[2]) - web3.utils.hexToNumberString(balances[2])) == web3.utils.toWei('10', 'ether'));
        assert((web3.utils.hexToNumberString(new_balances[3]) - web3.utils.hexToNumberString(balances[3])) == web3.utils.toWei('5', 'ether'));
        assert((web3.utils.hexToNumberString(new_balances[4]) - web3.utils.hexToNumberString(balances[4])) == web3.utils.toWei('1', 'ether'));
        //assert((web3.utils.hexToNumberString(new_balances[4]) - web3.utils.hexToNumberString(balances[4])) == web3.utils.toWei('1.1', 'ether'));
    });
    
   it("Test Difficulty Adjustment", async function () {
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        vars = await oracle.getVariables();
        assert(vars[2] = 2);//difficulty not changing.....
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        vars = await oracle.getVariables();
        assert(vars[2] = 3);
    });
    it("Test didMine ", async function () {
        vars = await oracle.getVariables();
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        didMine = oracle.didMine(vars[0],accounts[1]);
        assert(didMine);
    });

     it("Test Get MinersbyValue ", async function () {
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        ///get the timestamp from the emit newValue log...
        res = logMineWatcher.args._time;
        console.log("res",res);
        miners = await oracle.getMinersByValue(1, res);
        assert(miners = [accounts[4],accounts[3],accounts[2],accounts[1],accounts[5]])
    });


    it("Test contract read no tokens", async function(){
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        res = logMineWatcher.args._time;
        val = logMineWatcher.args._value;      
        balance = await oracle.balanceOf(readcontract.address);
        await helper.expectThrow(readcontract.getLastValue(oracle.address));
        balance1 = await oracle.balanceOf(readcontract.address);
    });

    it("Test read request data", async function(){
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        res = logMineWatcher.args._time;  
        await oracle.requestData(res.c[0],accounts[4], {from:accounts[4]});
        info = await oracle.getRequest(res.c[0],accounts[4])
        assert(info.toNumber() > 0, "request should work")
    }); 
    it("Test dev Share", async function(){
        begbal = await oracle.balanceOf(accounts[0]);
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        endbal = await oracle.balanceOf(accounts[0]);
        devshare = await oracle.devShare.call();
        payout = await oracle.payoutTotal.call();
        console.log('payoutdev',(endbal - begbal),payout.toNumber(),devshare.toNumber())
        assert((endbal - begbal)/1e18  - (payout.toNumber() * devshare.toNumber())/1e18 < .1, "devShare")
    }); 
    
    it("Test miner, alternating api request on Q and auto select", async function () {
        await oracle.requestData(api,1);
        await oracle.requestData(api2,10);
        await oracle.requestData(api,11);
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        //console.log("value", logMineWatcher.args[0]._value);
        //console.log("value", logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._apiId);
        //assert(logMineWatcher.args[1]._value > 0, "The value submitted by the miner should not be zero");
        await oracle.requestData(api2,15);
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        //console.log("value", logMineWatcher.args[0]._value);
        //console.log("value", logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._apiId);
        //assert(logMineWatcher.args[1]._value > 0, "The value submitted by the miner should not be zero");
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        //console.log("value", logMineWatcher.args[0]._value);
        //console.log("value", logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._apiId);
        //assert(logMineWatcher.args[1]._value > 0, "The value submitted by the miner should not be zero");
    });

    it("Test dispute", async function () {
        balance1 = await (oracle.balanceOf(accounts[2],{from:accounts[4]}));
        //request two apis
        await oracle.requestData(api,1);
        await oracle.requestData(api2,10);
        await oracle.requestData(api,11);

        //mine and record for api request
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        _timestamp = web3.utils.hexToNumberString(logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._value);
        //console.log("value", logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._apiId);
        //assert(logMineWatcher.args[1]._value > 0, "The value submitted by the miner should not be zero");
        
        //mine and record for api2 request
        await oracle.requestData(api2,15);
        await helper.advanceTime(10 * 1);
        logMineWatcher = await promisifyLogWatch(oracle2, 'NewValue');//or Event Mine?
        //console.log("value", logMineWatcher.args[0]._value);
        _timestamp2 = web3.utils.hexToNumberString(logMineWatcher.args[0]._time);
        _apiId2 = web3.utils.hexToNumberString(logMineWatcher.args[0]._apiId);
        //console.log("value", logMineWatcher.args[0]._time);
        //console.log("value", logMineWatcher.args[0]._apiId);
        //assert(logMineWatcher.args[1]._value > 0, "The value submitted by the miner should not be zero");
        apid2value = await oracle.retrieveData(_apiId2, _timestamp2);
        console.log("apid2value", apid2value);
        await helper.advanceTime(30 * 1);

        //getApiForTime
        apiidt1 = await oracle.getApiForTime(_timestamp);
        assert(apiidt1 == 1, "should be 1");
        apiidt2 = await oracle.getApiForTime(_timestamp2);
        assert(apiidt2 == _apiId2, "should be 2 or apiid2");
        blocknum = awaot oracle.getMinedBlockNum(_apiId2, _timestamp2);

        //intiate dispute on api2
        await oracle.initDispute(_apiId2, _timestamp2, {from:accounts[5]});
        count = await oracle.countDisputes();
        console.log('dispute count:', web3.utils.hexToNumberString(count));
        await oracle.vote(_apiId2, true, {from:accounts[5]});
        await helper.timeTravel(86400 * 8);
        await oracle.tallyVotes(_apiId2);
        dispInfo = await oracle.getDisputeInfo(_apiId2);
        console.log("dispInfo", dispInfo);
        voted = await.didVote(1, accounts[0]);
        assert(voted == true, "account 0 voted");
        voted = await.didVote(1, accounts[5]);
        assert(voted == false, "account 5 did not vote");
        alldisp = await oracle.getDisputesIds();
        console.log("alldisp", alldisp);
        apid2valueF = await oracle.retrieveData(_apiId2, _timestamp2);
        console.log("apid2value", apid2valueF);
        assert(apid2valueF == 0 ,"value should now be zero this checks updateDisputeValue-internal fx  works");
        balance2 = await (oracle.balanceOf(accounts[2],{from:accounts[4]}));
    });
    */
});