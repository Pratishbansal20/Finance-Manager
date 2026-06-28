// Net worth = assets − liabilities, where assets = investments (current value)
// + bank balances + other (manual) assets, and liabilities = credit-card
// outstanding. Pure function so it's trivially unit-testable.

export type NetWorthInputs = {
  investmentsInr: number;
  bankInr: number;
  otherAssetsInr: number;
  cardOutstandingInr: number;
};

export type NetWorth = {
  netWorthInr: number;
  totalAssetsInr: number;
  totalLiabilitiesInr: number;
  investmentsInr: number;
  bankInr: number;
  otherAssetsInr: number;
  cardOutstandingInr: number;
};

export function computeNetWorth(inputs: NetWorthInputs): NetWorth {
  const totalAssetsInr =
    inputs.investmentsInr + inputs.bankInr + inputs.otherAssetsInr;
  const totalLiabilitiesInr = inputs.cardOutstandingInr;
  return {
    netWorthInr: totalAssetsInr - totalLiabilitiesInr,
    totalAssetsInr,
    totalLiabilitiesInr,
    investmentsInr: inputs.investmentsInr,
    bankInr: inputs.bankInr,
    otherAssetsInr: inputs.otherAssetsInr,
    cardOutstandingInr: inputs.cardOutstandingInr,
  };
}
