<template>
  <v-container>
    <v-row v-for="bound in fitBounds" :key="bound.param">
      <Param :parameter="bound.param" />
      <span v-html="formatParamBounds(bound.param)" />
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import Param from "@/components/Generic/DisplayParamater.vue";

export default defineComponent({
  name: "BindingAdvancedFitBounds",
  components: { Param },
  setup() {
    const fitBounds = [
      { param: "DuH_Tr", bounds: [50_000, 2_000_000], unit: "J/mol" },
      { param: "DuCp", bounds: [4_000, 100_000], unit: "J/(mol⋅K)" },
      { param: "DbH_T0", bounds: [-100_000, 50_000], unit: "J/mol" },
      { param: "DbCp", bounds: [-10_000, 10_000], unit: "J/(mol⋅K)" },
      { param: "Pt", bounds: [10 ** -7, 10 ** -4], unit: "M" },
    ];

    const formatParamBounds = (param: string) => {
      const paramBounds = fitBounds.find((x) => x.param === param);
      let values: string[] = [];
      for (const value of paramBounds.bounds) {
        const split_string = value.toExponential(1).split("e"); //[1.53, +7]
        if (value == 0) values.push(`0`);
        else values.push(`${split_string[0]}·10<sup> ${split_string[1].substring(1)} </sup>`);
      }
      return `&nbsp; = &nbsp;[ ${values[0]},&nbsp; ${values[1]}] &nbsp; ${paramBounds.unit || ""}`;
    };

    return { fitBounds, formatParamBounds };
  },
});
</script>
