class MarketService {
  constructor ({ address, token, currency, epoch, peers }) {
    this.config = {
      address,
      token,
      currency,
      epoch,
      peers
    }

    this.closingPrices = {}
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

    const priceMap = new Map()

    for (const price of Object.values(body.Data)) {
      const date = walletApi.utils.datetime(price.time * 1000).format('YYYY-MM-DD')
      priceMap.set(date, price.close)
    }

    this.closingPrices[this.config.currency] = priceMap
  }

  async fetchTransactions ({ sent, received }, timestamp) {
    if (!this.closingPrices[this.config.currency]) {
      await this.fetchClosingPrices()
    }

    const transactions = []
    const requests = []

    for (const param of ['senderId', 'recipientId']) {
      let page = 1

      const pageCount = param === 'senderId' ? sent.pageCount : received.pageCount

      while (page <= pageCount) {
        const peer = this.config.peers[Math.floor(Math.random() * this.config.peers.length)]

        requests.push(
          walletApi.http.post(`http://${peer.ip}:${peer.port}/api/transactions/search`, {
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              [param]: this.config.address,
              timestamp
            }),
            query: {
              page
            },
            retry: 5
          })
        )

        page++
      }
    }

    const responses = await Promise.all(requests)

    for (const response of responses) {
      const body = JSON.parse(response.body)
      transactions.push(...body.data)
    }

    return transactions.sort((a, b) => b.timestamp.unix - a.timestamp.unix).filter(transaction => {
      return (
        transaction.type === 6 ||
        (transaction.type === 0 && transaction.recipient !== transaction.sender)
      )
    })
  }

  combinePricesWithTransactions (transactions) {
    const data = []

    for (const transaction of transactions) {
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

      const transactionDate = walletApi.utils.datetime(transaction.timestamp.unix * 1000).format('YYYY-MM-DD')
      const historicalPrice = this.closingPrices[this.config.currency].get(transactionDate)

      if (!cryptoAmount.isZero()) {
        data.push({
          id: transaction.id,
          date: transactionDate,
          crypto: cryptoAmount.toString(),
          fiat: historicalPrice ? cryptoAmount.times(historicalPrice).toString() : 'n/a'
        })
      }
    }

    return data
  }

  getDaysSinceLaunch () {
    const oneDay = 24 * 60 * 60 * 1000
    const startDate = new Date(this.config.epoch)
    const endDate = Date.now()

    return Math.round(Math.abs((startDate - endDate) / oneDay))
  }
}

module.exports = MarketService
