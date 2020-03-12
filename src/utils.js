module.exports = {
  // https://github.com/lodash/lodash/blob/master/chunk.js
  chunk: (array, size = 1) => {
    const length = array == null ? 0 : array.length
    if (!length || size < 1) {
      return []
    }
    let index = 0
    let resIndex = 0
    const result = new Array(Math.ceil(length / size))

    while (index < length) {
      result[resIndex++] = array.slice(index, (index += size))
    }
    return result
  },

  formatter_number: (value, language = en) => {
    return Number(value).toLocaleString(language)
  },

  formatter_currency: (value, currency, language = 'en') => {
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
}
