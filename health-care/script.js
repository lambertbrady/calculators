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

class Limit {
   constructor(limit) {
      this.limit = limit;

      this.amountPaid = 0;
   }

   get limitReached() {
      return this.amountPaid === this.limit;
   }

   calcPayment(amount) {
      let payment;
      if (amount + this.amountPaid > this.limit) {
         // full amount exceeds limit; only pay remaining balance (which is 0 if limit has already been reached)
         payment = this.limit - this.amountPaid;
      } else {
         // amount does not exceed limit; full amount owed
         payment = amount;
      }

      return payment;
   }
   
   pay(amount) {
      const payment = this.calcPayment(amount);
      this.amountPaid += payment;

      return payment;
   }
}

class Service {
   constructor(type, defaultBill) {
      this.type = type;

      this.defaultBill = defaultBill;

      // this.isCovered;
      this.deductibles = [];
   }
}

class Plan {
   constructor(premium, deductible, outOfPocketLimit) {
      // TODO: can't enter deductiblePaid and outOfPocketLimitPaid as plain parameters, since they are related (deductible payments contribute to outOfPocketLimit)
      if (outOfPocketLimit < deductible) {
         throw new Error('outOfPocketLimit must be a number greater than or equal to deductible');
      }
      // if (coinsurance < 0 || coinsurance > 1) {
      //    throw new Error('coinsurance must be a number between 0 and 1 (inclusive)');
      // }
      // fixed variables
      // $ per year
      this.premium = premium;
      this.deductible = new Limit(deductible);
      this.outOfPocketLimit = new Limit(outOfPocketLimit);
      // $
      // this.copay = copay;
      // %
      // this.coinsurance = coinsurance;

      this.services = ['primaryCareOfficeVisit', 'primaryCareOutpatientServices', 'specialistVisit', 'preventiveCare', 'diagnosticTest', 'imaging', 'drugsTier1', 'drugsTier2', 'drugsTier3', 'drugsTier4', 'mentalHealthOfficeVisit', 'mentalHealthOutpatientServices', 'mentalHealthInpatientServices'];
      this.servicesInNetwork;
      this.servicesOutOfNetwork;

      // state variables
      // $
      // this.deductiblePaid = 0;
      // this.outOfPocketLimitPaid = 0;
   }

   calcCostCopay(amountBilled, copay) {
      // copay does not contribute to deductible
      // copay contributes to outOfPocketLimit
      
      return this.outOfPocketLimit.calcPayment(copay);
   }
   payCopay(amountBilled, copay) {
      // copay does not contribute to deductible
      // copay contributes to outOfPocketLimit
      
      return this.outOfPocketLimit.pay(copay);
   }

   calcCostCoinsurance(amountBilled, coinsurance) {
      // coinsurance contributes to deductible
      // coinsurance contributes to outOfPocketLimit

      // pay deductible
      const deductiblePayment = this.deductible.calcPayment(amountBilled);
      // apply coinsurance to costs beyond deductible
      const coinsurancePayment = (amountBilled - deductiblePayment) * coinsurance;
      // pay coinsurance, limited to outOfPocketLimit
      return this.outOfPocketLimit.calcPayment(deductiblePayment + coinsurancePayment);
   }
   payCoinsurance(amountBilled, coinsurance) {
      // coinsurance contributes to deductible
      // coinsurance contributes to outOfPocketLimit

      // pay deductible
      const deductiblePayment = this.deductible.pay(amountBilled);
      // apply coinsurance to costs beyond deductible
      const coinsurancePayment = (amountBilled - deductiblePayment) * coinsurance;
      // pay coinsurance, limited to outOfPocketLimit
      return this.outOfPocketLimit.pay(deductiblePayment + coinsurancePayment);
   }
}


let planA = new Plan(4000, 1000, 10000);
planA.outOfPocketLimit.pay(9959);
console.log(planA.calcCostCopay(100, 50));
let planB = new Plan(4000, 1000, 2000);
console.log('------');
console.log(planB.deductible);
console.log(planB.outOfPocketLimit);
console.log(planB.payCoinsurance(2000, .2));
console.log(planB.deductible);
console.log(planB.outOfPocketLimit);
console.log(planB.payCoinsurance(2000, .2));
console.log(planB.deductible);
console.log(planB.outOfPocketLimit);