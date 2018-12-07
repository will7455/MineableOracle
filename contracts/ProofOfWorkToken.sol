pragma solidity ^0.4.24;

import "./libraries/SafeMath.sol";
import "./Token.sol";
import "./CloneFactory.sol";
import "./OracleToken.sol";

/**
* @title Proof of Work token
* This is the master token where you deploy new oracles from.  
* Each oracle gets the API value specified
*/

contract ProofOfWorkToken is Token, CloneFactory {

    using SafeMath for uint256;

    /*Variables*/
    string public constant name = "Proof-of-Work Oracle Token";
    string public constant symbol = "POWO";
    uint8 public constant decimals = 18;
    uint public firstDeployedTime;
    uint public firstWeekCount = 0;
    uint public lastDeployedTime;
    address public dud_Oracle;
    address public owner;
    OracleDetails[] public oracle_list;
    mapping(address => uint) oracle_index;

    struct OracleDetails {
        string API;
        address location;
    }

    /*Events*/
    event Deployed(string _api,address _newOracle);
    
    /*Modifiers*/
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /*Functions*/
    constructor(address _dud_Oracle) public{
        owner = msg.sender;
        dud_Oracle = _dud_Oracle;
        firstDeployedTime = now - (now % 86400);
        lastDeployedTime = now - (now % 86400);
        oracle_list.push(OracleDetails({
            API: "",
            location: address(0)
        }));
    }

    /**
    * @dev Deploys new oracles. It allows up to 10 oracles to be deployed the first week 
    * the ProofOfOWorkToken contract is deployed and 1 oracle per week thereafter.  
    * @param _api is the oracle api
    * @param _readFee is the fee for reading oracle information
    * @param _timeTarget for the dificulty adjustment
    * @param _payoutStructure for miners
    */
    function deployNewOracle(string _api,uint _readFee,uint _timeTarget,uint[5] _payoutStructure) public onlyOwner() {
        uint _calledTime = now - (now % 86400);
        uint _payout;
        for(uint i = 0;i<5;i++){
            _payout += _payoutStructure[i];
        }
        require(_payout.mul(86400).div(_timeTarget) <=  25*1e18);
        require(firstWeekCount <= 9 && (_calledTime - firstDeployedTime) <= 604800 || _calledTime >= (lastDeployedTime + 604800));
            if (firstWeekCount <= 9 && (_calledTime - firstDeployedTime) <= 604800){
                firstWeekCount++; 
                deployNewOracleHelper(_api, _readFee, _timeTarget, _payoutStructure);
            } else if (_calledTime >= (lastDeployedTime + 604800)) {
                lastDeployedTime = _calledTime;
                deployNewOracleHelper(_api, _readFee, _timeTarget, _payoutStructure);
            }
    }

    /**
    * @dev Helps Deploy a new oracle 
    * @param _api is the oracle api
    * @param _readFee is the fee for reading oracle information
    * @param _timeTarget for the dificulty adjustment
    * @param _payoutStructure for miners
    * @return new oracle address
    */
    function deployNewOracleHelper(string _api,uint _readFee,uint _timeTarget,uint[5] _payoutStructure) internal returns(address){
        address new_oracle = createClone(dud_Oracle);
        OracleToken(new_oracle).init(address(this),_readFee,_timeTarget,_payoutStructure);
        oracle_index[new_oracle] = oracle_list.length;
        oracle_list.length++;
        OracleDetails storage _current = oracle_list[oracle_list.length-1]; 
        _current.API = _api;
        _current.location = new_oracle; 
        emit Deployed(_api, new_oracle);
        return new_oracle; 
    }

    /**
    * @dev Allows for a transfer of tokens to the first 5 _miners that solve the challenge and 
    * updates the total_supply of the token(total_supply is saved in token.sol)
    * The function is called by the OracleToken.retrievePayoutPool and OracleToken.pushValue.
    * Only oracles that have this ProofOfWOrkToken address as their master contract can call this 
    * function
    * @param _miners The five addresses to send tokens to
    * @param _amount The amount of tokens to send to each address
    * @param _isMine is true if the timestamp has been mined and miners have been paid out
    */
    function batchTransfer(address[5] _miners, uint256[5] _amount, bool _isMine) external{
        require(oracle_index[msg.sender] > 0);
        uint _paid;
        for (uint i = 0; i < _miners.length; i++) {
            if (balanceOf(address(this)) >= _amount[i]
            && _amount[i] > 0
            && balanceOf(_miners[i]).add(_amount[i]) > balanceOf(_miners[i])) {
                doTransfer(address(this),_miners[i],_amount[i]);
                _paid += _amount[i];

            }
        }
        if(_isMine){
            total_supply += _paid;
        }
    }


    /**
    * @dev Allows the OracleToken.RetreiveData to transfer the fee paid to retreive
    * data back to this contract
    * @param _from address to transfer from
    * @param _amount to transfer
    * @return true after transfer 
    */
    function callTransfer(address _from,uint _amount) public returns(bool){
        require(oracle_index[msg.sender] > 0);
        doTransfer(_from,address(this), _amount);
        return true;
    }

    /**
    * @dev Getter function that gets the oracle API
    * @param _oracle is the oracle address to look up
    * @return the API and oracle address
    */
    function getDetails(address _oracle) public view returns(string,address){
        OracleDetails storage _current = oracle_list[oracle_index[_oracle]];
        return(_current.API,_current.location);
    }

    /**
    * @dev Getter function that gets the number of deployed oracles
    * @return the oracle count
    */
    function getOracleCount() public view returns(uint){
        return oracle_list.length-1;
    }

    /**
    * @dev Getter function that gets the index of the specified deployed oracle
    * @param _oracle is the oracle address to look up
    * @return the oracle index
    */
    function getOracleIndex(address _oracle) public view returns(uint){
        return oracle_index[_oracle];
    }
    /**
    *@dev Allows the owner to set a new owner address
    *@param _new_owner the new owner address
    */
    function setOwner(address _new_owner) public onlyOwner() { 
        owner = _new_owner; 
    }
}
