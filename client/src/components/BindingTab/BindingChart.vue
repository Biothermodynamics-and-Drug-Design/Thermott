<template>
  <v-container fluid style="height: 100%">
    <div style="position: relative">
      <canvas ref="chartRef" @click="canvasClick"></canvas>
    </div>
    <v-menu v-model="pointModel.model" :position-x="pointModel.x" :position-y="pointModel.y" :close-on-click="false">
      <v-list dense class="py-0">
        <div class="mx-2 my-1 font-weight-medium">Show melting data</div>
        <v-divider />
        <v-list-item dense @click="routeExperimentWellRawData(false)"> Point </v-list-item>
        <v-list-item dense @click="routeExperimentWellRawData(true)"> Series </v-list-item>
        <v-divider />
        <v-list-item dense @click="excludePoint()"> Exclude point from all experiments </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, onMounted, ref, watch } from "@vue/composition-api";
import { Chart, ChartConfiguration, TooltipModel, TooltipItem, ChartTypeRegistry, ChartEvent, ActiveElement } from "chart.js";
import type { ChartType } from "chart.js";
import * as Models from "../../models";
import { BindingExperiment, ExperimentWell } from "@/models";
import { DrawDatasets, axisBounds, afterDrawPlugin } from "./BindingChartFunc";
import Vue from "vue";
import router from "@/router/index";

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    afterDrawBinding: Record<string, unknown>;
  }
}

export default defineComponent({
  props: {
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    experimentWells: Array as PropType<ExperimentWell[]>,
    showConfInterval: Boolean,
  },
  setup(props) {
    let chart: Chart = undefined;
    const chartRef = ref(null as unknown as HTMLElement);

    const default_fontsize = 16;

    const pointModel = ref({
      model: false,
      x: 0,
      y: 0,
      experimentWellId: -1,
      bindingExperimentId: -1,
    });

    const canvasClick = (e: MouseEvent) => {
      pointModel.value.x = e.x;
      pointModel.value.y = e.y;
    };

    const onPointClick = (e: ChartEvent, activeElement: ActiveElement[]) => {
      pointModel.value.model = false;

      const chartPoint = activeElement[0];
      if (!chartPoint) return;

      const dataset = chart.getDatasetMeta(chartPoint.datasetIndex);
      const datasetPoint = dataset.data[chartPoint.index];
      const point = (datasetPoint as any).$context.raw;
      if (!point) return;
      pointModel.value.model = true;
      pointModel.value.experimentWellId = point.id;
      pointModel.value.bindingExperimentId = point.bindingExperimentId;
    };

    const excludePoint = () => {
      const experimentWell = props.experimentWells.find((x) => x.id === pointModel.value.experimentWellId);
      if (experimentWell) {
        experimentWell.fit_points = experimentWell.fit_points.map(() => false);
        experimentWell.tm_model_params.Tm = null;
      }
      drawChart(props.bindingExperiments);
    };

    // const formatXaxisBounds = () => {
    //   if (chart?.scales.xAxis) return;
    //   if (props.bindingExperiments.length === 0) {
    //     return;
    //   }
    //   const xAxis = chart.scales.xAxis;
    //   const xAxisControl = chart.scales.xAxisControl;
    //   const Pt = chart.options.plugins.axisBreak;
    //   xAxis.min = Math.log10(Pt * axisBounds.min);
    //   const controlFraction = (Math.log10(Pt * axisBounds.end) - xAxis.min) / (xAxis.max - xAxis.min);
    //   xAxisControl.max = (Pt * axisBounds.end) / controlFraction;
    //   xAxisControl.min = 0;
    //   //xAxis.min = Pt/20;
    // };

    const formatXTickLabels = () => {
      if (!chart?.scales) return;

      if (chart.data.datasets.length === 0 || chart.data.datasets.every((x) => x.data.length === 0)) {
        chart.scales.xAxis.ticks = [{ value: 0, label: "0", major: true }];
        return;
      }
      const xAxis = chart.scales.xAxis;
      const xAxisControl = chart.scales.xAxisControl;
      const Pt = chart.options.plugins.axisBreak;
      xAxis.min = Math.log10(Pt * axisBounds.min);
      const controlFraction = (Math.log10(Pt * axisBounds.end) - xAxis.min) / (xAxis.max - xAxis.min);
      xAxisControl.max = (Pt * axisBounds.end) / controlFraction;
      xAxisControl.min = 0;

      let max = chart.scales.xAxis.getMinMax(false).max;
      //min = 10 ** min;
      max = 10 ** max;

      const max_tick = max * 10 ** 6;

      //const max_tick = Math.max(...values) * 10 ** 6;
      let new_ticks = [];
      for (let index = 0; index < 8; index++) {
        const tick = max_tick * (1 / 2) ** index;
        switch (true) {
          case tick > 1000:
            new_ticks.push(Math.ceil(tick / 100) * 100);
            break;
          case tick < 1:
            new_ticks.push(Math.round(tick * 10) / 10);
            break;
          case tick < 5:
            new_ticks.push(Math.round(tick * 10) / 10);
            break;
          case tick < 25:
            new_ticks.push(Math.ceil(tick / 5) * 5);
            break;
          case tick < 100:
            new_ticks.push(Math.ceil(tick / 25) * 25);
            break;
          case tick < 200:
            new_ticks.push(Math.ceil(tick / 25) * 25);
            break;
          case tick < 500:
            new_ticks.push(Math.ceil(tick / 50) * 50);
            break;

          default:
            break;
        }
      }
      // const start = Pt * axisBounds.start*10**6;
      // const end = Pt * axisBounds.end*10**6;
      // new_ticks.push(start, end);
      new_ticks = [...new Set(new_ticks)].sort(function (a, b) {
        return a - b;
      });
      new_ticks = new_ticks.map((x) => Math.log10(x / 10 ** 6));
      new_ticks = new_ticks.filter((x) => x > Math.log10(chart.options.plugins.axisBreak) && chart.scales.xAxis.max > x);

      chart.scales.xAxis.ticks = [
        { value: chart.scales.xAxis.min },
        ...new_ticks.map((x) => ({
          value: x,
        })),
      ];
    };

    const config: ChartConfiguration = {
      type: "scatter",
      data: { datasets: [] },
      plugins: [afterDrawPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        parsing: {
          xAxisKey: "x",
          yAxisKey: "y",
        },
        onClick: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => onPointClick(event, elements),
        interaction: {
          mode: "nearest",
          intersect: true,
          axis: "xy",
        },
        plugins: {
          afterDrawBinding: {},
          axisBreak: 0,
          tooltip: {
            callbacks: {
              label: function (this: TooltipModel<keyof ChartTypeRegistry>, tooltipItem: TooltipItem<"scatter">): string | string[] {
                const data = tooltipItem.raw as {
                  x: number;
                  y: number;
                  id: number;
                  name: string;
                };
                if (data.x === 0) return [`#${data.id} ${data.name}`, `${0}μM, ${data.y}°C`];
                else return [`#${data.id} ${data.name}`, `${(10 ** data.x * 10 ** 6).toPrecision(3)}μM, ${data.y}°C`];
              },
            },
          },
          legend: {
            display: true,
            position: "top",
            onClick: null,
            labels: {
              boxWidth: 12,
              filter: (legendItem, data) => legendItem.text.length > 0 && legendItem.text[0] !== "_",
            },
          },
        },
        scales: {
          xAxis: {
            type: "linear",
            position: "bottom",
            display: true,

            axis: "x",
            //afterDataLimits: this.formatXaxisBounds,
            //afterDataLimits: this.axisBoundTest,
            afterBuildTicks: formatXTickLabels,
            //afterBuildTicks: this.formatXTickLabels,
            //beforeBuildTicks: this.formatXaxisBounds,
            offset: false,

            ticks: {
              major: { enabled: true },
              font: { size: default_fontsize },
              callback: function (value, index, values) {
                if ((value as number) === values[0].value) {
                  return "0";
                } else {
                  return (10 ** (value as number) * 10 ** 6).toFixed(0);
                }
              },
            },
            title: {
              text: "Added ligand concentration (μM)",
              display: true,
              font: { size: default_fontsize },
            },
          },
          xAxisControl: {
            type: "linear",
            min: 0,
            position: "top",
            display: true,
            offset: false,
            axis: "x",
            //afterBuildTicks: this.formatXTickLabels2,
            grid: { display: false },
            ticks: {
              display: true,
              color: "rgba(0,0,0,0)",
              //maxTicksLimit: 3,
              // callback: (tickValue: string | number, index: number, ticks: Tick[]) => {
              //   return ((tickValue as number)*10**7).toFixed(0);
              // },
              major: { enabled: false },
              font: { size: default_fontsize },
              // callback: function (value, index, values) {
              //   return ((value as number) * 10 ** 6).toFixed(2);
              // },
            },
            title: {
              text: "Added ligand concentration (μM)",
              display: false,
              font: { size: default_fontsize },
            },
          },

          yAxis: {
            type: "linear",
            position: "left",
            display: true,
            axis: "y",
            title: {
              text: "Melting temperature (°C)",
              display: true,
              font: { size: default_fontsize },
            },
            ticks: {
              display: true,
              font: { size: default_fontsize },
            },
          },

          yAxisRight: {
            type: "linear",
            position: "right",
            display: true,
            axis: "y",
            grid: { display: false },
            title: {
              text: "Melting temperature (°C)",
              display: false,
              font: { size: default_fontsize },
            },
            ticks: {
              display: false,
              font: { size: default_fontsize },
            },
          },
        },
      },
    };

    const drawChart = async (bindingExperiments: Models.BindingExperiment[]) => {
      if (!chart) return;
      //await this.$nextTick();
      await Vue.nextTick();
      if (bindingExperiments.length > 0) {
        const Pt = Math.min(...bindingExperiments.map((x) => x.params.Pt));
        chart.options.plugins.axisBreak = Pt;
        DrawDatasets(props.bindingExperiments, props.experimentWells, chart, props.showConfInterval);
      } else {
        chart.data.datasets = [];
        chart.update();
      }
    };

    const routeExperimentWellRawData = (series = false) => {
      if (!series) {
        window.sessionStorage.setItem("RawData_selectedExpWellIds", pointModel.value.experimentWellId.toString());
        router.push(`/RawData?wells=${pointModel.value.experimentWellId}`);
        //this.$router.push(`/RawData?wells=${pointModel.value.experimentWellId}`);
      } else {
        const bindingExperiment = props.bindingExperiments.find((x) => x.id === pointModel.value.bindingExperimentId);
        const ids = bindingExperiment.expPointIndexes.join(",");
        window.sessionStorage.setItem("RawData_selectedExpWellIds", ids);
        router.push(`/RawData?wells=${ids}`);
        //this.$router.push(`/RawData?wells=${ids}`);
      }
    };

    onMounted(() => {
      chart = new Chart(chartRef.value as any, config);
      drawChart(props.bindingExperiments);
    });

    watch(
      () => props.bindingExperiments,
      () => {
        drawChart(props.bindingExperiments);
      },
      { deep: true }
    );

    watch(
      () => props.showConfInterval,
      () => {
        drawChart(props.bindingExperiments);
      }
    );

    return { pointModel, canvasClick, routeExperimentWellRawData, excludePoint, chartRef, drawChart };
  },
});
</script>
