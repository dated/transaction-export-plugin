module.exports = {
  template: `
    <ModalConfirmation
      container-classes="max-w-md"
      title="Disclaimer"
      note="The information presented by this plugin has been prepared for informational purposes only, and is not intended to provide, and should not be relied on for tax, legal or accounting advice."
      cancel-button="Cancel"
      continue-button="I understand"
      @cancel="emitCancel"
      @close="emitCancel"
      @continue="emitConfirm"
    />
  `,

  props: {
    callback: {
      type: Function,
      required: true
    }
  },

  methods: {
    executeCallback (event) {
      this.callback({
        component: 'DisclaimerModal',
        event
      })
    },

    emitCancel () {
      this.executeCallback('cancel')
    },

    emitConfirm () {
      this.executeCallback('confirm')
    }
  }
}
