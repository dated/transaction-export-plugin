const MarketService = require('../services/market.service.js')
const ImageService = require('../services/image.service.js')

const ButtonLoader = require('../components/ButtonLoader')
const Footer = require('../components/Footer')
const Header = require('../components/Header')
const RecordStats = require('../components/RecordStats')
const RecordTable = require('../components/RecordTable')

const DisclaimerModal = require('../components/modals/DisclaimerModal')
const TransactionCountWarningModal = require('../components/modals/TransactionCountWarningModal')
const ExportRecordsModal = require('../components/modals/ExportRecordsModal')

const utils = require('../utils')

module.exports = {
  template: `
    <div
      class="flex flex-col flex-1 overflow-y-auto"
    >
      <div
        v-if="!isInitialised"
        class="relative flex flex-col flex-1 justify-center items-center rounded-lg bg-theme-feature"
      >
        <img :src="logoImage" class="mb-10 rounded-lg">

        <span class="text-3xl font-semibold mb-10">
          Welcome to the <span class="font-bold">Transaction Export</span> Plugin
        </span>

        <div
          v-if="!hasMarketData"
          class="flex flex-col items-center"
        >
          <p class="mb-5">
            There is no market data available for the token (<span class="font-semibold">{{ profile.network.token }}</span>) configured in your profile.
          </p>

          <button
            class="flex items-center text-blue hover:underline"
            @click="goTo('profiles')"
          >
            Select a different profile
          </button>
        </div>

        <div
          v-else-if="!hasWallets"
          class="flex flex-col items-center"
        >
          <p class="mb-5">
            Your profile has no wallets yet.
          </p>

          <button
            class="flex items-center text-blue hover:underline"
            @click="goTo('wallet-import')"
          >
            Import a wallet now
          </button>
        </div>

        <div
          v-else
          class="flex flex-col items-center"
        >
          <div class="flex mb-10">
            <div class="flex flex-col mr-10">
              <span class="text-sm text-theme-page-text-light font-semibold mb-1">
                Address
              </span>

              <MenuDropdown
                ref="address"
                :disabled="isLoading"
                :items="addresses"
                :value="addresses[0]"
                :pin-to-input-width="true"
                @select="setAddress"
              />
            </div>

            <div class="flex flex-col">
              <span class="text-sm text-theme-page-text-light font-semibold mb-1">
                Period
              </span>

              <MenuDropdown
                ref="period"
                :disabled="isLoading"
                :items="periods"
                value="year"
                container-classes="whitespace-no-wrap"
                @select="setPeriod"
              />
            </div>
          </div>

          <ButtonLoader
            label="Load transactions"
            :disabled="isLoading || !address"
            :is-loading="isLoading"
            :callback="handleEvent"
          />
        </div>

        <p
          v-if="isLoading"
          class="absolute pin-b text-theme-page-text-light text-sm max-w-sm text-center mb-10"
        >
          <span class="font-bold">Please be advised:</span> Gathering the transaction data and combining it with the historic exchange rates might take some time.
        </p>
      </div>

      <div
        v-else
        class="flex flex-col flex-1 overflow-y-hidden"
      >
        <Header
          :address="address"
          :is-loading="isLoading"
          :has-records="records.data.length"
          :period="period"
          :available-periods="periods"
          :callback="handleEvent"
        />

        <div class="flex flex-col flex-1 p-10 rounded-lg bg-theme-feature overflow-y-auto">
          <div class="flex flex-1">
            <div
              v-if="isLoading"
              class="relative flex items-center mx-auto w-md"
            >
              <div class="mx-auto">
                <Loader />
              </div>

              <p class="absolute pin-b pin-x mx-auto text-theme-page-text-light text-sm max-w-sm text-center">
                <span class="font-bold">Please be advised:</span> Gathering the transaction data and combining it with the historic exchange rates might take some time.
              </p>
            </div>

            <div
              v-else-if="!records.data.length"
              class="flex flex-col items-center m-auto"
            >
              <img :src="noResultsImage" class="mb-4 max-w-xs min-w-48">
              <span>No transactions found for <span class="font-bold">{{ address }}</span></span>
            </div>

            <div
              v-else
              class="w-full"
            >
              <RecordStats
                class="mb-8"
                :totals="totals"
                :count="records.data.length"
                :filter="filter"
                :callback="handleEvent"
              />

              <RecordTable
                :rows="filteredRecords"
                :current-page="currentPage"
                :per-page="perPage"
                :callback="handleEvent"
              />
            </div>
          </div>
        </div>

        <div v-if="false" class="flex flex-col mt-3 p-10 rounded-lg bg-theme-feature">
          <span class="font-semibold mb-2">Debug panel</span>

          <div class="mb-2">
            Token: {{ profile.network.token }} / Currency: {{ profile.currency }}
          </div>

          <div class="mb-2">
            {{ options }}
          </div>
        </div>
      </div>

      <DisclaimerModal
        v-if="!options.hasAcceptedDisclaimer"
        :callback="handleEvent"
      />

      <TransactionCountWarningModal
        v-if="showTransactionCountWarningModal"
        :count="walletData.totalCount"
        :callback="handleEvent"
      />

      <ExportRecordsModal
        v-if="showExportRecordsModal"
        :count="filteredRecords.length"
        :callback="handleEvent"
      />

      <Footer />
    </div>
  `,

  components: {
    ButtonLoader,
    DisclaimerModal,
    ExportRecordsModal,
    TransactionCountWarningModal,
    Footer,
    Header,
    RecordStats,
    RecordTable
  },

  data: () => ({
    address: '',
    isLoading: false,
    isInitialised: false,
    currentPage: 1,
    perPage: 25,
    walletData: {
      sent: {
        totalCount: 0,
        pageCount: 0
      },
      received: {
        totalCount: 0,
        pageCount: 0
      }
    },
    filter: null,
    period: null,
    timestamp: {
      from: '',
      to: ''
    },
    transactions: [],
    records: {
      data: [],
      address: null,
      period: null,
    },
    marketService: null,
    showExportRecordsModal: false,
    showTransactionCountWarningModal: false
  }),

  async mounted () {
    this.setPeriod('year')

    if (!this.hasWallets || !this.hasMarketData) {
      return
    }

    this.marketService = new MarketService({
      token: this.profile.network.token,
      currency: this.profile.currency,
      epoch: this.profile.network.constants.epoch,
      peers: await this.fetchPeers()
    })

    this.address = this.addresses[0]
  },

  watch: {
    async address (address) {
      if (address === this.records.address) {
        return
      }

      if (this.marketService) {
        this.marketService.updateConfig({ address })
      }

      if (this.isInitialised) {
        this.isLoading = true

        this.walletData = await this.fetchWalletData()

        if (this.walletData.sent.totalCount + this.walletData.received.totalCount > 25000) {
          this.showTransactionCountWarningModal = true
        } else {
          try {
            await this.fetchTransactions()
            this.combineData()
          } catch {
            walletApi.alert.error('Failed to load transactions')
          }

          this.isLoading = false
        }
      }
    },

    async period (period) {
      if (period === this.records.period) {
        return
      }

      if (this.isInitialised) {
        this.isLoading = true

        this.walletData = await this.fetchWalletData()

        if (this.walletData.sent.totalCount + this.walletData.received.totalCount > 25000) {
          this.showTransactionCountWarningModal = true
        } else {
          try {
            await this.fetchTransactions()
            this.combineData()
          } catch {
            walletApi.alert.error('Failed to load transactions')
          }

          this.isLoading = false
        }
      }
    },

    async 'profile.currency' (currency) {
      if (this.marketService) {
        this.marketService.updateConfig({ currency })
      }

      if (this.isInitialised) {
        this.isLoading = true

        try {
          await this.fetchTransactions()
          this.combineData()
        } catch {
          walletApi.alert.error('Failed to load transactions')
        }

        this.isLoading = false
      }
    }
  },

  computed: {
    normalizedTimestamp () {
      const normalizeTimestamp = timestamp => {
        return Math.max(walletApi.utils.datetime(timestamp).unix() - walletApi.utils.datetime(this.profile.network.constants.epoch).unix(), 0)
      }

      return {
        from: normalizeTimestamp(`${this.timestamp.from} 00:00:00`),
        to: normalizeTimestamp(`${this.timestamp.to} 23:59:59`)
      }
    },

    filteredRecords () {
      return this.filter ? this.records.data.filter(record => {
        return record.crypto.startsWith('-') === (this.filter === 'outgoing')
      }) : this.records.data
    },

    logoImage () {
      return ImageService.image('logo')
    },

    noResultsImage () {
      const theme = walletApi.profiles.getCurrent().theme.isDark ? 'dark' : 'light'
      return ImageService.image(`no-results-${theme}`)
    },

    options () {
      return walletApi.storage.getOptions(true)
    },

    profile () {
      return walletApi.profiles.getCurrent()
    },

    addresses () {
      return this.profile.wallets.map(wallet => wallet.address)
    },

    periods () {
      return {
        month: 'This Month',
        quarter: 'This Quarter',
        year: 'This Year',
        lastYear: 'Last Year',
        all: 'All Time'
      }
    },

    hasWallets () {
      return this.profile.wallets && this.profile.wallets.length
    },

    hasMarketData () {
      return this.profile.network.market.enabled
    },

    totals () {
      return this.records.data.reduce((acc, { crypto, fiat }) => {
        if (crypto.startsWith('-')) {
          acc.outgoing = {
            fiat: acc.outgoing.fiat.minus(fiat),
            crypto: acc.outgoing.crypto.minus(crypto)
          }
        } else {
          acc.incoming = {
            fiat: acc.incoming.fiat.plus(fiat),
            crypto: acc.incoming.crypto.plus(crypto)
          }
        }
        return acc
      }, {
        incoming: {
          fiat: new walletApi.utils.bigNumber(0),
          crypto: new walletApi.utils.bigNumber(0)
        },
        outgoing: {
          fiat: new walletApi.utils.bigNumber(0),
          crypto: new walletApi.utils.bigNumber(0)
        }
      })
    }
  },

  methods: {
    async handleEvent ({ component, event, options }) {
      try {
        await this[`__handle${component}Event`](event, options)
      } catch (error) {
        console.log(`Missing event handler for component: ${component}`)
      }
    },

    __handleDisclaimerModalEvent (event) {
      if (event === 'cancel') {
        this.onCancelDisclaimer()
      } else if (event === 'confirm') {
        this.onConfirmDisclaimer()
      }
    },

    async __handleHeaderEvent (event, options) {
      switch (event) {
        case 'openExportModal': {
          this.openExportModal()
          break
        }

        case 'addressChange': {
          this.setAddress(options.address)
          break
        }

        case 'periodChange': {
          this.setPeriod(options.period)
          break
        }

        case 'reload': {
          this.isLoading = true

          try {
            await this.fetchTransactions()
            this.combineData()
          } catch {
            walletApi.alert.error('Failed to load transactions')
          }

          this.isLoading = false
          break
        }

        default: break
      }
    },

    __handleTransactionCountWarningModalEvent (event) {
      this.closeTransactionCountWarningModal()

      if (event === 'confirm') {
        this.onConfirmTransactionCountWarningModal()
      } else if (event === 'cancel') {
        this.isLoading = false

        if (this.isInitialised) {
          this.setAddress(this.records.address)
          this.setPeriod(this.records.period)
        }
      }
    },

    async __handleButtonLoaderEvent (event) {
      if (event === 'click') {
        this.isLoading = true

        try {
          this.walletData = await this.fetchWalletData()

          if (this.walletData.sent.totalCount + this.walletData.received.totalCount > 25000) {
            this.showTransactionCountWarningModal = true
          } else {
            try {
              await this.fetchTransactions()
              this.combineData()

              this.isInitialised = true
            } catch {
              walletApi.alert.error('Failed to load transactions')
            }
          }
        } catch {
          walletApi.alert.error('Failed to load wallet data')
        }

        this.isLoading = false
      }
    },

    __handleRecordStatsEvent (event, options) {
      if (event === 'filterChange') {
        this.filter = options.filter
      }
    },

    __handleRecordTableEvent (event, options) {
      if (event === 'currentPageChange') {
        this.currentPage = options.currentPage
      }
    },

    async __handleExportRecordsModalEvent (event, options) {
      this.closeExportRecordsModal()
      
      if (event === 'confirm') {
        this.setOption('exportOptions', options.exportOptions)

        try {
          const filePath = await this.export()

          if (filePath) {
            walletApi.alert.success(`Your transactions were successfully exported to: ${filePath}`)
          }
        } catch (error) {
          walletApi.alert.error(error)
        }
      }
    },

    async fetchWalletData () {
      let query, response, body

      const peer = (await walletApi.peers.all.withVersion('3.0.0').findPeersWithoutEstimates())[0]

      const counts = {}

      const baseParams = {
        'timestamp.from': this.normalizedTimestamp.from,
        'timestamp.to': this.normalizedTimestamp.to,
        limit: 1
      }

      for (const param of [undefined, 'senderId', 'recipientId']) {
        if (!param) {
          query = {
            address: this.address,
            ...baseParams
          }
        } else {
          query = {
            [param]: this.address,
            ...baseParams
          }
        }

        response = await walletApi.http.get(`http://${peer.ip}:${peer.port}/api/transactions`, {
          headers: {
            'Content-Type': 'application/json',
          },
          query
        })

        body = JSON.parse(response.body)

        counts[!param ? 'total' : param === 'senderId' ? 'sent' : 'received'] = {
          totalCount: body.meta.totalCount,
          pageCount: Math.ceil(body.meta.totalCount / 100)
        }
      }

      return counts
    },

    setOption (key, value) {
      walletApi.storage.set(key, value, true)
    },

    getOption (key) {
      return walletApi.storage.get(key, true)
    },

    setAddress (address) {
      this.address = address
    },

    setPeriod (period) {
      this.period = period

      if (['month', 'quarter', 'year'].includes(period)) {
        this.timestamp = {
          from: walletApi.utils.datetime().startOf(period).format('YYYY-MM-DD'),
          to: walletApi.utils.datetime(Date.now()).format('YYYY-MM-DD')
        }
      }

      if (period === 'lastYear') {
        this.timestamp = {
          from: walletApi.utils.datetime().startOf('year').subtract(1, 'years').format('YYYY-MM-DD'),
          to: walletApi.utils.datetime().endOf('year').subtract(1, 'year').format('YYYY-MM-DD')
        }
      }

      if (period === 'all') {
        this.timestamp = {
          from: walletApi.utils.datetime(this.profile.network.constants.epoch).format('YYYY-MM-DD'),
          to: walletApi.utils.datetime(Date.now()).format('YYYY-MM-DD')
        }
      }
    },

    goTo (route) {
      walletApi.route.goTo(route)
    },

    // DisclaimerModal

    onCancelDisclaimer () {
      this.goTo('dashboard')
    },

    onConfirmDisclaimer () {
      this.setOption('hasAcceptedDisclaimer', true)
    },

    // TransactionCountWarningModal

    closeTransactionCountWarningModal () {
      this.showTransactionCountWarningModal = false
    },

    async onConfirmTransactionCountWarningModal () {
      try {
        await this.fetchTransactions()
        this.combineData()
      } catch {
        walletApi.alert.error('Failed to load transactions')
      }

      this.isLoading = false
    },

    // ExportRecordsModal

    openExportModal () {
      this.showExportRecordsModal = true
    },

    closeExportRecordsModal () {
      this.showExportRecordsModal = false
    },

    async export () {
      const options = this.getOption('exportOptions')

      const activeColumns = Object.entries(options.columns).reduce((columns, column) => {
        if (column[1]) {
          columns.push(column[0])
        }
        return columns
      }, [])

      let rows = []

      if (options.includeHeaders) {
        const labels = {
          date: 'Date',
          crypto: `Crypto Amount (${this.profile.network.token})`,
          fiat: `Fiat Amount (${this.profile.currency})`,
          id: 'Transaction ID'
        }

        const headers = []

        for (const column of activeColumns) {
          headers.push(labels[column])
        }

        rows.push(headers.join(options.delimiter))
      }

      for (const record of this.filteredRecords) {
        const values = []

        for (const column of Object.keys(options.columns)) {
          if (activeColumns.includes(column)) {
            values.push(record[column])
          }
        }

        rows.push(values.join(options.delimiter))
      }

      rows = rows.join('\n')

      return walletApi.dialogs.save(rows, `export_${this.address}.csv`, 'csv')
    },

    async fetchPeers () {
      const peers = await walletApi.peers.all.findPeersWithPlugin('core-api')

      const filteredPeers = []

      const responses = await Promise.all(
        peers.map(peer =>
          walletApi.http.get(`http://${peer.ip}:${peer.port}/api/node/configuration`, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
        )
      )

      for (const [index, response] of responses.entries()) {
        if (JSON.parse(response.body).data.core.version.startsWith('3')) {
          filteredPeers.push(peers[index])
        }
      }

      return filteredPeers
    },

    async fetchTransactions () {
      this.transactions = await this.marketService.fetchTransactions(this.walletData.total.pageCount, this.normalizedTimestamp)
    },

    async combineData () {
      this.records = {
        data: [],
        address: this.address,
        period: this.period
      }

      this.records.data = this.records.data.concat(this.marketService.combinePricesWithTransactions(this.transactions))
    }
  }
}
