pragma solidity ^0.4.21;

import "./libraries/SafeMath.sol";
import "./Token.sol";
import "./CloneFactory.sol";
import "./OracleToken.sol";
/**
 * @title Proof of Work token

 This the master token where you deploy new oracles from.  
 Each oracle gets the API value specified
 */
contract ProofOfWorkToken is Token, CloneFactory {

    using SafeMath for uint256;


    struct OracleDetails {
        string API;
        address location;
    }
    address public dud_Oracle;

    OracleDetails[] public oracle_list;
    mapping(address => uint) oracle_index;
    address owner;

    event Deployed(string _api,address _newOracle);

    constructor() public{
        owner = msg.sender;
        oracle_list.push(OracleDetails({
            API: "",
            location: address(0)
        }));
    }

    modifier onlyOwner() {
         require(msg.sender == owner);
        _;
    }

    /**
        *@dev Allows the owner to set a new owner address
        *@param _new_owner the new owner address
    */
    function setOwner(address _new_owner) public onlyOwner() { 
        owner = _new_owner; 
    } 


    function deployNewOracle(string _api,uint _readFee,uint _timeTarget,uint[5] _payoutStructure) external returns(address){
        address new_oracle = createClone(dud_Oracle);
        OracleToken(new_oracle).init(_api,address(this),_readFee,_timeTarget,_payoutStructure);
        oracle_index[new_oracle] = oracle_list.length;
        OracleDetails storage _current = oracle_list[oracle_list.length];
        _current.API = _api;
        _current.location = new_oracle;
        emit Deployed(_api, new_oracle);
        return new_oracle;
    }


    function iTransfer(address _to, uint _amount) external returns (bool) {
        require(oracle_index[msg.sender] > 0);
        if (balances[address(this)] >= _amount
        && _amount > 0
        && balances[_to].add(_amount) > balances[_to]) {
            balances[address(this)] = balances[address(this)].sub(_amount);
            balances[_to] = balances[_to].add(_amount);
            emit Transfer(address(this), _to, _amount);
            return true;
        } else {
            return false;
        }
    }

    function removeOracle(address _removed) public onlyOwner(){        
        uint _index = oracle_index[_removed];
        require(_index > 0);
        uint _last_index = oracle_list.length.sub(1);
        OracleDetails storage _last = oracle_list[_last_index];
        oracle_list[_index] = _last;
        oracle_index[_last.location] = _index;
        oracle_list.length--;
        oracle_index[_removed] = 0;
    }

    function getDetails(address _oracle) public view returns(string,address){
        OracleDetails storage _current = oracle_list[oracle_index[_oracle]];
        return(_current.API,_current.location);
    }

}