<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-icon class="mx-1" color="secondary" dark v-bind="attrs" v-on="on"> mdi-help-circle-outline </v-icon>
    </template>
    <slot></slot>
  </v-tooltip>
</template>

<script lang="ts">
export default {
  name: "HelpTooltip",
};
</script>
