const MarketService = require('../services/market.service.js')
const ImageService = require('../services/image.service.js')

const ButtonLoader = require('../components/ButtonLoader')
const CurrencyChangeModal = require('../components/modals/CurrencyChangeModal')
const EstimateWarningModal = require('../components/modals/EstimateWarningModal')
const Header = require('../components/Header')
const RecordStats = require('../components/RecordStats')
const RecordTable = require('../components/RecordTable')

const utils = require('../utils')

module.exports = {
  template: `
    <div
      class="flex flex-col flex-1 overflow-y-auto"
    >
      <div
        v-if="!isInitialised"
        class="flex flex-col flex-1 justify-center items-center rounded-lg bg-theme-feature"
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
            :disabled="isLoading || !address"
            :is-loading="isLoading"
            :state="state"
            label="Load transactions"
          />
        </div>
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
          :state="state"
        />

        <div class="flex flex-col flex-1 p-10 rounded-lg bg-theme-feature overflow-y-auto">
          <div class="flex flex-1">
            <div
              v-if="isLoading"
              class="m-auto"
            >
              <Loader />
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
              />

              <RecordTable
                :rows="records"
                :current-page="currentPage"
                :per-page="perPage"
                :state="state"
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

          <div class="mb-2">
            {{ JSON.stringify(state) }}
          </div>
        </div>
      </div>

      <ModalConfirmation
        v-if="!options.hasAcceptedDisclaimer"
        container-classes="max-w-md"
        title="Disclaimer"
        note="The information presented by this plugin has been prepared for informational purposes only, and is not intended to provide, and should not be relied on for, tax, legal or accounting advice."
        cancel-button="Cancel"
        continue-button="I understand"
        @cancel="onCancelDisclaimer"
        @close="onCancelDisclaimer"
        @continue="onAcceptDisclaimer"
      />

      <CurrencyChangeModal
        v-if="showCurrencyChangeModal"
        :state="state"
      />

      <EstimateWarningModal
        v-if="showEstimateWarningModal"
        :state="state"
      />
    </div>
  `,

  components: {
    ButtonLoader,
    CurrencyChangeModal,
    EstimateWarningModal,
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
    prices: [],
    transactions: [],
    records: [],
    marketService: null,
    showCurrencyChangeModal: false,
    showEstimateWarningModal: false,
    showExportRecordsModal: false,
    state: {
      header: {},
      currencyChangeModal: {},
      estimateWarningModal: {},
      buttonLoader: {},
      recordTable: {}
    }
  }),

  mounted () {
    // walletApi.storage.delete(true)

    if (this.hasWallets && this.hasMarketData) {
      this.address = this.addresses[0]

      this.marketService = new MarketService({
        address: this.address,
        token: this.profile.network.token,
        currency: this.profile.currency,
        epoch: this.profile.network.constants.epoch
      })
    }
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

    async 'state.header' ({ action, value }) {
      if (!action) {
        return
      }

      if (action === 'openExportModal') {
        this.openExportModal()
      } else if (action === 'addressChange') {
        this.setAddress(value)
      } else if (action === 'reload') {
        await this.prepareData()
      }

      this.state.header = {}
    },

    'state.estimateWarningModal' ({ action, options }) {
      if (!action) {
        return
      }

      this.closeEstimateWarningModal()

      if (action === 'confirm') {
        this.onConfirmEstimateWarningModal(options)
      }

      this.state.estimateWarningModal = {}
    },

    async 'state.currencyChangeModal' ({ action, options }) {
      if (!action) {
        return
      }

      this.closeCurrencyChangeModal()

      if (action === 'cancel') {
        this.onCancelCurrencyChangeModal(options)
      } else if (action === 'confirm') {
        await this.onConfirmCurrencyChangeModal(options)
      }

      this.state.currencyChangeModal = {}
    },

    async 'state.buttonLoader' ({ action }) {
      if (!action) {
        return
      }

      if (action === 'click') {
        await this.prepareData()
      }

      this.state.buttonLoader = {}
    },

    'state.recordTable' ({ action, value }) {
      if (!action) {
        return
      }

      if (action === 'currentPageChange') {
        this.currentPage = value
      }

      this.state.recordTable = {}
    },

    async 'profile.currency' (currency) {
      this.marketService.updateConfig({ currency })

      if (this.isInitialised) {
        if (this.options.reloadOnCurrencyChange === undefined) {
          this.showCurrencyChangeModal = true
        }

        if (this.options.reloadOnCurrencyChange) {
          try {
            this.isLoading = true
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

    period () {
      return this.records.length ? {
        start: this.records[this.records.length - 1].date,
        end: this.records[0].date
      } : {}
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
    setAddress (address) {
      this.address = address
    },

    goTo (route) {
      walletApi.route.goTo(route)
    },

    onDropdownSelect (address) {
      this.setAddress(address)
    },

    onCancelDisclaimer () {
      this.goTo('dashboard')
    },

    onAcceptDisclaimer () {
      walletApi.storage.set('hasAcceptedDisclaimer', true, true)
    },

    // EstimateWarningModal

    closeEstimateWarningModal () {
      this.showEstimateWarningModal = false
    },

    onConfirmEstimateWarningModal ({ rememberChoice }) {
      if (rememberChoice) {
        walletApi.storage.set('noEstimateWarning', true, true)
      }
    },

    // CurrencyChangeModal

    closeCurrencyChangeModal () {
      this.showCurrencyChangeModal = false
    },

    onCancelCurrencyChangeModal ({ rememberChoice }) {
      if (rememberChoice) {
        walletApi.storage.set('reloadOnCurrencyChange', false, true)
      }
    },

    async onConfirmCurrencyChangeModal ({ rememberChoice }) {
      if (rememberChoice) {
        walletApi.storage.set('reloadOnCurrencyChange', true, true)
      }

      this.isLoading = true
      await this.combineData(true)
      this.isLoading = false
    },

    async openExportModal () {
      this.showExportRecordsModal = true
      await this.export()
    },

    async export () {
      try {
        const filePath = await walletApi.dialogs.save('abc def', `export_${this.address}.csv`, 'csv')

        if (filePath) {
          walletApi.alert.success(`Your wallets were successfully exported to: ${filePath}`)
        }
      } catch (error) {
        walletApi.alert.error(error)
      }
    },

    async prepareData () {
      try {
        this.isLoading = true

        await this.fetchPrices()
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

    async fetchPrices () {
      this.prices = await this.marketService.fetchClosingPrices()
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
        await this.fetchPrices()
      }

      this.records = this.marketService.combinePricesWithTransactions(this.prices, this.transactions)
    }
  }
}
