const formatter_currency = (value, currency, language = 'en') => {
  const isCrypto = currency => {
    return ['BTC', 'ETH', 'LTC'].includes(currency)
  }

  return Number(value).toLocaleString(language, {
    style: 'currency',
    currencyDisplay: 'code',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: isCrypto(currency) ? 8 : 2
  })
}

const formatter_number = (value, language = en) => {
  return Number(value).toLocaleString(language)
}

module.exports = {
  formatter_currency,
  formatter_number
}
