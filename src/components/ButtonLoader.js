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
    state: {
      type: Object,
      required: true
    }
  },

  methods: {
    mutateState (action) {
      this.state.buttonLoader = {
        action
      }
    },

    emitClick () {
      this.mutateState('click')
    }
  }
}
