<template>
  <v-card tile elevation="1">
    <v-card-title
      class="pa-1 pl-3 text-body-1 font-weight-medium"
      style="border-bottom: 1px solid #d5d5d5; background-color: #f7f7f7"
    >
      Generic
    </v-card-title>
    <v-card-text class="my-2">
      <v-checkbox
        v-if="options.ChartType !== 'Melting'"
        v-model="options.Title"
        label="Chart title"
        dense
        @change="emit('draw', options)"
      />
      <v-checkbox
        v-if="options.ChartType === 'Melting' || options.ChartType === 'Both'"
        v-model="options.ColorGradientRawData"
        label="Color gradient for raw data"
        dense
        @change="emit('draw', options)"
      />
      <v-checkbox
        v-if="options.ChartType === 'Binding' || options.ChartType === 'Both'"
        v-model="options.ColorGradientBinding"
        label="Color gradient for binding"
        dense
        @change="emit('draw', options)"
      />
      <v-checkbox
        v-if="
          options.ChartType === 'Binding' || options.ChartType === 'BothMany'
        "
        v-model="options.FullReport"
        label="Full report"
        dense
        @change="emit('draw', options)"
      />

      <v-select
        v-if="options.ChartType === 'Binding'"
        v-model="options.BindingChartLegendLabel"
        :items="bindingLegendLabelOptions"
        label="Legend style"
        dense
        @change="emit('draw', options)"
      />

      <v-select
        v-if="options.ChartType !== 'Melting'"
        v-model="options.Kb_format"
        :items="bindingFormats"
        label="Binding constant format"
        @change="emit('draw', options)"
      />

      <v-text-field
        v-model.number="options.ChartRatio"
        filled
        dense
        label="Chart ratio"
        @change="emit('draw', options)"
      >
        <template #[`append`]>
          <v-btn
            icon
            dense
            :disabled="options.ChartRatio === 1"
            @click="
              options.ChartRatio = 1;
              emit('draw', options);
            "
            ><v-icon>mdi-undo-variant</v-icon></v-btn
          >
          <v-btn icon dense @click="emit('draw', options)"
            ><v-icon>mdi-check-bold</v-icon></v-btn
          >
        </template>
      </v-text-field>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from "@vue/composition-api";
import { KbFormat, ReportChartOptions } from "../ReportChartPlotlyFunc";

export default defineComponent({
  props: { options: Object as PropType<ReportChartOptions> },
  emits: ["draw"],
  setup(props, { emit }) {
    const bindingLegendLabelOptions = [
      { value: "ProteinLigand", text: "Protein and ligand" },
      { value: "Name", text: "Experiment name" },
    ];
    const bindingFormats: KbFormat[] = ["Kd", "Kb", "both"];
    return { bindingFormats, emit, bindingLegendLabelOptions };
  },
});
</script>
