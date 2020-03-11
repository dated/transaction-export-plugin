class MarketService {
  constructor ({ address, token, currency, epoch }) {
    this.config = {
      address,
      token,
      currency,
      epoch
    }
  }

  updateConfig (config) {
    this.config = {
      ...this.config,
      ...config
    }
  }

  async fetchClosingPrices () {
    const { body } = await walletApi.http.get('https://min-api.cryptocompare.com/data/histoday', {
      query: {
        fsym: this.config.token,
        tsym: this.config.currency,
        toTs: Math.round(Date.now() / 1000),
        limit: this.getDaysSinceLaunch()
      },
      json: true
    })

    return Object.values(body.Data).map(price => {
      return {
        currency: this.config.currency,
        date: walletApi.utils.datetime(price.time * 1000).format('YYYY-MM-DD'),
        price: price.close
      }
    })
  }

  async fetchTransactions () {
    let reachedLastPage = false
    let page = 1

    let isEstimate
    let transactions = []

    while (!reachedLastPage) {
      const requests = []

      const limit = page + 10

      while (page < limit) {
        requests.push(
          walletApi.peers.current.get(`wallets/${this.config.address}/transactions`, {
            query: {
              page
            },
            retry: 10
          })
        )

        page++
      }

      const results = await Promise.all((requests))

      for (const result of results) {
        const { meta, data } = result

        if (data.length === 0 && !reachedLastPage) {
          reachedLastPage = true
        } else {
          transactions = transactions.concat(data)
        }

        if (isEstimate === undefined) {
          isEstimate = meta.totalCountIsEstimate
        }
      }
    }

    return {
      isEstimate,
      transactions: transactions.filter(transaction => {
        return (
          transaction.type === 6 ||
          (transaction.type === 0 && transaction.recipient !== transaction.sender)
        )
      })
    }
  }

  combinePricesWithTransactions (prices, transactions) {
    return transactions.map(transaction => {
      let cryptoAmount = new walletApi.utils.bigNumber(0)

      if (transaction.type === 0) {
        if (transaction.sender === this.config.address) {
          cryptoAmount = cryptoAmount.minus(transaction.amount)
        } else {
          cryptoAmount = cryptoAmount.plus(transaction.amount)
        }
      } else if (transaction.type === 6) {
        if (transaction.sender === this.config.address) {
          for (const payment of transaction.asset.payments) {
            if (payment.recipientId !== this.config.address) {
              cryptoAmount = cryptoAmount.minus(payment.amount)
            }
          }
        } else {
          for (const payment of transaction.asset.payments) {
            if (payment.recipientId === this.config.address) {
              cryptoAmount = cryptoAmount.plus(payment.amount)
            }
          }
        }
      }

      cryptoAmount = cryptoAmount.dividedBy(1e8)

      const transactionTime = walletApi.utils.datetime(transaction.timestamp.unix * 1000).format('YYYY-MM-DD')
      const historicalPoint = prices.find(price => price.date === transactionTime)

      return {
        id: transaction.id,
        date: historicalPoint.date,
        crypto: cryptoAmount.toString(),
        fiat: historicalPoint ? cryptoAmount.times(historicalPoint.price).toString() : 'n/a'
      }
    })
  }

  getDaysSinceLaunch () {
    const oneDay = 24 * 60 * 60 * 1000
    const startDate = new Date(this.config.epoch)
    const endDate = Date.now()

    return Math.round(Math.abs((startDate - endDate) / oneDay))
  }
}

module.exports = MarketService
