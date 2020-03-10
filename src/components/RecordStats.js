const utils = require('../utils')

module.exports = {
  template: `
    <div class="flex">
      <div class="flex flex-1 p-6 border border-theme-line-separator hover:border-theme-feature hover:shadow-lg rounded-lg transition">
        <span class="text-theme-button-text border-2 border-theme-button rounded-full h-10 w-10 mr-3 flex items-center justify-center">
          <SvgIcon
            name="arrow-sent-received"
            class="text-center"
            view-box="0 0 17 10"
          />
        </span>
        <div class="flex flex-col justify-between">
          <span class="text-theme-page-text-light font-semibold text-sm pl-1">
            Transactions
          </span>

          <span class="font-bold px-1">
            {{ formatNumber(count) }}
          </span>
        </div>
      </div>

      <div class="flex flex-1 p-6 border border-theme-line-separator hover:border-theme-feature hover:shadow-lg rounded-lg transition mx-6">
        <span class="text-theme-transaction-received-arrow border-2 border-theme-transaction-received rounded-full h-10 w-10 mr-3 flex items-center justify-center">
          <SvgIcon
            name="arrow-received"
            class="text-center"
            view-box="0 0 10 10"
          />
        </span>
        <div class="flex flex-col justify-between">
          <span class="text-theme-page-text-light font-semibold text-sm pl-1">
            Income
          </span>

          <span
            v-tooltip="{
              content: formatCurrency(totals.incoming.crypto, profile.network.token),
              placement: 'right'
            }"
            class="font-bold px-1"
          >
            {{ formatCurrency(totals.incoming.fiat, profile.currency) }}
          </span>
        </div>
      </div>

      <div class="flex flex-1 p-6 border border-theme-line-separator hover:border-theme-feature hover:shadow-lg rounded-lg transition">
        <span class="text-theme-transaction-sent-arrow border-2 border-theme-transaction-sent rounded-full h-10 w-10 mr-3 flex items-center justify-center">
          <SvgIcon
            name="arrow-sent"
            class="text-center"
            view-box="0 0 10 10"
          />
        </span>
        <div class="flex flex-col justify-between">
          <span class="text-theme-page-text-light font-semibold text-sm pl-1">
            Expense
          </span>

          <span
            v-tooltip="{
              content: formatCurrency(totals.outgoing.crypto, profile.network.token),
              placement: 'right'
            }"
            class="font-bold px-1"
          >
            {{ formatCurrency(totals.outgoing.fiat, profile.currency) }}
          </span>
        </div>
      </div>
    </div>
  `,

  props: {
    totals: {
      type: Object,
      required: true
    },
    count: {
      type: Number,
      required: true
    }
  },

  computed: {
    profile () {
      return walletApi.profiles.getCurrent()
    }
  },

  methods: {
    formatNumber (value) {
      return utils.formatNumber(value, this.profile.language)
    },

    formatCurrency (value, currency) {
      return utils.formatCurrency(value, currency, this.profile.language)
    }
  }
}
