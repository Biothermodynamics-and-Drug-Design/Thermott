<template>
  <v-col class="pa-0">
    <v-snackbar
      v-for="(snackbar, index) in snackbars"
      :key="index"
      v-model="snackbar.state"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      multi-line
      top
      right
      :style="{ 'margin-top': `${index * 80}px` }"
    >
      <div v-for="(text, index2) in splitText(snackbar.text)" :key="index2">
        {{ text }}
      </div>

      <template #action="{ attrs }">
        <v-icon color="black" text small v-bind="attrs" @click="snackbar.state = false"> mdi-close </v-icon>
      </template>
    </v-snackbar>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, computed } from "@vue/composition-api";
import { toast } from "./GlobalSnackbarStore";

export default defineComponent({
  setup() {
    const snackbars = computed(() => toast.snackbars);
    const splitText = (text: string) => {
      if (typeof text === "string") return text.split("\n");
      else return ["Error"];
    };
    return { snackbars, splitText };
  },
});
</script>
