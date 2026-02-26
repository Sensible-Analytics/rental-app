function calculateTaxBenefits(propertyFinances) {
    const { total_income, total_expenses, interest_rate, loan_amount } = propertyFinances;
    
    // 1. Calculate Annual Interest (approx)
    const annualInterest = (loan_amount * (interest_rate / 100)) || 0;
    
    // 2. Net Rental Position
    const netRentalIncome = total_income - total_expenses - annualInterest;
    
    // 3. Tax Offset (if negative gearing)
    // Assuming a standard 32.5% tax bracket for the user (can be made configurable)
    const taxBracket = 0.325;
    const taxBenefit = netRentalIncome < 0 ? Math.abs(netRentalIncome) * taxBracket : 0;
    
    // 4. ROI Calculations
    const capitalGrowthEstimate = 0.05; // 5% growth estimate
    const currentPrice = propertyFinances.current_value || propertyFinances.purchase_price;
    const annualGrowth = currentPrice * capitalGrowthEstimate;
    
    const totalReturn = netRentalIncome + annualGrowth + taxBenefit;
    const roi = (totalReturn / propertyFinances.purchase_price) * 100;

    return {
        annualInterest,
        netRentalIncome,
        taxBenefit,
        totalReturn,
        roi: roi.toFixed(2)
    };
}

module.exports = { calculateTaxBenefits };
