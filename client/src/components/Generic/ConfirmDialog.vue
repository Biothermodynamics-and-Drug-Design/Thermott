<template>
  <v-dialog v-model="state" :width="options.width" persistent>
    <v-card>
      <v-card-title v-if="options.title" class="text-subtitle-1 grey lighten-3">
        <span v-html="options.title" />
      </v-card-title>
      <v-card-text v-if="options.text" class="text-subtitle-1 black--text pa-2 pt-4 text-center">
        <span v-html="options.text" />
      </v-card-text>
      <v-divider class="my-1" />
      <v-card-actions class="d-flex flex-row-reverse align-center pa-1 px-2">
        <v-btn
          v-for="(input, index) in options.inputs"
          :key="index"
          text
          class="mx-1"
          :color="input.color"
          :disabled="input.disabled"
          @click="clickInput(input.value)"
          v-text="input.text"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from "@vue/composition-api";
import { dialogModel, closeDialog } from "./confirmdialog";

export default defineComponent({
  setup() {
    const state = computed({
      get: () => dialogModel.state,
      set: (value: boolean) => (dialogModel.state = value),
    });
    const options = computed(() => dialogModel.options);

    const clickInput = (value: string | number | boolean) => {
      dialogModel.resolve(value);
      closeDialog();
    };

    return {
      state,
      options,
      clickInput,
    };
  },
});
</script>
