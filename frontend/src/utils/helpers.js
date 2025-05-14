// Generar número aleatorio entre min y max
export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generar ID único
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generar número de factura
export const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de servicio
export const generateServiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `S-${year}-${random}`;
};

// Generar número de repuesto
export const generatePartNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `R-${random}`;
};

// Generar número de vehículo
export const generateVehicleNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `V-${random}`;
};

// Generar número de cliente
export const generateCustomerNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `C-${random}`;
};

// Generar número de empleado
export const generateEmployeeNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `E-${random}`;
};

// Generar número de proveedor
export const generateSupplierNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `P-${random}`;
};

// Generar número de taller
export const generateWorkshopNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `T-${random}`;
};

// Generar número de cita
export const generateAppointmentNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `A-${year}-${random}`;
};

// Generar número de presupuesto
export const generateQuoteNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `Q-${year}-${random}`;
};

// Generar número de albarán
export const generateDeliveryNoteNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `D-${year}-${random}`;
};

// Generar número de remesa
export const generateBatchNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B-${year}-${random}`;
};

// Generar número de lote
export const generateLotNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `L-${year}-${random}`;
};

// Generar número de serie
export const generateSerialNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `S-${year}-${random}`;
};

// Generar número de modelo
export const generateModelNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `M-${random}`;
};

// Generar número de marca
export const generateBrandNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B-${random}`;
};

// Generar número de categoría
export const generateCategoryNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `C-${random}`;
};

// Generar número de subcategoría
export const generateSubcategoryNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `S-${random}`;
};

// Generar número de familia
export const generateFamilyNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${random}`;
};

// Generar número de subfamilia
export const generateSubfamilyNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `S-${random}`;
};

// Generar número de grupo
export const generateGroupNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `G-${random}`;
};

// Generar número de subgrupo
export const generateSubgroupNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `S-${random}`;
};

// Generar número de unidad
export const generateUnitNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `U-${random}`;
};

// Generar número de medida
export const generateMeasureNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `M-${random}`;
};

// Generar número de moneda
export const generateCurrencyNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `C-${random}`;
};

// Generar número de impuesto
export const generateTaxNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `T-${random}`;
};

// Generar número de descuento
export const generateDiscountNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `D-${random}`;
};

// Generar número de recargo
export const generateSurchargeNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `R-${random}`;
};

// Generar número de forma de pago
export const generatePaymentMethodNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `P-${random}`;
};

// Generar número de banco
export const generateBankNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B-${random}`;
};

// Generar número de cuenta bancaria
export const generateBankAccountNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `A-${random}`;
};

// Generar número de tarjeta bancaria
export const generateBankCardNumber = () => {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `C-${random}`;
};

// Generar número de transferencia
export const generateTransferNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `T-${year}-${random}`;
};

// Generar número de recibo
export const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `R-${year}-${random}`;
};

// Generar número de remesa
export const generateRemittanceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `R-${year}-${random}`;
};

// Generar número de devolución
export const generateReturnNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `D-${year}-${random}`;
};

// Generar número de abono
export const generateCreditNoteNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `A-${year}-${random}`;
};

// Generar número de cargo
export const generateDebitNoteNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `C-${year}-${random}`;
};

// Generar número de factura rectificativa
export const generateCorrectiveInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura complementaria
export const generateComplementaryInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura proforma
export const generateProformaInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura simplificada
export const generateSimplifiedInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura electrónica
export const generateElectronicInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de exportación
export const generateExportInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de importación
export const generateImportInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de intracomunitario
export const generateIntracommunityInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de extracomunitario
export const generateExtracommunityInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura
export const generateSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura rectificativa
export const generateCorrectiveSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura complementaria
export const generateComplementarySelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura proforma
export const generateProformaSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura simplificada
export const generateSimplifiedSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura electrónica
export const generateElectronicSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura de exportación
export const generateExportSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura de importación
export const generateImportSelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura de intracomunitario
export const generateIntracommunitySelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Generar número de factura de autofactura de extracomunitario
export const generateExtracommunitySelfInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `F-${year}-${random}`;
};

// Calcular edad
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Calcular días entre fechas
export const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calcular horas entre fechas
export const calculateHoursBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

// Calcular minutos entre fechas
export const calculateMinutesBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60));
};

// Calcular segundos entre fechas
export const calculateSecondsBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / 1000);
};

// Calcular IVA
export const calculateVAT = (amount, vatRate) => {
  return amount * (vatRate / 100);
};

// Calcular descuento
export const calculateDiscount = (amount, discountRate) => {
  return amount * (discountRate / 100);
};

// Calcular recargo
export const calculateSurcharge = (amount, surchargeRate) => {
  return amount * (surchargeRate / 100);
};

// Calcular total con IVA
export const calculateTotalWithVAT = (amount, vatRate) => {
  return amount + calculateVAT(amount, vatRate);
};

// Calcular total con descuento
export const calculateTotalWithDiscount = (amount, discountRate) => {
  return amount - calculateDiscount(amount, discountRate);
};

// Calcular total con recargo
export const calculateTotalWithSurcharge = (amount, surchargeRate) => {
  return amount + calculateSurcharge(amount, surchargeRate);
};

// Calcular total con IVA y descuento
export const calculateTotalWithVATAndDiscount = (amount, vatRate, discountRate) => {
  const amountWithDiscount = calculateTotalWithDiscount(amount, discountRate);
  return calculateTotalWithVAT(amountWithDiscount, vatRate);
};

// Calcular total con IVA y recargo
export const calculateTotalWithVATAndSurcharge = (amount, vatRate, surchargeRate) => {
  const amountWithSurcharge = calculateTotalWithSurcharge(amount, surchargeRate);
  return calculateTotalWithVAT(amountWithSurcharge, vatRate);
};

// Calcular total con descuento y recargo
export const calculateTotalWithDiscountAndSurcharge = (amount, discountRate, surchargeRate) => {
  const amountWithDiscount = calculateTotalWithDiscount(amount, discountRate);
  return calculateTotalWithSurcharge(amountWithDiscount, surchargeRate);
};

// Calcular total con IVA, descuento y recargo
export const calculateTotalWithVATDiscountAndSurcharge = (amount, vatRate, discountRate, surchargeRate) => {
  const amountWithDiscount = calculateTotalWithDiscount(amount, discountRate);
  const amountWithSurcharge = calculateTotalWithSurcharge(amountWithDiscount, surchargeRate);
  return calculateTotalWithVAT(amountWithSurcharge, vatRate);
};

// Calcular cuota mensual
export const calculateMonthlyPayment = (amount, months, interestRate) => {
  const monthlyRate = interestRate / 100 / 12;
  const numerator = amount * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return numerator / denominator;
};

// Calcular cuota trimestral
export const calculateQuarterlyPayment = (amount, quarters, interestRate) => {
  const quarterlyRate = interestRate / 100 / 4;
  const numerator = amount * quarterlyRate * Math.pow(1 + quarterlyRate, quarters);
  const denominator = Math.pow(1 + quarterlyRate, quarters) - 1;
  return numerator / denominator;
};

// Calcular cuota semestral
export const calculateSemiannualPayment = (amount, semesters, interestRate) => {
  const semiannualRate = interestRate / 100 / 2;
  const numerator = amount * semiannualRate * Math.pow(1 + semiannualRate, semesters);
  const denominator = Math.pow(1 + semiannualRate, semesters) - 1;
  return numerator / denominator;
};

// Calcular cuota anual
export const calculateAnnualPayment = (amount, years, interestRate) => {
  const annualRate = interestRate / 100;
  const numerator = amount * annualRate * Math.pow(1 + annualRate, years);
  const denominator = Math.pow(1 + annualRate, years) - 1;
  return numerator / denominator;
};

// Calcular interés simple
export const calculateSimpleInterest = (principal, rate, time) => {
  return principal * (rate / 100) * time;
};

// Calcular interés compuesto
export const calculateCompoundInterest = (principal, rate, time, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  const compounds = time * compoundsPerYear;
  return principal * Math.pow(1 + ratePerCompound, compounds) - principal;
};

// Calcular valor futuro
export const calculateFutureValue = (principal, rate, time, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  const compounds = time * compoundsPerYear;
  return principal * Math.pow(1 + ratePerCompound, compounds);
};

// Calcular valor presente
export const calculatePresentValue = (futureValue, rate, time, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  const compounds = time * compoundsPerYear;
  return futureValue / Math.pow(1 + ratePerCompound, compounds);
};

// Calcular tasa de interés
export const calculateInterestRate = (principal, futureValue, time, compoundsPerYear = 1) => {
  const compounds = time * compoundsPerYear;
  const ratePerCompound = Math.pow(futureValue / principal, 1 / compounds) - 1;
  return ratePerCompound * compoundsPerYear * 100;
};

// Calcular tiempo
export const calculateTime = (principal, futureValue, rate, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  return Math.log(futureValue / principal) / Math.log(1 + ratePerCompound) / compoundsPerYear;
};

// Calcular número de pagos
export const calculateNumberOfPayments = (principal, payment, rate, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  return Math.log(payment / (payment - principal * ratePerCompound)) / Math.log(1 + ratePerCompound);
};

// Calcular pago
export const calculatePayment = (principal, rate, time, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  const compounds = time * compoundsPerYear;
  const numerator = principal * ratePerCompound * Math.pow(1 + ratePerCompound, compounds);
  const denominator = Math.pow(1 + ratePerCompound, compounds) - 1;
  return numerator / denominator;
};

// Calcular principal
export const calculatePrincipal = (payment, rate, time, compoundsPerYear = 1) => {
  const ratePerCompound = rate / 100 / compoundsPerYear;
  const compounds = time * compoundsPerYear;
  const numerator = payment * (Math.pow(1 + ratePerCompound, compounds) - 1);
  const denominator = ratePerCompound * Math.pow(1 + ratePerCompound, compounds);
  return numerator / denominator;
};

// Calcular tasa de descuento
export const calculateDiscountRate = (presentValue, futureValue, time) => {
  return (Math.pow(futureValue / presentValue, 1 / time) - 1) * 100;
};

// Calcular tasa de retorno
export const calculateReturnRate = (initialInvestment, finalValue, time) => {
  return (Math.pow(finalValue / initialInvestment, 1 / time) - 1) * 100;
};

// Calcular tasa de inflación
export const calculateInflationRate = (initialValue, finalValue, time) => {
  return (Math.pow(finalValue / initialValue, 1 / time) - 1) * 100;
};

// Calcular tasa de crecimiento
export const calculateGrowthRate = (initialValue, finalValue, time) => {
  return (Math.pow(finalValue / initialValue, 1 / time) - 1) * 100;
};

// Calcular tasa de depreciación
export const calculateDepreciationRate = (initialValue, finalValue, time) => {
  return (1 - Math.pow(finalValue / initialValue, 1 / time)) * 100;
};

// Calcular tasa de amortización
export const calculateAmortizationRate = (initialValue, finalValue, time) => {
  return (1 - Math.pow(finalValue / initialValue, 1 / time)) * 100;
};

// Calcular tasa de rendimiento
export const calculateYieldRate = (initialInvestment, finalValue, time) => {
  return (Math.pow(finalValue / initialInvestment, 1 / time) - 1) * 100;
};

// Calcular tasa de rentabilidad
export const calculateProfitabilityRate = (initialInvestment, finalValue, time) => {
  return (Math.pow(finalValue / initialInvestment, 1 / time) - 1) * 100;
};

// Calcular tasa de beneficio
export const calculateProfitRate = (initialInvestment, finalValue, time) => {
  return (Math.pow(finalValue / initialInvestment, 1 / time) - 1) * 100;
};

// Calcular tasa de pérdida
export const calculateLossRate = (initialInvestment, finalValue, time) => {
  return (1 - Math.pow(finalValue / initialInvestment, 1 / time)) * 100;
};

// Calcular tasa de ganancia
export const calculateGainRate = (initialInvestment, finalValue, time) => {
  return (Math.pow(finalValue / initialInvestment, 1 / time) - 1) * 100;
}; 