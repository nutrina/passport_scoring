// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Scorer {
    uint public numMaxDataPoints;
    address payable public owner;

    struct Counter {
        uint count;
    }

    mapping(bytes32 => Counter) public comboCounter;
    mapping(uint => Counter) public numDataPointsCounter;

    constructor(uint _numMaxDataPoints) payable {
        numMaxDataPoints = _numMaxDataPoints;
    }

    function addDataPoints(bytes32 hash, uint numDataPoints) public {
        require(numDataPoints <= numMaxDataPoints, "You are adding to many data points");

        Counter storage combo = comboCounter[hash]; 
        combo.count += 1;

        Counter storage dataPointsCounter = numDataPointsCounter[numDataPoints]; 
        dataPointsCounter.count += 1;

    }

    function getApuScore(bytes32 hash, uint numDataPoints) public view returns(uint) {
        require(numDataPoints <= numMaxDataPoints, "You are adding to many data points");

        Counter storage combo = comboCounter[hash]; 
        Counter storage dataPointsCounter = numDataPointsCounter[numDataPoints]; 

        uint count = combo.count * 10 ** 18;
        uint prop = count / dataPointsCounter.count;
        uint weight = 10 ** 18 - prop;
        uint score_1 = weight * (10 ** 18 / numMaxDataPoints) / 10 ** 18;
        uint score_2 = numDataPoints * 10 ** 18 / numMaxDataPoints;
        uint score = score_1 + score_2;

        return score;
    }
}
