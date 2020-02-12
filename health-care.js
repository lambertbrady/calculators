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

function getCostRange(premium, maxOOP) {
   // [min, max] $ per year
   return [premium, premium + maxOOP];
}

class Plan {
   constructor(premium, deductible, maxOOP, copay, coinsurance, deductiblePaid = 0, maxOOPPaid = 0) {
      // TODO: can't enter deductiblePaid and maxOOPPaid as plain parameters, since they are related (deductible payments contribute to maxOOP)
      if (maxOOP < deductible) {
         throw new Error('maxOOP must be a number greater than or equal to deductible');
      }
      if (coinsurance < 0 || coinsurance > 1) {
         throw new Error('coinsurance must be a number between 0 and 1 (inclusive)');
      }
      // fixed variables
      // $ per year
      this.premium = premium;
      this.deductible = deductible;
      this.maxOOP = maxOOP;
      // $
      this.copay = copay;
      // %
      this.coinsurance = coinsurance;

      if (deductiblePaid < 0 || deductiblePaid > deductible) {
         throw new Error('deductiblePaid must be a number between 0 and deductible (inclusive)');
      }
      if (maxOOPPaid < 0 || maxOOPPaid > maxOOP) {
         throw new Error('maxOOPPaid must be a number between 0 and maxOOP (inclusive)');
      }
      // state variables
      // $
      this.deductiblePaid = deductiblePaid;
      this.maxOOPPaid = maxOOPPaid;
   }

   deductibleReached() {
      return this.deductiblePaid === this.deductible;
   }
   maxOOPReached() {
      return this.maxOOPPaid === this.maxOOP;
   }

   calcCostCopay() {
      // copay does not contribute to deductible
      // copay contributes to maxOOP
      let amountOwed;
      if (this.maxOOPReached()) {
         // maxOOP already reached, nothing owed
         amountOwed = 0
      } else if (this.copay + this.maxOOPPaid > this.maxOOP) {
         // full copay exceeds maxOOP, only pay remaining OOP balance
         amountOwed = this.maxOOP - this.maxOOPPaid;
      } else {
         // copay does not exceed maxOOP, full copay owed
         amountOwed = this.copay;
      }

      this.maxOOPPaid += amountOwed;
      return amountOwed;
   }

   calcCostCoinsurance(amountBilled) {
      // coinsurance contributes to deductible
      // coinsurance contributes to maxOOP
      let amountOwed;
      if (this.maxOOPReached()) {
         // maxOOP already reached, nothing owed
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
      // check maxOOP
      if (amountOwed + this.maxOOPPaid > this.maxOOP) {
         // full amount exceeds maxOOP, only pay remaining OOP balance
         amountOwed = this.maxOOP - this.maxOOPPaid;
      }

      this.maxOOPPaid += amountOwed;
      return amountOwed;
   }
}

// TODO: calcCost methods currently update paid values - change so this happens separately
let planA = new Plan(4000, 1000, 10000, 50, .2, 0, 9951);
console.log(planA.calcCostCopay());
let planB = new Plan(4000, 1000, 10000, 50, .2);
console.log(planB.calcCostCoinsurance(1100));