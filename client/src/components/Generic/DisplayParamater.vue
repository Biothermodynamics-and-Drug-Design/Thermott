<template>
  <span style="white-space: nowrap" v-html="ParamHTML(props.parameter)" />
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { ParamHTML } from "@/utils/utils";

export default defineComponent({
  name: "DisplayParam",
  props: {
    parameter: String,
  },
  setup(props) {
    return { props, ParamHTML };
  },
});
</script>
