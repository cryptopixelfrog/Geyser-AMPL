const fs = require('fs');

const BALANCER_GEYSER_ADDRESS = "0x42d3c21DF4a26C06d7084f6319aCBF9195a583C1";
const BALANCER_GEYSER_ABI = JSON.parse(fs.readFileSync('./scripts/abi/balancer_geyser.abi'));

const UNISWAP_GEYSER_ADDRESS = "0x075Bb66A472AB2BBB8c215629C77E8ee128CC2Fc";
const UNISWAP_GEYSER_ABI = JSON.parse(fs.readFileSync('./scripts/abi/uniswap_geyser.abi'));

module.exports = {
  BALANCER_GEYSER_ADDRESS,
  UNISWAP_GEYSER_ADDRESS,
  BALANCER_GEYSER_ABI,
  UNISWAP_GEYSER_ABI
}
