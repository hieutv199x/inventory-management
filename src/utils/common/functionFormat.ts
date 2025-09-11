export const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  const currencyLocaleMap: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE", 
  GBP: "en-GB",
  JPY: "ja-JP",
  VND: "vi-VN",
  CNY: "zh-CN",
  KRW: "ko-KR"
};

export const formatCurrency = (value: string, currency: string) => {
  const number = parseFloat(value);
  if (isNaN(number)) return value;

  const locale = currencyLocaleMap[currency] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(number);
};

// Helper function to compute UK-style address format
export const computeUKAddress = (address: any): string => {
    const parts = [];
    
    // Parse channelData if available
    let addressData = address;
    if (address.channelData) {
        try {
            const channelData = JSON.parse(address.channelData);
            addressData = { ...address, ...channelData };
        } catch (error) {
            console.warn('Failed to parse address channelData, using original address');
        }
    }
    
    // Line 2: Address Line 1 (main address)
    if (addressData.addressLine1) {
        parts.push(addressData.addressLine1);
    } else if (addressData.addressDetail) {
        parts.push(addressData.addressDetail);
    } else if (address.houseNumber && address.streetName) {
        parts.push(`${address.houseNumber} ${address.streetName}`);
    }
    
    // Line 3: Address Line 2 (additional details)
    if (addressData.addressLine2 && addressData.addressLine2.trim()) {
        parts.push(addressData.addressLine2);
    } else if (address.addressLine2) {
        parts.push(address.addressLine2);
    }
    
    // Line 4: Address Line 3 (if available)
    if (addressData.addressLine3 && addressData.addressLine3.trim()) {
        parts.push(addressData.addressLine3);
    }
    
    // Line 5: Address Line 4 (if available)
    if (addressData.addressLine4 && addressData.addressLine4.trim()) {
        parts.push(addressData.addressLine4);
    }
    
    // Extract location information from districtInfo array
    let city = '';
    let county = '';
    let country = '';
    
    if (addressData.districtInfo && Array.isArray(addressData.districtInfo)) {
        addressData.districtInfo.forEach((district: any) => {
            switch (district.addressLevel) {
                case 'L0':
                    if (district.addressLevelName?.toLowerCase() === 'country') {
                        country = district.addressName;
                    }
                    break;
                case 'L1':
                    if (district.addressLevelName?.toLowerCase() === 'country') {
                        // This is a region/state within country (e.g., Northern Ireland)
                        county = district.addressName;
                    }
                    break;
                case 'L2':
                    if (district.addressLevelName?.toLowerCase() === 'county') {
                        // This is the local authority/county
                        city = district.addressName;
                    }
                    break;
            }
        });
    }
    
    // Fallback to original address fields if districtInfo is not available
    if (!city && (address.city || address.district)) {
        city = address.city || address.district;
    }
    if (!county && address.state) {
        county = address.state;
    }
    if (!country && address.country) {
        country = address.country;
    }
    
    // Add city/local authority if available
    if (city) {
        parts.push(city);
    }
    
    // Add county/region if different from city
    if (county && county !== city) {
        parts.push(county);
    }
    
    // Last line: Postcode and Country
    const lastLine = [];
    if (address.postcode || address.zipCode) {
        lastLine.push(address.postcode || address.zipCode);
    }
    if (country) {
        lastLine.push(country);
    }
    if (lastLine.length > 0) {
        parts.push(lastLine.join(', '));
    }
    
    return parts.filter(part => part && part.trim()).join(', ');
}
