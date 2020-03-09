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
        component: 'EstimateWarningModal',
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
