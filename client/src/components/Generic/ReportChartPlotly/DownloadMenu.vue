<template>
  <v-menu right offset-y>
    <template #activator="{ on }">
      <v-btn text class="mx-2" small v-on="on">
        <v-icon class="mr-2" size="large">mdi-download</v-icon>
        Save image
      </v-btn>
    </template>

    <v-list class="denseselect" dense>
      <v-list-item dense @click="downloadImage('svg')">
        <v-list-item-title> <v-icon small class="mr-2">mdi-svg</v-icon>SVG </v-list-item-title>
      </v-list-item>

      <v-list-item dense @click="downloadImage('png')">
        <v-list-item-title> <v-icon small class="mr-2">mdi-image</v-icon>PNG </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  setup(_, { emit }) {
    const downloadImage = (format: string) => {
      emit("download", format);
    };
    return { downloadImage };
  },
});
</script>
