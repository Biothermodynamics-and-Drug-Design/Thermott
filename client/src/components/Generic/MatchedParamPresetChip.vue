<template>
  <span v-if="matchedPresets.length === 1" dense color="grey lighten-2"> {{ matchedPresets[0].protein }} {{ temp_T0 }} </span>
  <div v-else-if="matchedPresets.length > 1" class="d-flex align-center">
    {{ formatLabel[0] }}
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-icon small v-bind="attrs" v-on="on"> mdi-dots-horizontal-circle </v-icon>
      </template>
      <span>{{ formatLabel[1] }}</span>
    </v-tooltip>
    {{ temp_T0 }}
  </div>

  <span v-else dense color="grey lighten-2"> - {{ temp_T0 }} </span>
</template>

<script lang="ts">
import { BindingModelParams } from "@/models";
import { useAppSettings } from "@/store";
import { computed, defineComponent, PropType } from "@vue/composition-api";

export default defineComponent({
  props: { bindingParams: Object as PropType<BindingModelParams>, protein: String },
  setup(props) {
    const appSettings = useAppSettings();

    const matchedPresets = computed(() => {
      const params = props.bindingParams;
      const matched = appSettings.BindingParamPresets.filter(
        (x) => x.DuH_Tr === params.DuH_Tr && x.DuCp === params.DuCp && x.DbH_T0 === params.DbH_T0 && x.DbCp === params.DbCp
      );

      return matched || [];
    });

    const formatLabel = computed(() => {
      const presets = matchedPresets.value;
      const protein = props.protein.toLowerCase().trim();
      const combined_presets = presets.map((x, i) => ({
        id: i,
        mainLabel: x.protein,
        labels: [x.protein.toLowerCase().trim(), ...x.protein_aliases.map((x) => x.trim().toLowerCase())],
      }));
      const mainLabel = combined_presets.find((x) => x.labels.includes(protein))?.mainLabel || combined_presets[0].mainLabel;
      return [mainLabel, combined_presets.map((x) => x.mainLabel).join(", ")];
    });

    const temp_T0 = computed(() => {
      if (props.bindingParams.T0 !== null) {
        return `(${props.bindingParams.T0}°C)`;
      }
      return "(-°C)";
    });

    return { matchedPresets, formatLabel, temp_T0 };
  },
});
</script>
