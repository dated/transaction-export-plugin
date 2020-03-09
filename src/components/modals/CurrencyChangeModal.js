module.exports = {
  template: `
    <ModalConfirmation
      container-classes="max-w-md"
      title="The currency was changed"
      note="You have changed the currency setting of the Desktop Wallet. Do you want to reload the transaction data now?"
      cancel-button="Cancel"
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
    state: {
      type: Object,
      required: true
    }
  },

  data: () => ({
    rememberChoice: false
  }),

  methods: {
    mutateState (action, rememberChoice) {
      this.state.currencyChangeModal = {
        action,
        options: {
          rememberChoice
        }
      }
    },

    emitConfirm () {
      this.mutateState('cancel')
    },

    emitConfirm () {
      this.mutateState('confirm', this.rememberChoice)
    },

    toggleRememberChoice () {
      this.rememberChoice = !this.rememberChoice
    }
  }
}
