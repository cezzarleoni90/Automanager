import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CURRENCY, DATE_FORMAT } from './constants';

// Formatear fecha
export const formatDate = (date, formatStr = DATE_FORMAT.DISPLAY) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return date;
  }
};

// Formatear fecha y hora
export const formatDateTime = (date) => {
  return formatDate(date, DATE_FORMAT.DATETIME);
};

// Formatear moneda
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '';
  try {
    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error al formatear moneda:', error);
    return amount;
  }
};

// Formatear número
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '';
  try {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      useGrouping = true
    } = options;

    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping
    }).format(number);
  } catch (error) {
    console.error('Error al formatear número:', error);
    return number;
  }
};

// Formatear porcentaje
export const formatPercent = (number, options = {}) => {
  if (number === null || number === undefined) return '';
  try {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2
    } = options;

    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(number / 100);
  } catch (error) {
    console.error('Error al formatear porcentaje:', error);
    return number;
  }
};

// Formatear DNI/NIE
export const formatDNI = (dni) => {
  if (!dni) return '';
  try {
    // Eliminar espacios y convertir a mayúsculas
    const cleanDNI = dni.replace(/\s/g, '').toUpperCase();
    
    // Verificar si es NIE
    if (cleanDNI.startsWith('X') || cleanDNI.startsWith('Y') || cleanDNI.startsWith('Z')) {
      return cleanDNI.replace(/([XYZ])(\d{7})([A-Z])/, '$1-$2-$3');
    }
    
    // Formatear DNI
    return cleanDNI.replace(/(\d{8})([A-Z])/, '$1-$2');
  } catch (error) {
    console.error('Error al formatear DNI/NIE:', error);
    return dni;
  }
};

// Formatear teléfono
export const formatPhone = (phone) => {
  if (!phone) return '';
  try {
    // Eliminar todos los caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Formatear según la longitud
    if (cleanPhone.length === 9) {
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (cleanPhone.length === 12) {
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
    }
    
    return phone;
  } catch (error) {
    console.error('Error al formatear teléfono:', error);
    return phone;
  }
};

// Formatear código postal
export const formatPostalCode = (postalCode) => {
  if (!postalCode) return '';
  try {
    // Eliminar todos los caracteres no numéricos
    const cleanPostalCode = postalCode.replace(/\D/g, '');
    
    // Formatear como XXXXX
    return cleanPostalCode.replace(/(\d{5})/, '$1');
  } catch (error) {
    console.error('Error al formatear código postal:', error);
    return postalCode;
  }
};

// Formatear matrícula
export const formatMatricula = (matricula) => {
  if (!matricula) return '';
  try {
    // Eliminar espacios y convertir a mayúsculas
    const cleanMatricula = matricula.replace(/\s/g, '').toUpperCase();
    
    // Formatear según el formato antiguo (0000-XXX) o nuevo (0000-XXX)
    return cleanMatricula.replace(/(\d{4})([A-Z]{3})/, '$1-$2');
  } catch (error) {
    console.error('Error al formatear matrícula:', error);
    return matricula;
  }
};

// Formatear IBAN
export const formatIBAN = (iban) => {
  if (!iban) return '';
  try {
    // Eliminar espacios y convertir a mayúsculas
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    
    // Formatear como XXXX XXXX XXXX XXXX XXXX XXXX
    return cleanIBAN.replace(/(.{4})/g, '$1 ').trim();
  } catch (error) {
    console.error('Error al formatear IBAN:', error);
    return iban;
  }
};

// Formatear CIF
export const formatCIF = (cif) => {
  if (!cif) return '';
  try {
    // Eliminar espacios y convertir a mayúsculas
    const cleanCIF = cif.replace(/\s/g, '').toUpperCase();
    
    // Formatear como X-0000000-X
    return cleanCIF.replace(/([A-Z])(\d{7})([A-Z0-9])/, '$1-$2-$3');
  } catch (error) {
    console.error('Error al formatear CIF:', error);
    return cif;
  }
};

// Formatear tarjeta de crédito
export const formatCreditCard = (cardNumber) => {
  if (!cardNumber) return '';
  try {
    // Eliminar todos los caracteres no numéricos
    const cleanCard = cardNumber.replace(/\D/g, '');
    
    // Formatear como XXXX XXXX XXXX XXXX
    return cleanCard.replace(/(\d{4})/g, '$1 ').trim();
  } catch (error) {
    console.error('Error al formatear tarjeta de crédito:', error);
    return cardNumber;
  }
};

// Formatear CVV
export const formatCVV = (cvv) => {
  if (!cvv) return '';
  try {
    // Eliminar todos los caracteres no numéricos
    return cvv.replace(/\D/g, '');
  } catch (error) {
    console.error('Error al formatear CVV:', error);
    return cvv;
  }
};

// Formatear fecha de caducidad de tarjeta
export const formatCardExpiry = (expiry) => {
  if (!expiry) return '';
  try {
    // Eliminar todos los caracteres no numéricos
    const cleanExpiry = expiry.replace(/\D/g, '');
    
    // Formatear como MM/YY
    return cleanExpiry.replace(/(\d{2})(\d{2})/, '$1/$2');
  } catch (error) {
    console.error('Error al formatear fecha de caducidad:', error);
    return expiry;
  }
};

// Formatear nombre completo
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return '';
  try {
    const formatName = (name) => {
      if (!name) return '';
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formattedFirstName = formatName(firstName);
    const formattedLastName = formatName(lastName);

    return [formattedFirstName, formattedLastName].filter(Boolean).join(' ');
  } catch (error) {
    console.error('Error al formatear nombre completo:', error);
    return [firstName, lastName].filter(Boolean).join(' ');
  }
};

// Formatear dirección
export const formatAddress = (street, number, floor, door, postalCode, city) => {
  if (!street) return '';
  try {
    const parts = [
      street,
      number,
      floor && `Piso ${floor}`,
      door && `Puerta ${door}`,
      postalCode && city ? `${postalCode} ${city}` : postalCode || city
    ].filter(Boolean);

    return parts.join(', ');
  } catch (error) {
    console.error('Error al formatear dirección:', error);
    return [street, number, floor, door, postalCode, city].filter(Boolean).join(', ');
  }
};

// Formatear estado de servicio
export const formatEstadoServicio = (estado) => {
  const estados = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En Proceso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado'
  };
  return estados[estado] || estado;
};

// Formatear tipo de servicio
export const formatTipoServicio = (tipo) => {
  const tipos = {
    MANTENIMIENTO: 'Mantenimiento',
    REPARACION: 'Reparación',
    REVISION: 'Revisión',
    DIAGNOSTICO: 'Diagnóstico'
  };
  return tipos[tipo] || tipo;
};

// Formatear estado de factura
export const formatEstadoFactura = (estado) => {
  const estados = {
    PENDIENTE: 'Pendiente',
    PAGADA: 'Pagada',
    ANULADA: 'Anulada'
  };
  return estados[estado] || estado;
};

// Formatear tipo de pago
export const formatTipoPago = (tipo) => {
  const tipos = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta',
    TRANSFERENCIA: 'Transferencia'
  };
  return tipos[tipo] || tipo;
}; 