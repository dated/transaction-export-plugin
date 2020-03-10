module.exports = {
  template: `
    <button
      class="blue-button"
      @click="emitClick"
    >
      <span
        v-if="!isLoading"
        class="font-semibold whitespace-no-wrap"
      >
        {{ label }}
      </span>

      <div
        v-else
        class="flex"
        style="font-size: 0;"
      >
        <Loader />
      </div>
    </button>
  `,

  props: {
    label: {
      type: String,
      required: true
    },
    isLoading: {
      type: Boolean,
      required: true
    },
    callback: {
      type: Function,
      required: true
    }
  },

  methods: {
    executeCallback (event) {
      this.callback({
        component: 'ButtonLoader',
        event
      })
    },

    emitClick () {
      this.executeCallback('click')
    }
  }
}
