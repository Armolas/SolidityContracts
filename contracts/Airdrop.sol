// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ERC20.sol";

contract Airdrop{
    bytes32 public merkleRoot;
    ERC20 public token;
    address public admin;

    error notWhitelisted();
    error unauthorized();

    constructor (bytes32 _merkleRoot, address token_address){
        merkleRoot = _merkleRoot;
        token = ERC20(token_address);
        admin = msg.sender;
    }

    function isWhitelisted(address _address, bytes32[] calldata proof) internal view returns(bool){
        bytes32 leaf = keccak256(abi.encodePacked(_address));

        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    function claim(bytes32[] calldata proof) external {
        require(isWhitelisted(msg.sender, proof), notWhitelisted());

        token._mint(msg.sender, 100e18);
    }

    function updateRoot(bytes32 _merkleRoot) external {
        require(msg.sender == admin, unauthorized());
        merkleRoot = _merkleRoot;
    }
}