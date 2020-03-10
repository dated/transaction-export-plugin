module.exports = {
  template: `
    <ModalConfirmation
      container-classes="max-w-md"
      title="The currency was changed"
      note="You have changed the currency setting of the Desktop Wallet. Do you want to reload the transaction data now?"
      cancel-button="No"
      continue-button="Yes, reload"
      @cancel="emitCancel"
      @close="emitCancel"
      @continue="emitConfirm"
    >
      <div class="flex flex-col -mt-12">
        <ListDivided>
          <ListDividedItem label="Don't ask again">
            <ButtonSwitch
              :is-active="rememberChoice"
              class="ml-3"
              @change="toggleRememberChoice"
            />
          </ListDividedItem>
        </ListDivided>
      </div>
    </ModalConfirmation>
  `,

  props: {
    callback: {
      type: Function,
      required: true
    }
  },

  data: () => ({
    rememberChoice: false
  }),

  methods: {
    executeCallback (event, options) {
      this.callback({
        component: 'CurrencyChangeModal',
        event,
        options
      })
    },

    emitCancel () {
      this.executeCallback('cancel')
    },

    emitConfirm () {
      this.executeCallback('confirm', { rememberChoice: this.rememberChoice })
    },

    toggleRememberChoice () {
      this.rememberChoice = !this.rememberChoice
    }
  }
}
