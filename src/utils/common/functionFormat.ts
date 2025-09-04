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