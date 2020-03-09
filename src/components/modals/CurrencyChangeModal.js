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
    eventQueue: {
      type: Array,
      required: true
    }
  },

  data: () => ({
    rememberChoice: false
  }),

  methods: {
    pushEvent (event, options) {
      this.eventQueue.push({
        component: 'CurrencyChangeModal',
        event,
        options
      })
    },

    emitCancel () {
      this.pushEvent('cancel')
    },

    emitConfirm () {
      this.pushEvent('confirm', { rememberChoice: this.rememberChoice })
    },

    toggleRememberChoice () {
      this.rememberChoice = !this.rememberChoice
    }
  }
}
