const utils = require('../utils')

module.exports = {
  template: `
    <div class="flex">
      <div
        class="flex flex-1 p-6 border border-theme-line-separator hover:border-theme-feature hover:shadow-lg rounded-lg transition cursor-pointer"
        @click="emitFilterChanged(null)"
      >
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

      <div
        class="flex flex-1 p-6 border border-theme-line-separator hover:border-theme-feature hover:shadow-lg rounded-lg transition mx-6 cursor-pointer"
        :class="filter === 'incoming' ? 'border-theme-button-special-choice': 'border-theme-line-separator'"
        :style="{ 'transform': filter === 'incoming' ? 'scale(1.05)' : '' }"
        @click="emitFilterChanged('incoming')"
      >
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

      <div
        class="flex flex-1 p-6 border hover:border-theme-feature hover:shadow-lg rounded-lg transition cursor-pointer"
        :class="filter === 'outgoing' ? 'border-theme-button-special-choice': 'border-theme-line-separator'"
        :style="{ 'transform': filter === 'outgoing' ? 'scale(1.05)' : '' }"
        @click="emitFilterChanged('outgoing')"
      >
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
    },
    filter: {
      required: true,
      validator: value => typeof value === 'string' || value === null
    },
    callback: {
      type: Function,
      required: true
    }
  },

  computed: {
    profile () {
      return walletApi.profiles.getCurrent()
    }
  },

  methods: {
    executeCallback (event, options) {
      this.callback({
        component: 'RecordStats',
        event,
        options
      })
    },

    emitFilterChanged (filter) {
      this.executeCallback('filterChange', { filter: this.filter === filter ? null : filter })
    },

    formatNumber (value) {
      return utils.formatter_number(value, this.profile.language)
    },

    formatCurrency (value, currency) {
      return utils.formatter_currency(value, currency, this.profile.language)
    }
  }
}
