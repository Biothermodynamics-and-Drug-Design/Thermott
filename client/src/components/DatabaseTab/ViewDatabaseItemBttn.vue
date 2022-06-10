<template>
  <div>
    <template v-if="item != null">
      <span v-if="text && text.length > 0" v-html="text" />
      <v-btn v-if="item" icon small :href="href" target="_blank">
        <v-icon>mdi-link</v-icon>
      </v-btn>
    </template>
    <template v-else>
      <v-chip color="error darken-1" x-small outlined>missing</v-chip>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "@vue/composition-api";

export default defineComponent({
  props: { item: Object, databaseLink: String, text: String },
  setup(props) {
    const href = computed(() => `${props.databaseLink}/${props.item.type}/${props.item.id}`);
    return { href };
  },
});
</script>
