export type MortgageResult = {
  monthlyPayment: number;
  totalPayment: number;
  overpayment: number;
  loanAmount: number;
};

export type PaymentScheduleItem = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type MortgageDetailedResult = MortgageResult & {
  schedule: PaymentScheduleItem[];
  firstPayment: number;
  lastPayment: number;
};

function isValidPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isValidNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

// Аннуитет
export function calculateAnnuityDetails(
  loanAmount: number,
  annualRatePercent: number,
  years: number,
): MortgageDetailedResult | null {
  if (
    !isValidPositiveNumber(loanAmount) ||
    !isValidPositiveNumber(annualRatePercent) ||
    !isValidPositiveNumber(years)
  ) {
    return null;
  }
  const monthlyRate = annualRatePercent / 100 / 12;
  const months = Math.round(years * 12);
  if (months <= 0) return null;

  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  let balance = loanAmount;
  const schedule: PaymentScheduleItem[] = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    schedule.push({
      month: m,
      payment: monthlyPayment,
      principal,
      interest,
      balance,
    });
  }
  const totalPayment = monthlyPayment * months;
  const overpayment = totalPayment - loanAmount;
  return {
    monthlyPayment,
    totalPayment,
    overpayment,
    loanAmount,
    schedule,
    firstPayment: monthlyPayment,
    lastPayment: monthlyPayment,
  };
}

// Дифференцированные платежи
export function calculateDifferentiatedDetails(
  loanAmount: number,
  annualRatePercent: number,
  years: number,
): MortgageDetailedResult | null {
  if (
    !isValidPositiveNumber(loanAmount) ||
    !isValidPositiveNumber(annualRatePercent) ||
    !isValidPositiveNumber(years)
  ) {
    return null;
  }
  const monthlyRate = annualRatePercent / 100 / 12;
  const months = Math.round(years * 12);
  if (months <= 0) return null;

  const principalPart = loanAmount / months;
  let balance = loanAmount;
  const schedule: PaymentScheduleItem[] = [];
  let totalPayment = 0;
  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const payment = principalPart + interest;
    const principal = principalPart;
    balance = Math.max(0, balance - principal);
    totalPayment += payment;
    schedule.push({ month: m, payment, principal, interest, balance });
  }
  const overpayment = totalPayment - loanAmount;
  const firstPayment = schedule[0]?.payment ?? 0;
  const lastPayment = schedule[schedule.length - 1]?.payment ?? 0;
  return {
    monthlyPayment: firstPayment, // для совместимости: показываем первый платёж
    totalPayment,
    overpayment,
    loanAmount,
    schedule,
    firstPayment,
    lastPayment,
  };
}

// Обратная совместимость: аннуитет по входным price/initial
export function calculateMortgage(
  price: number,
  initialPayment: number,
  ratePercent: number,
  years: number,
): MortgageResult | null {
  if (
    !isValidPositiveNumber(price) ||
    !isValidNonNegativeNumber(initialPayment) ||
    !isValidPositiveNumber(ratePercent) ||
    !isValidPositiveNumber(years)
  ) {
    return null;
  }
  const loanAmount = price - initialPayment;
  if (!isValidPositiveNumber(loanAmount)) return null;
  const details = calculateAnnuityDetails(loanAmount, ratePercent, years);
  if (!details) return null;
  const { monthlyPayment, totalPayment, overpayment } = details;
  return { monthlyPayment, totalPayment, overpayment, loanAmount };
}
