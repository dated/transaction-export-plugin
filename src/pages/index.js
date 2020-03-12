const MarketService = require('../services/market.service.js')
const ImageService = require('../services/image.service.js')

const Header = require('../components/Header')
const ButtonLoader = require('../components/ButtonLoader')
const RecordStats = require('../components/RecordStats')
const RecordTable = require('../components/RecordTable')

const CurrencyChangeModal = require('../components/modals/CurrencyChangeModal')
const DisclaimerModal = require('../components/modals/DisclaimerModal')
const EstimateWarningModal = require('../components/modals/EstimateWarningModal')
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
          <p class="mb-5">
            Select an address below to get started.
          </p>

          <MenuDropdown
            class="mb-10"
            ref="address"
            :disabled="isLoading"
            :items="addresses"
            :value="addresses[0]"
            :pin-to-input-width="true"
            @select="onDropdownSelect"
          />

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
          :has-records="records.length"
          :period="period"
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
              v-else-if="!records.length"
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
                :count="records.length"
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

      <CurrencyChangeModal
        v-if="showCurrencyChangeModal"
        :callback="handleEvent"
      />

      <EstimateWarningModal
        v-if="showEstimateWarningModal"
        :callback="handleEvent"
      />

      <ExportRecordsModal
        v-if="showExportRecordsModal"
        :count="filteredRecords.length"
        :callback="handleEvent"
      />
    </div>
  `,

  components: {
    ButtonLoader,
    CurrencyChangeModal,
    DisclaimerModal,
    EstimateWarningModal,
    ExportRecordsModal,
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
    transactions: [],
    filter: null,
    period: {},
    records: [],
    marketService: null,
    showCurrencyChangeModal: false,
    showEstimateWarningModal: false,
    showExportRecordsModal: false
  }),

  mounted () {
    if (!this.hasWallets || !this.hasMarketData) {
      return
    }

    this.address = this.addresses[0]

    this.marketService = new MarketService({
      address: this.address,
      token: this.profile.network.token,
      currency: this.profile.currency,
      epoch: this.profile.network.constants.epoch
    })
  },

  watch: {
    async address (address) {
      this.marketService.updateConfig({ address })

      if (this.isInitialised) {
        try {
          this.isLoading = true
          await this.fetchTransactions()
          this.combineData()
        } catch (error) {
          console.log(error)
          this.records = []
        } finally {
          this.isLoading = false
        }
      }
    },

    async 'profile.currency' (currency) {
      this.marketService.updateConfig({ currency })

      if (this.isInitialised) {
        if (this.options.reloadOnCurrencyChange === undefined) {
          this.showCurrencyChangeModal = true
        }

        if (this.options.reloadOnCurrencyChange) {
          this.isLoading = true

          try {
            await this.combineData(true)
          } catch (error) {
            console.log(error)
            this.records = []
          } finally {
            this.isLoading = false
          }
        }
      }
    }
  },

  computed: {
    filteredRecords () {
      const records = this.filter ? this.records.filter(record => {
        return record.crypto.startsWith('-') === (this.filter === 'outgoing')
      }) : this.records

      this.period = records.length ? {
        start: records[records.length - 1].date,
        end: records[0].date
      } : {}

      return records
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

    hasWallets () {
      return this.profile.wallets && this.profile.wallets.length
    },

    hasMarketData () {
      return this.profile.network.market.enabled
    },

    totals () {
      return this.records.reduce((acc, { crypto, fiat }) => {
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

    async __handleCurrencyChangeModalEvent (event, options) {
      this.closeCurrencyChangeModal()

      if (event === 'cancel') {
        this.onCancelCurrencyChangeModal(options)
      } else if (event === 'confirm') {
        await this.onConfirmCurrencyChangeModal(options)
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
        case 'reload': {
          await this.prepareData()
          break
        }
        default: break
      }
    },

    __handleEstimateWarningModalEvent (event, options) {
      this.closeEstimateWarningModal()

      if (event === 'confirm') {
        this.onConfirmEstimateWarningModal(options.rememberChoice)
      }
    },

    async __handleButtonLoaderEvent (event) {
      if (event === 'click') {
        await this.prepareData()
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

    setOption (key, value) {
      walletApi.storage.set(key, value, true)
    },

    getOption (key) {
      return walletApi.storage.get(key, true)
    },

    setAddress (address) {
      this.address = address
    },

    goTo (route) {
      walletApi.route.goTo(route)
    },

    onDropdownSelect (address) {
      this.setAddress(address)
    },

    // DisclaimerModal

    onCancelDisclaimer () {
      this.goTo('dashboard')
    },

    onConfirmDisclaimer () {
      this.setOption('hasAcceptedDisclaimer', true)
    },

    // EstimateWarningModal

    closeEstimateWarningModal () {
      this.showEstimateWarningModal = false
    },

    onConfirmEstimateWarningModal (rememberChoice) {
      if (rememberChoice) {
        this.setOption('noEstimateWarning', true)
      }
    },

    // CurrencyChangeModal

    closeCurrencyChangeModal () {
      this.showCurrencyChangeModal = false
    },

    onCancelCurrencyChangeModal ({ rememberChoice }) {
      if (rememberChoice) {
        this.setOption('reloadOnCurrencyChange', false)
      }
    },

    async onConfirmCurrencyChangeModal ({ rememberChoice }) {
      if (rememberChoice) {
        this.setOption('reloadOnCurrencyChange', true)
      }

      this.isLoading = true
      await this.combineData(true)
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

    async prepareData () {
      try {
        this.isLoading = true

        await this.marketService.fetchClosingPrices()
        await this.fetchTransactions()

        this.combineData()
      } catch (error) {
        console.log(error)
        this.records = []
      } finally {
        this.isLoading = false
        this.isInitialised = true
      }
    },

    async fetchTransactions () {
      const { isEstimate, transactions } = await this.marketService.fetchTransactions()

      if (isEstimate && !this.options.noEstimateWarning) {
        this.showEstimateWarningModal = true
      }

      this.transactions = transactions
    },

    async combineData (refetchPrices = false) {
      if (refetchPrices) {
        await this.marketService.fetchClosingPrices()
      }

      this.records = this.marketService.combinePricesWithTransactions(this.prices, this.transactions)
    }
  }
}
