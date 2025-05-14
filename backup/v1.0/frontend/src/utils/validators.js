// Validar email
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Validar teléfono
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 9 || cleanPhone.length === 12;
};

// Validar DNI
export const isValidDNI = (dni) => {
  if (!dni) return false;
  const cleanDNI = dni.replace(/\D/g, '');
  if (cleanDNI.length !== 8) return false;

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(cleanDNI);
  const letter = letters[number % 23];
  
  return letter === dni.charAt(8).toUpperCase();
};

// Validar NIE
export const isValidNIE = (nie) => {
  if (!nie) return false;
  const cleanNIE = nie.replace(/\D/g, '');
  if (cleanNIE.length !== 7) return false;

  const firstLetter = nie.charAt(0).toUpperCase();
  if (!['X', 'Y', 'Z'].includes(firstLetter)) return false;

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(cleanNIE);
  const letter = letters[number % 23];
  
  return letter === nie.charAt(8).toUpperCase();
};

// Validar DNI/NIE
export const isValidDNIorNIE = (document) => {
  if (!document) return false;
  const firstChar = document.charAt(0).toUpperCase();
  return ['X', 'Y', 'Z'].includes(firstChar) ? isValidNIE(document) : isValidDNI(document);
};

// Validar código postal
export const isValidPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const cleanPostalCode = postalCode.replace(/\D/g, '');
  return cleanPostalCode.length === 5;
};

// Validar matrícula
export const isValidMatricula = (matricula) => {
  if (!matricula) return false;
  const cleanMatricula = matricula.replace(/\s/g, '').toUpperCase();
  
  // Formato antiguo: 0000-XXX
  const oldFormat = /^\d{4}-[A-Z]{3}$/;
  // Formato nuevo: 0000-XXX
  const newFormat = /^\d{4}-[A-Z]{3}$/;
  
  return oldFormat.test(cleanMatricula) || newFormat.test(cleanMatricula);
};

// Validar IBAN
export const isValidIBAN = (iban) => {
  if (!iban) return false;
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  
  // Verificar longitud
  if (cleanIBAN.length !== 24) return false;
  
  // Verificar país
  if (!cleanIBAN.startsWith('ES')) return false;
  
  // Verificar dígitos de control
  const ibanNumber = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);
  const ibanNumberBig = BigInt(ibanNumber);
  return ibanNumberBig % 97n === 1n;
};

// Validar CIF
export const isValidCIF = (cif) => {
  if (!cif) return false;
  const cleanCIF = cif.replace(/\s/g, '').toUpperCase();
  
  // Verificar longitud
  if (cleanCIF.length !== 9) return false;
  
  // Verificar primera letra
  const firstChar = cleanCIF.charAt(0);
  if (!['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'W'].includes(firstChar)) {
    return false;
  }
  
  // Verificar dígito de control
  const controlDigit = cleanCIF.charAt(8);
  const number = cleanCIF.substring(1, 8);
  
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let digit = parseInt(number.charAt(i));
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = digit.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
      }
    }
    sum += digit;
  }
  
  const control = (10 - (sum % 10)) % 10;
  return control.toString() === controlDigit;
};

// Validar tarjeta de crédito
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  const cleanCard = cardNumber.replace(/\D/g, '');
  
  // Verificar longitud
  if (cleanCard.length < 13 || cleanCard.length > 19) return false;
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanCard.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanCard.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit = digit.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Validar CVV
export const isValidCVV = (cvv) => {
  if (!cvv) return false;
  const cleanCVV = cvv.replace(/\D/g, '');
  return cleanCVV.length === 3 || cleanCVV.length === 4;
};

// Validar fecha de caducidad de tarjeta
export const isValidCardExpiry = (expiry) => {
  if (!expiry) return false;
  const cleanExpiry = expiry.replace(/\D/g, '');
  
  if (cleanExpiry.length !== 4) return false;
  
  const month = parseInt(cleanExpiry.substring(0, 2));
  const year = parseInt('20' + cleanExpiry.substring(2, 4));
  
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
};

// Validar contraseña
export const isValidPassword = (password) => {
  if (!password) return false;
  
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Validar nombre
export const isValidName = (name) => {
  if (!name) return false;
  
  // Solo letras, espacios y guiones
  const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  return nameRegex.test(name);
};

// Validar dirección
export const isValidAddress = (address) => {
  if (!address) return false;
  
  // Letras, números, espacios y caracteres comunes
  const addressRegex = /^[a-zA-Z0-9À-ÿ\s.,ºª-]{5,100}$/;
  return addressRegex.test(address);
};

// Validar número de piso
export const isValidFloor = (floor) => {
  if (!floor) return false;
  
  // Números y letras para piso
  const floorRegex = /^[0-9]{1,2}[a-zA-Z]?$/;
  return floorRegex.test(floor);
};

// Validar número de puerta
export const isValidDoor = (door) => {
  if (!door) return false;
  
  // Números y letras para puerta
  const doorRegex = /^[0-9]{1,2}[a-zA-Z]?$/;
  return doorRegex.test(door);
};

// Validar ciudad
export const isValidCity = (city) => {
  if (!city) return false;
  
  // Solo letras, espacios y guiones
  const cityRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  return cityRegex.test(city);
};

// Validar provincia
export const isValidProvince = (province) => {
  if (!province) return false;
  
  // Solo letras, espacios y guiones
  const provinceRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  return provinceRegex.test(province);
};

// Validar país
export const isValidCountry = (country) => {
  if (!country) return false;
  
  // Solo letras, espacios y guiones
  const countryRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  return countryRegex.test(country);
};

// Validar número de factura
export const isValidInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const invoiceRegex = /^F-\d{4}-\d{5}$/;
  return invoiceRegex.test(number);
};

// Validar número de servicio
export const isValidServiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: S-YYYY-XXXXX
  const serviceRegex = /^S-\d{4}-\d{5}$/;
  return serviceRegex.test(number);
};

// Validar número de repuesto
export const isValidPartNumber = (number) => {
  if (!number) return false;
  
  // Formato: R-XXXXX
  const partRegex = /^R-\d{5}$/;
  return partRegex.test(number);
};

// Validar número de vehículo
export const isValidVehicleNumber = (number) => {
  if (!number) return false;
  
  // Formato: V-XXXXX
  const vehicleRegex = /^V-\d{5}$/;
  return vehicleRegex.test(number);
};

// Validar número de cliente
export const isValidCustomerNumber = (number) => {
  if (!number) return false;
  
  // Formato: C-XXXXX
  const customerRegex = /^C-\d{5}$/;
  return customerRegex.test(number);
};

// Validar número de empleado
export const isValidEmployeeNumber = (number) => {
  if (!number) return false;
  
  // Formato: E-XXXXX
  const employeeRegex = /^E-\d{5}$/;
  return employeeRegex.test(number);
};

// Validar número de proveedor
export const isValidSupplierNumber = (number) => {
  if (!number) return false;
  
  // Formato: P-XXXXX
  const supplierRegex = /^P-\d{5}$/;
  return supplierRegex.test(number);
};

// Validar número de taller
export const isValidWorkshopNumber = (number) => {
  if (!number) return false;
  
  // Formato: T-XXXXX
  const workshopRegex = /^T-\d{5}$/;
  return workshopRegex.test(number);
};

// Validar número de cita
export const isValidAppointmentNumber = (number) => {
  if (!number) return false;
  
  // Formato: A-YYYY-XXXXX
  const appointmentRegex = /^A-\d{4}-\d{5}$/;
  return appointmentRegex.test(number);
};

// Validar número de presupuesto
export const isValidQuoteNumber = (number) => {
  if (!number) return false;
  
  // Formato: Q-YYYY-XXXXX
  const quoteRegex = /^Q-\d{4}-\d{5}$/;
  return quoteRegex.test(number);
};

// Validar número de albarán
export const isValidDeliveryNoteNumber = (number) => {
  if (!number) return false;
  
  // Formato: D-YYYY-XXXXX
  const deliveryNoteRegex = /^D-\d{4}-\d{5}$/;
  return deliveryNoteRegex.test(number);
};

// Validar número de remesa
export const isValidBatchNumber = (number) => {
  if (!number) return false;
  
  // Formato: B-YYYY-XXXXX
  const batchRegex = /^B-\d{4}-\d{5}$/;
  return batchRegex.test(number);
};

// Validar número de lote
export const isValidLotNumber = (number) => {
  if (!number) return false;
  
  // Formato: L-YYYY-XXXXX
  const lotRegex = /^L-\d{4}-\d{5}$/;
  return lotRegex.test(number);
};

// Validar número de serie
export const isValidSerialNumber = (number) => {
  if (!number) return false;
  
  // Formato: S-YYYY-XXXXX
  const serialRegex = /^S-\d{4}-\d{5}$/;
  return serialRegex.test(number);
};

// Validar número de modelo
export const isValidModelNumber = (number) => {
  if (!number) return false;
  
  // Formato: M-XXXXX
  const modelRegex = /^M-\d{5}$/;
  return modelRegex.test(number);
};

// Validar número de marca
export const isValidBrandNumber = (number) => {
  if (!number) return false;
  
  // Formato: B-XXXXX
  const brandRegex = /^B-\d{5}$/;
  return brandRegex.test(number);
};

// Validar número de categoría
export const isValidCategoryNumber = (number) => {
  if (!number) return false;
  
  // Formato: C-XXXXX
  const categoryRegex = /^C-\d{5}$/;
  return categoryRegex.test(number);
};

// Validar número de subcategoría
export const isValidSubcategoryNumber = (number) => {
  if (!number) return false;
  
  // Formato: S-XXXXX
  const subcategoryRegex = /^S-\d{5}$/;
  return subcategoryRegex.test(number);
};

// Validar número de familia
export const isValidFamilyNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-XXXXX
  const familyRegex = /^F-\d{5}$/;
  return familyRegex.test(number);
};

// Validar número de subfamilia
export const isValidSubfamilyNumber = (number) => {
  if (!number) return false;
  
  // Formato: S-XXXXX
  const subfamilyRegex = /^S-\d{5}$/;
  return subfamilyRegex.test(number);
};

// Validar número de grupo
export const isValidGroupNumber = (number) => {
  if (!number) return false;
  
  // Formato: G-XXXXX
  const groupRegex = /^G-\d{5}$/;
  return groupRegex.test(number);
};

// Validar número de subgrupo
export const isValidSubgroupNumber = (number) => {
  if (!number) return false;
  
  // Formato: S-XXXXX
  const subgroupRegex = /^S-\d{5}$/;
  return subgroupRegex.test(number);
};

// Validar número de unidad
export const isValidUnitNumber = (number) => {
  if (!number) return false;
  
  // Formato: U-XXXXX
  const unitRegex = /^U-\d{5}$/;
  return unitRegex.test(number);
};

// Validar número de medida
export const isValidMeasureNumber = (number) => {
  if (!number) return false;
  
  // Formato: M-XXXXX
  const measureRegex = /^M-\d{5}$/;
  return measureRegex.test(number);
};

// Validar número de moneda
export const isValidCurrencyNumber = (number) => {
  if (!number) return false;
  
  // Formato: C-XXXXX
  const currencyRegex = /^C-\d{5}$/;
  return currencyRegex.test(number);
};

// Validar número de impuesto
export const isValidTaxNumber = (number) => {
  if (!number) return false;
  
  // Formato: T-XXXXX
  const taxRegex = /^T-\d{5}$/;
  return taxRegex.test(number);
};

// Validar número de descuento
export const isValidDiscountNumber = (number) => {
  if (!number) return false;
  
  // Formato: D-XXXXX
  const discountRegex = /^D-\d{5}$/;
  return discountRegex.test(number);
};

// Validar número de recargo
export const isValidSurchargeNumber = (number) => {
  if (!number) return false;
  
  // Formato: R-XXXXX
  const surchargeRegex = /^R-\d{5}$/;
  return surchargeRegex.test(number);
};

// Validar número de forma de pago
export const isValidPaymentMethodNumber = (number) => {
  if (!number) return false;
  
  // Formato: P-XXXXX
  const paymentMethodRegex = /^P-\d{5}$/;
  return paymentMethodRegex.test(number);
};

// Validar número de banco
export const isValidBankNumber = (number) => {
  if (!number) return false;
  
  // Formato: B-XXXXX
  const bankRegex = /^B-\d{5}$/;
  return bankRegex.test(number);
};

// Validar número de cuenta bancaria
export const isValidBankAccountNumber = (number) => {
  if (!number) return false;
  
  // Formato: A-XXXXX
  const bankAccountRegex = /^A-\d{5}$/;
  return bankAccountRegex.test(number);
};

// Validar número de tarjeta bancaria
export const isValidBankCardNumber = (number) => {
  if (!number) return false;
  
  // Formato: C-XXXXX
  const bankCardRegex = /^C-\d{5}$/;
  return bankCardRegex.test(number);
};

// Validar número de transferencia
export const isValidTransferNumber = (number) => {
  if (!number) return false;
  
  // Formato: T-YYYY-XXXXX
  const transferRegex = /^T-\d{4}-\d{5}$/;
  return transferRegex.test(number);
};

// Validar número de recibo
export const isValidReceiptNumber = (number) => {
  if (!number) return false;
  
  // Formato: R-YYYY-XXXXX
  const receiptRegex = /^R-\d{4}-\d{5}$/;
  return receiptRegex.test(number);
};

// Validar número de remesa
export const isValidRemittanceNumber = (number) => {
  if (!number) return false;
  
  // Formato: R-YYYY-XXXXX
  const remittanceRegex = /^R-\d{4}-\d{5}$/;
  return remittanceRegex.test(number);
};

// Validar número de devolución
export const isValidReturnNumber = (number) => {
  if (!number) return false;
  
  // Formato: D-YYYY-XXXXX
  const returnRegex = /^D-\d{4}-\d{5}$/;
  return returnRegex.test(number);
};

// Validar número de abono
export const isValidCreditNoteNumber = (number) => {
  if (!number) return false;
  
  // Formato: A-YYYY-XXXXX
  const creditNoteRegex = /^A-\d{4}-\d{5}$/;
  return creditNoteRegex.test(number);
};

// Validar número de cargo
export const isValidDebitNoteNumber = (number) => {
  if (!number) return false;
  
  // Formato: C-YYYY-XXXXX
  const debitNoteRegex = /^C-\d{4}-\d{5}$/;
  return debitNoteRegex.test(number);
};

// Validar número de factura rectificativa
export const isValidCorrectiveInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const correctiveInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return correctiveInvoiceRegex.test(number);
};

// Validar número de factura complementaria
export const isValidComplementaryInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const complementaryInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return complementaryInvoiceRegex.test(number);
};

// Validar número de factura proforma
export const isValidProformaInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const proformaInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return proformaInvoiceRegex.test(number);
};

// Validar número de factura simplificada
export const isValidSimplifiedInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const simplifiedInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return simplifiedInvoiceRegex.test(number);
};

// Validar número de factura electrónica
export const isValidElectronicInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const electronicInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return electronicInvoiceRegex.test(number);
};

// Validar número de factura de exportación
export const isValidExportInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const exportInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return exportInvoiceRegex.test(number);
};

// Validar número de factura de importación
export const isValidImportInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const importInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return importInvoiceRegex.test(number);
};

// Validar número de factura de intracomunitario
export const isValidIntracommunityInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const intracommunityInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return intracommunityInvoiceRegex.test(number);
};

// Validar número de factura de extracomunitario
export const isValidExtracommunityInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const extracommunityInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return extracommunityInvoiceRegex.test(number);
};

// Validar número de factura de autofactura
export const isValidSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const selfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return selfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura rectificativa
export const isValidCorrectiveSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const correctiveSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return correctiveSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura complementaria
export const isValidComplementarySelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const complementarySelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return complementarySelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura proforma
export const isValidProformaSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const proformaSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return proformaSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura simplificada
export const isValidSimplifiedSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const simplifiedSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return simplifiedSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura electrónica
export const isValidElectronicSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const electronicSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return electronicSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura de exportación
export const isValidExportSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const exportSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return exportSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura de importación
export const isValidImportSelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const importSelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return importSelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura de intracomunitario
export const isValidIntracommunitySelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const intracommunitySelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return intracommunitySelfInvoiceRegex.test(number);
};

// Validar número de factura de autofactura de extracomunitario
export const isValidExtracommunitySelfInvoiceNumber = (number) => {
  if (!number) return false;
  
  // Formato: F-YYYY-XXXXX
  const extracommunitySelfInvoiceRegex = /^F-\d{4}-\d{5}$/;
  return extracommunitySelfInvoiceRegex.test(number);
}; 