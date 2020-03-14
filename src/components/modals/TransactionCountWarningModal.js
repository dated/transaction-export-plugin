const utils = require('../../utils')

module.exports = {
  template: `
    <ModalConfirmation
      container-classes="max-w-md"
      title="Transaction Count Warning"
      :note="getNote()"
      cancel-button="No, cancel"
      continue-button="Yes, continue"
      @cancel="emitCancel"
      @close="emitCancel"
      @continue="emitConfirm"
    />
  `,

  props: {
    count: {
      type: Number,
      required: true
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
    getNote () {
      return `Your are about to request and process ${this.formatNumber(this.count)} transactions. This process will potentially take several minutes. Are you sure you want to continue?`
    },

    executeCallback (event) {
      this.callback({
        component: 'TransactionCountWarningModal',
        event
      })
    },

    emitCancel () {
      this.executeCallback('cancel')
    },

    emitConfirm () {
      this.executeCallback('confirm')
    },

    formatNumber (value) {
      return utils.formatter_number(value, this.profile.language)
    }
  }
}
