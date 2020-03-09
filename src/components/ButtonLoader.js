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
    eventQueue: {
      type: Array,
      required: true
    }
  },

  methods: {
    pushEvent (event) {
      this.eventQueue.push({
        component: 'ButtonLoader',
        event
      })
    },

    emitClick () {
      this.pushEvent('click')
    }
  }
}
