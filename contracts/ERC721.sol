// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

interface IERC721 {
    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}

abstract contract ERC721 is IERC721{
    string public token_name;
    string public token_symbol;

    uint256 private token_counter;
    mapping(address => uint256) private balance;
    mapping(uint256 => address) private token_owner;
    mapping(address => mapping(address => bool)) private operator_approval;
    mapping(uint256 => address) private approval;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
    event Mint(address indexed _to, uint256 indexed _tokenId);

    constructor (string memory _token_name, string memory _token_symbol) {
        token_name = _token_name;
        token_symbol = _token_symbol;
        mint();
        mint();
        mint();
    }

    function name() external view returns (string memory){
        return token_name;
    }

    function symbol() external view returns (string memory){
        return token_symbol;
    }

    function balanceOf(address _owner) external view returns (uint256){
        return balance[_owner];
    }

    function ownerOf(uint256 _tokenId) external view returns (address){
        return token_owner[_tokenId];
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) external payable{
        require(token_owner[_tokenId] == _from, "Not token owner!");
        require(_from == msg.sender || approval[_tokenId] == msg.sender || operator_approval[_from][msg.sender], "Not Authorized");
        token_owner[_tokenId] = _to;
        balance[_from] -= 1;
        balance[_to] += 1;
        emit Transfer(_from, _to, _tokenId);
    }



    function approve(address _approved, uint256 _tokenId) external payable{
        require(token_owner[_tokenId] == msg.sender, "Not token owner");
        approval[_tokenId] = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external{
        operator_approval[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId) external view returns (address){
        return approval[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool){
        return operator_approval[_owner][_operator];
    }

    function mint() public{
        _safeMint(msg.sender, token_counter);
        token_counter += 1;
    }

    function _safeMint(address _to, uint256 id) private {
        require(_to != address(0), "Invalid Address");
        token_owner[id] = _to;
        balance[_to] += 1;
        emit Mint(_to, id);
    }

    function getRandomColor(uint256 tokenId) internal pure returns (string memory) {
        string[5] memory colors = ["red", "blue", "green", "purple", "orange"];
        return colors[tokenId % colors.length]; // Selects a color based on token ID
    }

    function generateSVG(uint256 tokenId) internal pure returns (string memory) {
        string memory color1 = getRandomColor(tokenId);
        string memory color2 = getRandomColor(tokenId + 1);
        string memory cx = Strings.toString((tokenId * 30) % 400);
        string memory cy = Strings.toString((tokenId * 50) % 400);
        string memory r = Strings.toString((tokenId * 10) % 50 + 20);

        return string(
            abi.encodePacked(
                '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="100%" height="100%" fill="black"/>',
                '<circle cx="', cx, '" cy="', cy, '" r="', r, '" fill="', color1, '"/>',
                '<circle cx="', cy, '" cy="', cx, '" r="', r, '" fill="', color2, '"/>',
                '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24">',
                'Armolas NFT #', Strings.toString(tokenId), '</text></svg>'
            )
        );
    }

    function tokenURI(uint256 tokenId) public pure returns (string memory) {
        string memory svg = generateSVG(tokenId);
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Dynamic SVG NFT #', Strings.toString(tokenId),
                        '", "description": "Muritadhor on-chain NFT", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)), '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}