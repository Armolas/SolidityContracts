const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// List of whitelisted addresses
const whitelist = [
  '0x744cDf77b3bb55aDb00D608d9EE35C8B43d4b0C8',
  '0x3A81eC26292C0f30540f5405C98b82531A09cCF4',
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0xc408235a9A01767d70B41C98d92F2dC7B0d959f4'
];


const leaves = whitelist.map(addr => keccak256(addr));


const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });


const root = tree.getRoot().toString('hex');
console.log('Merkle Root:', root);

function getProof(addr: string) {
  const leaf = keccak256(addr);
  const proof = tree.getHexProof(leaf);
  return {
    leaf: leaf.toString('hex'),
    //proof: proof.map((p: { data: { toString: (arg0: string) => any; }; }) => p.data.toString('hex')),
    proof: proof
  };
}

console.log('Proof for 0x744cDf77b3bb55aDb00D608d9EE35C8B43d4b0C8:', getProof('0xc408235a9A01767d70B41C98d92F2dC7B0d959f4'));

export { root, getProof };