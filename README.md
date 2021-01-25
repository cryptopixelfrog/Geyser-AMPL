# geyser-formula

```
$ pwd
YOUR_REPO_PATH/geyser-formulas
$ npm install; echo 'INFURAENDPOIN=https://mainnet.infura.io/v3/YOUR_KEY_HER' > .evn
$ node scripts/get_calculation.js
```

This is output of the "poolAPYCalculation()" > scripts/get_calculation.js
```
MacBook-Pro:apy_geyser_test chris$ node scripts/get_calculation.js 

[[[[[ Pool APY Calucluation ]]]]]

  periodSec = geyser.bonusPeriodSec = 2592000 # 30 day bonus
  periodSec = 2592000 , 30 days 0

  N = number of periods = (365*24*3600)/periodSec
  12 = number of periods = 365*24*3600/2592000

  inflowVal = geyser.totalLocked * LP_token_price
  434554.2254466188 = 377873.239518799 * 1.15

  < Calculating unlocks >
   currentTimestampSec(1611598543)
   unlockScheduleCount(1)
   scheduleSecRemaining(2426694) 28 days 2 - this is Program duration on UI
   calcTime(2426694) 28 days 2
   initialLockedShares(975000000000)
   totalAMPLSharesUnlockedInXSec(304272974537.03705)
   totalLockedShares(304294917052.469136432)
   totalLocked(377873.239518799) - this is Locked Rewards on UI
   totalAMPLUnlockedInXSec(377845.99131672643) - this is Reward unlock rate on UI

  outflowVal = calculateAMPLUnlockedInNext(periodSec) * AMPL_price
  430744.4301010681 = 377845.99131672643 * 1.14

  i = yearly interest rate = outflowVal/inflowVal * N 
  0.11894794385902883 = yearly interest rate = 430744.4301010681/434554.2254466188 * 12

APY = (1 + i) ** N – 1
2.8522866080818816 = (1 + 0.11894794385902883) ** 12 – 1

APY in percent: 285.2286608081882 /3 = 95.07622026939606

[[[[[ User APY Calucluation ]]]]]

  periodSec = min(geyser.bonusPeriodSec, programTimeRemaining)
  2426694 = min(2592000, 2426694)
  28 days 2 = min(30 days 0, 28 days 2)

  inflowVal = geyser.totalStakedFor(user) * LP_token_price
  97.576394512935 = 84.8490387069 * 1.15

  userStakingShares = (geyser.totalStakedFor(user) * geyser.totalStakingShares) / geyser.totalStaked
  84849038.70690002 = (84.8490387069 * 6981226192755683621960914000000) / 6981226192755683621960914
  userStakingShareSeconds(1.2286958099250003e+33)

  userTokenSecondsAfterT = geyser.userStakingShareSeconds + (userStakingShares * periodSec)
  1.2286958099250003e+33 = 1.2286958099250003e+33 + (84849038.70690002 * 2426694)

  totalTokenSecondsAfterT = geyser.totalStakingShareSeconds + (geyser.totalStakingShares * periodSec)
  1.6942528410412986e+37 = 1.2286958099250003e+33 + (6981226192755683621960914000000 * 2426694)
  userShareAfterT = userTokenSecondsAfterT / totalTokenSecondsAfterT
  0.00007252139587204918 = 1.2286958099250003e+33 / 1.6942528410412986e+37

  < Calculating unlocks >
   currentTimestampSec(1611598544)
   unlockScheduleCount(1)
   scheduleSecRemaining(2426693) 28 days 2 - this is Program duration on UI
   calcTime(2426693) 28 days 2
   initialLockedShares(975000000000)
   totalAMPLSharesUnlockedInXSec(304272849151.23456)
   totalLockedShares(304294917052.469136432)
   totalLocked(377873.239518799) - this is Locked Rewards on UI
   totalAMPLUnlockedInXSec(377845.8356127145) - this is Reward unlock rate on UI

  userDripAfterT = calculateAMPLUnlockedInNext(periodSec) * userShareAfterT
  27.40190742307489 = 377845.8356127145 * 27.40190742307489

  outflowVal = userDripAfterT * AMPL_price
  31.23817446230537 = 27.40190742307489 * 1.14

  i = yearly interest rate = outflowVal/inflowVal * N 
  0.04161828996009241 = yearly interest rate = 31.23817446230537/97.576394512935 * 13

APY = (1 + i) ** N – 1
0.6990719214761216 = (1 + 0.04161828996009241) ** 13 – 1

APY in percent: 69.90719214761216
MacBook-Pro:apy_geyser_test chris$ date
Mon Jan 25 10:26:34 PST 2021

```

Pool APY in percent: 285.2286608081882 /3 = 95.07622026939606
User APY in percent: 69.90719214761216
