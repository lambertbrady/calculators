const partial = fn => (...pargs) => (...args) => (fn instanceof Function) ? fn.apply(null, [...pargs, ...args]) : undefined;
const partialRight = fn => (...pargs) => (...args) => (fn instanceof Function) ? fn.apply(null, [...args, ...pargs.reverse()]) : undefined;
const curry = fn => {
   return function curried(...args) {
      if (args.length >= func.length) {
         return fn.apply(this, args);
      } else {
         return function (...args2) {
            return curried.apply(this, args.concat(args2));
         }
      }
   };
}

function getCostRange(premium, limitOutOfPocket) {
   // [min, max] $ per year
   return [premium, premium + limitOutOfPocket];
}

class Plan {
   constructor(premium, deductible, limitOutOfPocket, copay, coinsurance) {
      // TODO: can't enter deductiblePaid and limitOutOfPocketPaid as plain parameters, since they are related (deductible payments contribute to limitOutOfPocket)
      if (limitOutOfPocket < deductible) {
         throw new Error('limitOutOfPocket must be a number greater than or equal to deductible');
      }
      if (coinsurance < 0 || coinsurance > 1) {
         throw new Error('coinsurance must be a number between 0 and 1 (inclusive)');
      }
      // fixed variables
      // $ per year
      this.premium = premium;
      this.deductible = deductible;
      this.limitOutOfPocket = limitOutOfPocket;
      // $
      this.copay = copay;
      // %
      this.coinsurance = coinsurance;

      // state variables
      // $
      this.deductiblePaid = 0;
      this.limitOutOfPocketPaid = 0;
   }

   deductibleReached() {
      return this.deductiblePaid === this.deductible;
   }
   limitOutOfPocketReached() {
      return this.limitOutOfPocketPaid === this.limitOutOfPocket;
   }

   calcCostCopay() {
      // copay does not contribute to deductible
      // copay contributes to limitOutOfPocket
      let amountOwed;
      if (this.limitOutOfPocketReached()) {
         // limitOutOfPocket already reached, nothing owed
         amountOwed = 0
      } else if (this.copay + this.limitOutOfPocketPaid > this.limitOutOfPocket) {
         // full copay exceeds limitOutOfPocket, only pay remaining OOP balance
         amountOwed = this.limitOutOfPocket - this.limitOutOfPocketPaid;
      } else {
         // copay does not exceed limitOutOfPocket, full copay owed
         amountOwed = this.copay;
      }

      this.limitOutOfPocketPaid += amountOwed;
      return amountOwed;
   }

   calcCostCoinsurance(amountBilled) {
      // coinsurance contributes to deductible
      // coinsurance contributes to limitOutOfPocket
      let amountOwed;
      if (this.limitOutOfPocketReached()) {
         // limitOutOfPocket already reached, nothing owed
         amountOwed = 0
      } else {
         if (this.deductibleReached()) {
            // deductible already reached, cost fully covered by coinsurance
            amountOwed = this.coinsurance * amountBilled;
         } else {
            const deductibleRemaining = this.deductible - this.deductiblePaid;
            if (amountBilled <= deductibleRemaining) {
               // payment does not exceed deductible, no coinsurance applied
               amountOwed = amountBilled;
               this.deductiblePaid += amountBilled;
            } else {
               // full payment exceeds deductible, must pay remaining deductible plus left over amount with coinsurance applied
               amountOwed = deductibleRemaining + this.coinsurance * (amountBilled - deductibleRemaining);
               this.deductiblePaid = this.deductible;
            }
         }
      }
      // check limitOutOfPocket
      if (amountOwed + this.limitOutOfPocketPaid > this.limitOutOfPocket) {
         // full amount exceeds limitOutOfPocket, only pay remaining OOP balance
         amountOwed = this.limitOutOfPocket - this.limitOutOfPocketPaid;
      }

      this.limitOutOfPocketPaid += amountOwed;
      return amountOwed;
   }
}

// TODO: calcCost methods currently update paid values - change so this happens separately
let planA = new Plan(4000, 1000, 10000, 50, .2);
console.log(planA.calcCostCopay());
let planB = new Plan(4000, 1000, 10000, 50, .2);
console.log(planB.calcCostCoinsurance(1100));