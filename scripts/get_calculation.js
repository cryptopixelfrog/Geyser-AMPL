// https://github.com/ampleforth/token-geyser/wiki/Geyser-APY

// $ pwd
// YOUR_REPO_PATH/geyser-formulas
// $ npm install; echo 'INFURAENDPOIN=https://mainnet.infura.io/v3/dc6373c8d6f24427acab042655067fe2' > .evn
// $ node scripts/get_calculation.js

require('dotenv').config();
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
  //await userAPYCalculation(userAcct);
}



async function userAPYCalculation(walletAddr) {
  console.log("\n<< User APY Calucluation >>");
  // programTimeRemaining is undefined
  // this is another value that is not in SC.
  // my best gess is that programTimeRemaining is same value with scheduleSecRemaining(same value with Program duration in UI).
  let programTimeRemaining = scheduleSecRemaining;
  let bonusPeriodSec = await geyserInst.methods.bonusPeriodSec().call();
  let periodSec = Math.min(bonusPeriodSec, programTimeRemaining);
  console.log(` periodSec = min(geyser.bonusPeriodSec(${bonusPeriodSec}), programTimeRemaining(${programTimeRemaining})) = ${periodSec}`);

  let totalStakedForUser = await geyserInst.methods.totalStakedFor(walletAddr).call();
  let inflowVal = totalStakedForUser * LP_TOKEN_PRICE;
  console.log(` inflowVal = geyser.totalStakedForUser(${totalStakedForUser}) * LP_token_price(${LP_TOKEN_PRICE}) = ${inflowVal}`);

  let totalStakingShares = await geyserInst.methods.totalStakingShares().call();
  let totalStaked = await geyserInst.methods.totalStaked().call();
  let userStakingShares = (totalStakedForUser * totalStakingShares) / totalStaked;
  console.log(` userStakingShares = (totalStakedForUser(${totalStakedForUser}) * totalStakingShares(${totalStakingShares})) / totalStaked(${totalStaked}) = ${userStakingShares}`);

  // userStakingShareSeconds is not defined, seems like this value is being calculated in sc but as private.
  // uint256 newUserStakingShareSeconds = now.sub(totals.lastAccountingTimestampSec).mul(totals.stakingShares);
  // based on sc(https://github.com/ampleforth/token-geyser/blob/master/contracts/TokenGeyser.sol#L368-L371),
  // the User accounting keeps updating whenever there is staking/unstaking(whenever there is tx), return data of unlockSchedules
  // of lastUnlockTimestampSec is being updates. I assume the lastUnlockTimestampSec is same value with lastAccountingTimestampSec.
  let nowSec = new Date()/1000|0;
  let schedule = await geyserInst.methods.unlockSchedules(0).call(); // this need to be in loop.
  let lastAccountingTimestampSec = schedule.lastUnlockTimestampSec;
  let userStakingShareSeconds = (nowSec - lastAccountingTimestampSec) * totalStakingShares;
  console.log(` userStakingShareSeconds(${userStakingShareSeconds})`);

  let userTokenSecondsAfterT = userStakingShareSeconds + (userStakingShares * periodSec);
  console.log(` userTokenSecondsAfterT = geyser.userStakingShareSeconds(${userStakingShareSeconds}) + (userStakingShares(${userStakingShares}) * periodSec(${periodSec})) = ${userTokenSecondsAfterT}`);

  // ahhhh, I think this is same with User accounting above, but with Global accounting.
  // uint256 newStakingShareSeconds = now.sub(_lastAccountingTimestampSec).mul(totalStakingShares);
  // https://github.com/ampleforth/token-geyser/blob/master/contracts/TokenGeyser.sol#L358-L362
  // To me, this is exactly same with userStakingShareSeconds above. ??
  let totalStakingShareSeconds = (nowSec - lastAccountingTimestampSec) * totalStakingShares;
  let totalTokenSecondsAfterT = totalStakingShareSeconds + (totalStakingShares * periodSec);
  console.log(` totalTokenSecondsAfterT = geyser.totalStakingShareSeconds(${totalStakingShareSeconds}) + (geyser.totalStakingShares(${totalStakingShares}) * periodSec(${periodSec})) = ${totalTokenSecondsAfterT}`);

  let userShareAfterT = userTokenSecondsAfterT / totalTokenSecondsAfterT;
  console.log(` userShareAfterT = userTokenSecondsAfterT(${userTokenSecondsAfterT}) / totalTokenSecondsAfterT(${totalTokenSecondsAfterT}) = ${userShareAfterT}`);

  let unlockInNextSec = await calculateAMPLUnlockedInNext(periodSec);
  let userDripAfterT = unlockInNextSec * userShareAfterT;
  console.log(` userDripAfterT = calculateAMPLUnlockedInNext(periodSec)(${unlockInNextSec}) * userShareAfterT = ${userDripAfterT}`);

  let outflowVal = userDripAfterT * AMPL_PRICE;
  console.log(` outflowVal = userDripAfterT(${userDripAfterT}) * AMPL_price(${AMPL_PRICE}) = ${outflowVal}`);

  let N = (365*24*3600)/periodSec;

  let apyRaw = (1 + outflowVal/inflowVal)**N;
  console.log(apyRaw);
  let APY = apyRaw - 1;
  console.log(`APY = (1 + outflowVal(${outflowVal})/inflowVal(${inflowVal})) ** N(${N}) - 1 = ${APY}`);

}



async function poolAPYCalculation(){
  console.log("\n<< Pool APY Calucluation >>");

  let periodSec = await geyserInst.methods.bonusPeriodSec().call();
  console.log(" periodSec:", periodSec, await secondToDay(periodSec));

  let N = (365*24*3600)/periodSec;
  console.log(` N = number of periods = 365*24*3600/periodSec(${periodSec}) = ${N}`);

  // BAL-REBASING-SMART-V1-AMPL-USDC // how we calculate this?
  // https://pools.balancer.exchange/#/pool/0x7860e28ebfb8ae052bfe279c07ac5d94c9cd2937/about
  //LP_TOKEN_PRICE = 1.22/10**9;
  LP_TOKEN_PRICE = 1220000000;
  let totalLocked = await geyserInst.methods.totalLocked().call();
  let inflowVal = totalLocked * LP_TOKEN_PRICE;
  console.log(` inflowVal = geyser.totalLocked(${totalLocked}) * LP_token_price(${LP_TOKEN_PRICE}) = ${inflowVal}`);

  // https://pools.balancer.exchange/#/pool/0x7860e28ebfb8ae052bfe279c07ac5d94c9cd2937/about
  //AMPL_PRICE = 1.15/10**9;
  AMPL_PRICE = 1150000000;
  let outflowVal = await calculateAMPLUnlockedInNext(periodSec) * AMPL_PRICE;
  console.log(` outflowVal = calculateAMPLUnlockedInNext(periodSec) * AMPL_price(${AMPL_PRICE}) = ${outflowVal}`);

  let i = (outflowVal/inflowVal) * N;
  console.log(` i = yearly interest rate = outflowVal(${outflowVal})/inflowVal(${inflowVal}) * N(${N}) = (${i})`);

  let apyRaw = (1 + i/N)**N;
  console.log(apyRaw);
  let APY = apyRaw - 1;
  console.log(`APY = (1 + i(${i}) / N(${N}) ) ** N(${N}) – 1 = ${APY}`);
}




// calculate the total AMPL unlocked in the next 'x' seconds
async function calculateAMPLUnlockedInNext(xSec){
  console.log("\n  < alculateAMPLUnlockedInNext >");

  let currentTimestampSec = new Date()/1000|0;
  console.log(` currentTimestampSec(${currentTimestampSec})`);

  let totalAMPLSharesUnlockedInXSec = 0;
  let unlockScheduleCount = await geyserInst.methods.unlockScheduleCount().call();
  console.log(` unlockScheduleCount(${unlockScheduleCount})`);

  for (i = 0; i < unlockScheduleCount; i++) {

    let schedule = await geyserInst.methods.unlockSchedules(i).call();
    console.log("schedule:", schedule);

    //scheduleSecRemaining = Math.max(schedule.endAtSec - currentTimestampSec, 0);
    scheduleSecRemaining = Math.max(schedule.endAtSec - currentTimestampSec, 0);
    console.log(` scheduleSecRemaining(${scheduleSecRemaining})`, await secondToDay(scheduleSecRemaining));

    let calcTime = Math.min(scheduleSecRemaining, xSec);
    console.log(` calcTime(${calcTime})`, await secondToDay(calcTime));

    totalAMPLSharesUnlockedInXSec += calcTime/schedule.durationSec * (schedule.initialLockedShares);
  }

  console.log(` totalAMPLSharesUnlockedInXSec(${totalAMPLSharesUnlockedInXSec})`, await secondToDay(totalAMPLSharesUnlockedInXSec));

  let totalLockedShares = await geyserInst.methods.totalLockedShares().call();
  console.log(` totalLockedShares(${totalLockedShares})`);

  let totalLocked = await geyserInst.methods.totalLocked().call();
  console.log(` totalLocked(${totalLocked})`);

  let totalAMPLUnlockedInXSec = (totalAMPLSharesUnlockedInXSec / totalLockedShares) * totalLocked;
  console.log(` totalAMPLUnlockedInXSec(${totalAMPLUnlockedInXSec})`);

  return totalAMPLUnlockedInXSec;
}



async function secondToDay(sec){
  let secInt = parseInt(sec);
  let days = Math.floor(secInt / (3600*24));
  secInt  -= days*3600*24;
  let hrs  = Math.floor(secInt / 3600);
  return days + " days " + hrs;
}
