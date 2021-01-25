// https://github.com/ampleforth/token-geyser/wiki/Geyser-APY

require('dotenv').config();
const BigNumber = require("bignumber.js");
const {
  BALANCER_GEYSER_ADDRESS,
  UNISWAP_GEYSER_ADDRESS,
  BALANCER_GEYSER_ABI,
  UNISWAP_GEYSER_ABI
} = require('../scripts/includes/constants');
const Util = require('../scripts/includes/utils');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAENDPOIN));

const balancerGeyserInst = new web3.eth.Contract(BALANCER_GEYSER_ABI, BALANCER_GEYSER_ADDRESS);
const uniswapGeyserInst = new web3.eth.Contract(UNISWAP_GEYSER_ABI, UNISWAP_GEYSER_ADDRESS);
const geyserInst = balancerGeyserInst;

let scheduleSecRemaining;
let calAMPLUnlockedInNext;
let totalLocked;
let LP_TOKEN_PRICE;
let AMPL_PRICE;


////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////
executionManager();
async function executionManager(){
  await poolAPYCalculation();

  // this is my wallet(Balancer LP participated)
  let userAcct = "0x8DF06063e8a4494D1E68f5c5D2765f648ba72371";
  await userAPYCalculation(userAcct);
}



async function userAPYCalculation(walletAddr) {
  console.log("\n[[[[[ User APY Calucluation ]]]]]");
  // programTimeRemaining is undefined
  // this is another value that is not in SC.
  // my best gess is that programTimeRemaining is same value with scheduleSecRemaining(same value with Program duration in UI).
  let programTimeRemaining = scheduleSecRemaining;
  let bonusPeriodSec = await geyserInst.methods.bonusPeriodSec().call();
  let periodSec = Math.min(bonusPeriodSec, programTimeRemaining);
  console.log("\n  periodSec = min(geyser.bonusPeriodSec, programTimeRemaining)");
  console.log(`  ${periodSec} = min(${bonusPeriodSec}, ${programTimeRemaining})`);
  console.log(" ",await secondToDay(periodSec),"= min(" + await secondToDay(bonusPeriodSec) + ", " + await secondToDay(programTimeRemaining) + ")");

  let totalStakedForUser = web3.utils.fromWei(await geyserInst.methods.totalStakedFor(walletAddr).call(),'ether');
  let inflowVal = totalStakedForUser * LP_TOKEN_PRICE;
  console.log("\n  inflowVal = geyser.totalStakedFor(user) * LP_token_price");
  console.log(`  ${inflowVal} = ${totalStakedForUser} * ${LP_TOKEN_PRICE}`);

  let totalStakingShares = await geyserInst.methods.totalStakingShares().call();
  let totalStaked = await geyserInst.methods.totalStaked().call();
  let userStakingShares = (totalStakedForUser * totalStakingShares) / totalStaked;
  console.log("\n  userStakingShares = (geyser.totalStakedFor(user) * geyser.totalStakingShares) / geyser.totalStaked");
  console.log(`  ${userStakingShares} = (${totalStakedForUser} * ${totalStakingShares}) / ${totalStaked}`);

  // userStakingShareSeconds is not defined, seems like this value is being calculated in sc but as private.
  // uint256 newUserStakingShareSeconds = now.sub(totals.lastAccountingTimestampSec).mul(totals.stakingShares);
  // based on sc(https://github.com/ampleforth/token-geyser/blob/master/contracts/TokenGeyser.sol#L368-L371),
  // the User accounting keeps updating whenever there is staking/unstaking(whenever there is tx), return data of unlockSchedules
  // of lastUnlockTimestampSec is being updates. I assume the lastUnlockTimestampSec is same value with lastAccountingTimestampSec.
  let nowSec = new Date()/1000|0;
  let schedule = await geyserInst.methods.unlockSchedules(0).call(); // this need to be in loop.
  let lastAccountingTimestampSec = schedule.lastUnlockTimestampSec;
  let userStakingShareSeconds = (nowSec - lastAccountingTimestampSec) * totalStakingShares;
  console.log(`  userStakingShareSeconds(${userStakingShareSeconds})`);

  let userTokenSecondsAfterT = userStakingShareSeconds + (userStakingShares * periodSec);
  console.log("\n  userTokenSecondsAfterT = geyser.userStakingShareSeconds + (userStakingShares * periodSec)");
  console.log(`  ${userTokenSecondsAfterT} = ${userStakingShareSeconds} + (${userStakingShares} * ${periodSec})`);

  // ahhhh, I think this is same with User accounting above, but with Global accounting.
  // uint256 newStakingShareSeconds = now.sub(_lastAccountingTimestampSec).mul(totalStakingShares);
  // https://github.com/ampleforth/token-geyser/blob/master/contracts/TokenGeyser.sol#L358-L362
  // To me, this is exactly same with userStakingShareSeconds above. ??
  let totalStakingShareSeconds = (nowSec - lastAccountingTimestampSec) * totalStakingShares;
  let totalTokenSecondsAfterT = totalStakingShareSeconds + (totalStakingShares * periodSec);
  console.log("\n  totalTokenSecondsAfterT = geyser.totalStakingShareSeconds + (geyser.totalStakingShares * periodSec)");
  console.log(`  ${totalTokenSecondsAfterT} = ${totalStakingShareSeconds} + (${totalStakingShares} * ${periodSec})`);

  let userShareAfterT = userTokenSecondsAfterT / totalTokenSecondsAfterT;
  console.log("  userShareAfterT = userTokenSecondsAfterT / totalTokenSecondsAfterT");
  console.log(`  ${userShareAfterT} = ${userTokenSecondsAfterT} / ${totalTokenSecondsAfterT}`);

  let unlockInNextSec = await calculateAMPLUnlockedInNext(periodSec);
  let userDripAfterT = unlockInNextSec * userShareAfterT;
  console.log("\n  userDripAfterT = calculateAMPLUnlockedInNext(periodSec) * userShareAfterT");
  console.log(`  ${userDripAfterT} = ${unlockInNextSec} * ${userDripAfterT}`);

  let outflowVal = userDripAfterT * AMPL_PRICE;
  console.log("\n  outflowVal = userDripAfterT * AMPL_price");
  console.log(`  ${outflowVal} = ${userDripAfterT} * ${AMPL_PRICE}`);

  let N = ((365*24*3600)/periodSec).toFixed(0);
  let i = ((outflowVal/inflowVal) * N) / 100;
  console.log("\n  i = yearly interest rate = outflowVal/inflowVal * N ");
  console.log(`  ${i} = yearly interest rate = ${outflowVal}/${inflowVal} * ${N}`);

  let apyRaw = (1 + i)**N;
  let APY = apyRaw - 1;
  console.log("\nAPY = (1 + i) ** N – 1");
  console.log(`${APY} = (1 + ${i}) ** ${N} – 1`);
  console.log("\nAPY in percent:", APY*100);
}



async function poolAPYCalculation(){
  console.log("\n[[[[[ Pool APY Calucluation ]]]]]");

  let periodSec = await geyserInst.methods.bonusPeriodSec().call();
  console.log("\n  periodSec = geyser.bonusPeriodSec = 2592000 # 30 day bonus");
  console.log("  periodSec =",periodSec, "," ,await secondToDay(periodSec));

  let N = ((365*24*3600)/periodSec).toFixed(0);
  console.log("\n  N = number of periods = (365*24*3600)/periodSec");
  console.log(`  ${N} = number of periods = 365*24*3600/${periodSec}`);

  // BAL-REBASING-SMART-V1-AMPL-USDC // how we calculate this?
  // https://pools.balancer.exchange/#/pool/0x7860e28ebfb8ae052bfe279c07ac5d94c9cd2937/about
  //LP_TOKEN_PRICE = 1.22/10**9;
  //LP_TOKEN_PRICE = 1220000000;
  LP_TOKEN_PRICE = 1.15; //0.95; // 986000000; //
  totalLocked = web3.utils.fromWei(await geyserInst.methods.totalLocked().call(), 'gwei');
  let inflowVal = totalLocked * LP_TOKEN_PRICE;
  console.log("\n  inflowVal = geyser.totalLocked * LP_token_price");
  console.log(`  ${inflowVal} = ${totalLocked} * ${LP_TOKEN_PRICE}`);

  // https://pools.balancer.exchange/#/pool/0x7860e28ebfb8ae052bfe279c07ac5d94c9cd2937/about
  //AMPL_PRICE = 1.15/10**9;
  //AMPL_PRICE = 1150000000;
  AMPL_PRICE = 1.14;//0.83; //844000000;
  calAMPLUnlockedInNext = await calculateAMPLUnlockedInNext(periodSec);
  let outflowVal = calAMPLUnlockedInNext * AMPL_PRICE;
  console.log("\n  outflowVal = calculateAMPLUnlockedInNext(periodSec) * AMPL_price");
  console.log(`  ${outflowVal} = ${calAMPLUnlockedInNext} * ${AMPL_PRICE}`);

  let i = ((outflowVal/inflowVal) * N) / 100;
  console.log("\n  i = yearly interest rate = outflowVal/inflowVal * N ");
  console.log(`  ${i} = yearly interest rate = ${outflowVal}/${inflowVal} * ${N}`);

  let apyRaw = (1 + i)**N;
  let APY = apyRaw - 1;
  console.log("\nAPY = (1 + i) ** N – 1");
  console.log(`${APY} = (1 + ${i}) ** ${N} – 1`);
  console.log("\nAPY in percent:", APY*100, "/3 =", (APY*100)/3);
}




// calculate the total AMPL unlocked in the next 'x' seconds
async function calculateAMPLUnlockedInNext(xSec){
  console.log("\n  < Calculating unlocks >");

  let currentTimestampSec = new Date()/1000|0;
  console.log(`   currentTimestampSec(${currentTimestampSec})`);

  let totalAMPLSharesUnlockedInXSec = 0;
  let unlockScheduleCount = await geyserInst.methods.unlockScheduleCount().call();
  console.log(`   unlockScheduleCount(${unlockScheduleCount})`);

  for (i = 0; i < unlockScheduleCount; i++) {

    let schedule = await geyserInst.methods.unlockSchedules(i).call();
    //console.log("schedule:", schedule);

    scheduleSecRemaining = Math.max(schedule.endAtSec - currentTimestampSec, 0);
    let scheduleSecRemainingDisplay = await secondToDay(scheduleSecRemaining)
    console.log(`   scheduleSecRemaining(${scheduleSecRemaining})`, scheduleSecRemainingDisplay, "- this is Program duration on UI");

    let calcTime = Math.min(scheduleSecRemaining, xSec);
    console.log(`   calcTime(${calcTime})`, await secondToDay(calcTime));

    let initialLockedShares = web3.utils.fromWei(schedule.initialLockedShares, 'gwei');
    console.log(`   initialLockedShares(${initialLockedShares})`);
    totalAMPLSharesUnlockedInXSec += calcTime/schedule.durationSec * initialLockedShares;
  }

  console.log(`   totalAMPLSharesUnlockedInXSec(${totalAMPLSharesUnlockedInXSec})`);

  let totalLockedShares = web3.utils.fromWei(await geyserInst.methods.totalLockedShares().call(),'gwei');
  console.log(`   totalLockedShares(${totalLockedShares})`);

  console.log(`   totalLocked(${totalLocked}) - this is Locked Rewards on UI`);

  let totalAMPLUnlockedInXSec = (totalAMPLSharesUnlockedInXSec / totalLockedShares) * totalLocked;
  console.log(`   totalAMPLUnlockedInXSec(${totalAMPLUnlockedInXSec})`, "- this is Reward unlock rate on UI");

  return totalAMPLUnlockedInXSec;
}



async function secondToDay(sec){
  let secInt = parseInt(sec);
  let days = Math.floor(secInt / (3600*24));
  secInt  -= days*3600*24;
  let hrs  = Math.floor(secInt / 3600);
  return days + " days " + hrs;
}
