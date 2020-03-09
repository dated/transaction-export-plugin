module.exports = {
  formatNumber: (value, language = en) => {
    return Number(value).toLocaleString(language)
  },

  formatCurrency: (value, currency, language = 'en') => {
    return Number(value).toLocaleString(language, {
      style: 'currency',
      currencyDisplay: 'code',
      currency
    })
  }
}
