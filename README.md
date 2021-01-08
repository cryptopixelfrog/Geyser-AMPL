# geyser-formulas

```
$ pwd
YOUR_REPO_PATH/geyser-formulas
$ npm install; echo 'INFURAENDPOIN=https://mainnet.infura.io/v3/YOUR_KEY_HER' > .evn
$ node scripts/get_calculation.js
```

This is output of the "poolAPYCalculation()" > scripts/get_calculation.js
```
MacBook-Pro:apy_geyser_test chris$ node scripts/get_calculation.js 

<< Pool APY Calucluation >>
 periodSec: 2592000 30 days 0
 N = number of periods = 365*24*3600/periodSec(2592000) = 12.166666666666666
 inflowVal = geyser.totalLocked(675009919244832) * LP_token_price(1220000000) = 8.23512101478695e+23

  < alculateAMPLUnlockedInNext >
 currentTimestampSec(1610144317)
 unlockScheduleCount(1)
schedule: Result {
  '0': '975000000000000000000',
  '1': '485949353780864196987',
  '2': '1610124870',
  '3': '1614025237',
  '4': '7776000',
  initialLockedShares: '975000000000000000000',
  unlockedShares: '485949353780864196987',
  lastUnlockTimestampSec: '1610124870',
  endAtSec: '1614025237',
  durationSec: '7776000'
}
 scheduleSecRemaining(3880920) 44 days 22
 calcTime(2592000) 30 days 0
 totalAMPLSharesUnlockedInXSec(325000000000000000000) 3761574074074074 days 0
 totalLockedShares(489050646219135803013)
 totalLocked(675009919244832)
 totalAMPLUnlockedInXSec(448579764592051.1)
 outflowVal = calculateAMPLUnlockedInNext(periodSec) * AMPL_price(1150000000) = 5.158667292808588e+23
 i = yearly interest rate = outflowVal(5.158667292808588e+23)/inflowVal(8.23512101478695e+23) * N(12.166666666666666) = (7.6214769987155515)
371.5411443697237
APY = (1 + i(7.6214769987155515) / N(12.166666666666666) ) ** N(12.166666666666666) – 1 = 370.5411443697237

MacBook-Pro:apy_geyser_test chris$ date
Fri Jan  8 14:18:45 PST 2021
```

Pool APY is being calculated as 370.5411443697237(370%).
