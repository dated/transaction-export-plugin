module.exports = {
  template: `
    <ModalWindow
      title="Export Transactions"
      container-classes="w-md max-w-md"
      @close="emitCancel"
    >
      <section class="flex flex-col">
        <ListDivided>
          <ListDividedItem label="Include header row">
            <ButtonSwitch
              ref="option"
              :is-active="options.includeHeaders"
              class="ml-3"
              @change="toggleOption('includeHeaders', false)"
            />
          </ListDividedItem>

          <ListDividedItem label="Delimiter">
            <MenuDropdown
              ref="delimiter"
              :items="delimiters"
              :value="options.delimiter"
              @select="onDropdownSelect"
            />
          </ListDividedItem>
        </ListDivided>

        <h4 class="mt-5">
          Columns
        </h4>

        <ListDivided v-if="options.columns">
          <ListDividedItem
            v-for="column in Object.keys(options.columns)"
            :key="column"
            :label="getLabel(column)"
          >
            <ButtonSwitch
              ref="column"
              :is-active="options.columns[column]"
              class="ml-3"
              @change="toggleOption(column)"
            />
          </ListDividedItem>
        </ListDivided>

        <div class="flex mt-5">
          <ButtonGeneric
            label="Cancel"
            class="mr-5"
            @click="emitCancel"
          />

          <ButtonGeneric
            :disabled="!hasColumns"
            label="Export"
            @click="emitConfirm"
          />
        </div>
      </section>
    </ModalWindow>
  `,

  data: () => ({
    delimiters: {
      ',': 'Comma',
      ':': 'Colon',
      '\t': 'Tab'
    },
    options: {}
  }),

  props: {
    callback: {
      type: Function,
      required: true
    }
  },

  mounted () {
    this.options = JSON.parse(JSON.stringify(this.exportOptions))
  },

  computed: {
    exportOptions () {
      return walletApi.storage.get('exportOptions', true) || {
        delimiter: ',',
        includeHeaders: true,
        columns: {
          date: true,
          crypto: true,
          fiat: true,
          id: true
        }
      }
    },

    hasColumns () {
      return this.options.columns ? Object.values(this.options.columns).some(column => !!column) : false
    }
  },

  methods: {
    getLabel (column) {
      const labels = {
        date: 'Date',
        crypto: 'Crypto Amount',
        fiat: 'Fiat Amount',
        id: 'Transaction ID'
      }
      return labels[column]
    },

    toggleOption (option, isColumn = true) {
      const options = isColumn ? this.options.columns : this.options

      if (Object.prototype.hasOwnProperty.call(options, option)) {
        options[option] = !options[option]
      }
    },

    executeCallback (event, options) {
      this.callback({
        component: 'ExportRecordsModal',
        event,
        options
      })
    },

    emitCancel () {
      this.executeCallback('cancel')
    },

    emitConfirm () {
      this.executeCallback('confirm', { exportOptions: this.options })
    },

    onDropdownSelect (delimiter) {
      this.options.delimiter = delimiter
    }
  }
}
