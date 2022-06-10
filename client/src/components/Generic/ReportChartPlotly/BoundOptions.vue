<template>
  <v-card tile elevation="1" style="min-width: 250px">
    <v-card-title class="pa-1 pl-3 text-body-1 font-weight-medium" style="border-bottom: 1px solid #d5d5d5; background-color: #f7f7f7">
      Axis bounds
    </v-card-title>
    <v-card-text class="pa-0 px-1">
      <v-col class="pa-0">
        <template v-if="options.ChartType === 'Binding' || options.ChartType === 'Both' || options.ChartType === 'BothMany'">
          <v-checkbox v-model="options.BindingYAxisBounds.enabled" dense @change="emit('changeBindingYAxisBounds', options)">
            <template #[`label`]>
              <div class="d-flex flex-column">
                <div>Binding Y Axis (<i>T</i><sub>m</sub>) Bounds</div>
              </div>
            </template>
          </v-checkbox>
          <v-row no-gutters>
            <v-text-field
              v-model="options.BindingYAxisBounds.min"
              type="number"
              filled
              label="Min."
              :disabled="!options.BindingYAxisBounds.enabled"
              hide-details
              class="mx-1"
              style="width: 1px"
              @change="emit('draw', options)"
            >
              <template #[`append`]>
                <div class="mt-3">°C</div>
              </template>
            </v-text-field>
            <v-text-field
              v-model="options.BindingYAxisBounds.max"
              type="number"
              filled
              label="Max."
              :disabled="!options.BindingYAxisBounds.enabled"
              hide-details
              class="mx-1"
              style="width: 1px"
              @change="emit('draw', options)"
            >
              <template #[`append`]>
                <div class="mt-3">°C</div>
              </template>
            </v-text-field>
          </v-row>
          <v-divider class="my-3" />
        </template>

        <template v-if="options.ChartType === 'Melting' || options.ChartType === 'Both' || options.ChartType === 'BothMany'">
          <v-checkbox v-model="options.RawDataXAxisBounds.enabled" dense @change="emit('changeRawDataXAxisBounds', options)">
            <template #[`label`]>
              <div class="d-flex flex-column">
                <div>Raw data X axis (<i>T</i><sub>m</sub>) Bounds</div>
              </div>
            </template>
          </v-checkbox>
          <v-row no-gutters>
            <v-text-field
              v-model="options.RawDataXAxisBounds.min"
              type="number"
              filled
              label="Min."
              :disabled="!options.RawDataXAxisBounds.enabled"
              hide-details
              class="mx-1"
              style="width: 1px"
              @change="emit('draw', options)"
            >
              <template #[`append`]>
                <div class="mt-3">°C</div>
              </template>
            </v-text-field>
            <v-text-field
              v-model="options.RawDataXAxisBounds.max"
              type="number"
              filled
              label="Max."
              :disabled="!options.RawDataXAxisBounds.enabled"
              hide-details
              class="mx-1"
              style="width: 1px"
              @change="emit('draw', options)"
            >
              <template #[`append`]>
                <div class="mt-3">°C</div>
              </template>
            </v-text-field>
          </v-row>
        </template>
      </v-col>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from "@vue/composition-api";
import type { ReportChartOptions } from "../ReportChartPlotlyFunc";

export default defineComponent({
  props: { options: Object as PropType<ReportChartOptions> },
  emits: ["changeBindingYAxisBounds", "changeRawDataXAxisBounds", "draw"],
  setup(props, { emit }) {
    return { emit };
  },
});
</script>
