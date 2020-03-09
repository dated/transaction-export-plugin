module.exports = {
  template: `
    <ModalConfirmation
      container-classes="max-w-md"
      title="Estimate Warning"
      note="The peer you are connected to is using estimates and transactions may be missing from the results. We recommend you change to a different peer."
      :show-cancel-button="false"
      continue-button="Dismiss"
      @close="emitCancel"
      @continue="emitConfirm"
    >
      <div class="flex flex-col -mt-12">
        <ListDivided>
          <ListDividedItem label="Don't warn me again">
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
      this.state.estimateWarningModal = {
        action,
        options: {
          rememberChoice
        }
      }
    },

    emitCancel () {
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
