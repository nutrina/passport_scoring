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

    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
            );
    }

    function getMessageHash(
        address _to,
        uint _amount,
        string memory _message,
        uint _nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount, _message, _nonce));
    }

    function getAddress(bytes32 hash, bytes memory signature) public pure returns (address){
        return recoverSigner(getEthSignedMessageHash(hash), signature);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // function sign(bytes32 data) public pure returns (bytes memory) {
    //     return keccack256(data).toEthSignedMessageHash();
    // }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}
