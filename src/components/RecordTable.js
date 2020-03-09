module.exports = {
  template: `
    <TableWrapper
      class="w-full"
      :rows="rows"
      :columns="columns"
      :has-pagination="true"
      :current-page="currentPage"
      :per-page="perPage"
      @on-per-page-change="emitPerPageChange"
      @on-page-change="emitCurrentPageChange"
    >
      <template
        slot-scope="data"
      >
        <span v-if="data.column.field === 'icon'">
          <span
            :class="
              data.row.crypto.startsWith('-')
                ? 'text-theme-transaction-sent-arrow border-2 border-theme-transaction-sent'
                : 'text-theme-transaction-received-arrow border-2 border-theme-transaction-received'
            "
            class="rounded-full h-6 w-6 flex items-center justify-center"
          >
            <SvgIcon
              :name="data.row.crypto.startsWith('-') ? 'arrow-sent' : 'arrow-received'"
              class="text-center"
              view-box="0 0 8 8"
            />
          </span>
        </span>

        <span
          v-if="data.column.field === 'crypto'"
          class="flex items-center justify-between"
          :class="
            data.row.crypto.startsWith('-')
              ? 'text-red'
              : 'text-green'
            "
        >
          <span
            :class="
              data.row.crypto.startsWith('-')
                ? 'text-theme-transaction-sent-arrow border-2 border-theme-transaction-sent'
                : 'text-theme-transaction-received-arrow border-2 border-theme-transaction-received'
            "
            class="rounded-full h-6 w-6 flex items-center justify-center mr-4"
          >
            <SvgIcon
              :name="data.row.crypto.startsWith('-') ? 'arrow-sent' : 'arrow-received'"
              class="text-center"
              view-box="0 0 8 8"
            />
          </span>

          {{ data.row.crypto }}
        </span>

        <span
          v-else-if="data.column.field === 'fiat'"
          :class="
            data.row.fiat.startsWith('-')
              ? 'text-red'
              : 'text-green'
            "
        >
          {{ data.row.fiat }}
        </span>

        <span
          v-else-if="data.column.field === 'id'"
          class="flex items-center"
        >
          {{ data.row.id }}
          <a
            v-if="false"
            v-tooltip="{
              content: 'Open in Explorer',
              trigger: 'hover'
            }"
            target="_blank"
            class="flex items-center ml-2"
            :href="[profile.network.explorer, 'transaction', data.row.id].join('/')"
          >
            <SvgIcon
              name="open-external"
              view-box="0 0 12 12"
            />
          </a>
        </span>

        <span v-else>
          {{ data.formattedRow[data.column.field] }}
        </span>
      </template>
    </TableWrapper>
  `,

  props: {
    rows: {
      type: Array,
      required: true
    },
    currentPage: {
      type: Number,
      required: true
    },
    perPage: {
      type: Number,
      required: true
    },
    state: {
      type: Object,
      required: true
    }
  },

  computed: {
    columns () {
      return [
        {
          label: `${this.profile.network.token} Amount`,
          field: 'crypto',
          sortable: false,
          type: 'number',
          thClass: 'whitespace-no-wrap'
        },
        {
          label: `${this.profile.currency} Amount`,
          field: 'fiat',
          sortable: false,
          type: 'number',
          thClass: 'whitespace-no-wrap'
        },
        {
          label: 'Date',
          field: 'date',
          sortable: false,
          tdClass: 'whitespace-no-wrap'
        },
        {
          label: 'ID',
          sortable: false,
          field: 'id'
        }
      ]
    },

    profile () {
      return walletApi.profiles.getCurrent()
    }
  },

  methods: {
    mutateState (action, value) {
      this.state.recordTable = {
        action,
        value
      }
    },

    emitCurrentPageChange ({ currentPage }) {
      this.mutateState('currentPageChange', currentPage)
    },

    emitPerPageChange ({ currentPerPage }) {
      this.mutateState('perPageChange', currentPerPage)
    }
  }
}
