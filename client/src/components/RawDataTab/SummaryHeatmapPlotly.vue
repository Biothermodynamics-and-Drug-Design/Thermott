<template>
  <v-dialog v-model="dialog" eager fullscreen width="unset">
    <template #activator="{ on }">
      <v-btn x-small outlined depressed color="blue-grey darken-1" class="ma-1" v-on="on"
        >Heatmap<v-icon small class="ml-1">mdi-view-grid-outline</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        Summary heatmap
        <v-spacer />
        <v-menu right offset-y>
          <template #activator="{ on }">
            <v-btn v-model="menu" text class="mx-2" small v-on="on">
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
        <v-btn icon @click="dialog = false">
          <v-icon v-text="'mdi-close'" />
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row class="mt-4" justify="center" no-gutters>
          <v-select
            v-model.number="items_per_row"
            class="mx-4"
            outlined
            dense
            hide-details
            label="Column count"
            style="max-width: 200px"
            :items="[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
            @change="drawHeatmap"
          />

          <v-text-field v-model.number="reference_Tm" class="mx-4" outlined dense style="max-width: 200px" @change="drawHeatmap">
            <template #label>Reference <Params parameter="Tm" /> (°C)</template>
          </v-text-field>
        </v-row>
        <v-row justify="center" align="center" class="my-1" no-gutters>
          <span>Click to select reference well</span>
          <v-tooltip right>
            <template #activator="{ on, attrs }">
              <v-btn color="grey" class="mx-2" small icon v-bind="attrs" v-on="on" @click="resetReference()">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>
            <span>Reset reference</span>
          </v-tooltip>
        </v-row>
        <v-row justify="center" align="center" class="my-2" no-gutters>
          <v-col xs="12" sm="10" md="8" lg="4" xl="4">
            <div ref="chart" class="ma-0" />
          </v-col>
        </v-row>
        <!-- <v-row no-gutters justify="center" align="center">
          
        </v-row> -->
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ExperimentWell } from "@/models";
import { computed, defineComponent, PropType, ref, watch } from "@vue/composition-api";
import type { Ref } from "@vue/composition-api";
import Params from "@/components/Generic/DisplayParamater.vue";
//import * as Plotly from "@/utils/plotly.js";
//import "@/utils/plotly.js";
import { Plotly } from "@/utils/plotly";

export default defineComponent({
  components: { Params },
  props: { experimentWells: Array as PropType<ExperimentWell[]> },
  setup(props) {
    const dialog = ref(false);
    const menu = ref(false);

    const Plotly = window.Plotly;

    const chart: Ref<null | HTMLDivElement> = ref(null);

    const reference_Tm: Ref<number | null> = ref(null);
    const items_per_row: Ref<number | null> = ref(null);

    const downloadImage = async (imagetype: string) => {
      await (window.Plotly as any).downloadImage(chart.value, { format: imagetype });
    };

    const calculateReferenceTm = () => {
      const Tms = props.experimentWells.map((x) => x.tm_model_params?.Tm).filter((x) => x != null);
      const minTm = Math.min(...Tms);
      const maxTm = Math.max(...Tms);
      const delta = (maxTm - minTm) / 2 + minTm;
      reference_Tm.value = delta > 0 ? delta : null;
    };

    const drawHeatmap = () => {
      //var data: Partial<Plotly.PlotData>[] = [

      const matrix_size: MatrixSize = {
        row: null,
        col:
          Number.isInteger(items_per_row.value) && items_per_row.value > 0
            ? items_per_row.value
            : Math.ceil(Math.sqrt(props.experimentWells.length)),
      };
      // if (matrix_size.col * (matrix_size.col - 1) >= this.experimentWells.length) matrix_size.row = matrix_size.col - 1;
      // else matrix_size.row = matrix_size.col;
      matrix_size.row = Math.ceil(props.experimentWells.length / matrix_size.col);

      const layout: Partial<Plotly.Layout> = {
        //width: matrix_size.col*50 + (matrix_size.col < 7 ? matrix_size.col*50 : 0),
        //height: 450+ (matrix_size.col < 7 ? matrix_size.row*10 : 0),
        // width: (matrix_size.col/matrix_size.row > 1) ? matrix_size.col*50 : 600,
        // height: (matrix_size.col/matrix_size.row > 1) ? 600 : matrix_size.row*30,
        width: matrix_size.col / matrix_size.row > 3 ? 600 + (20 * matrix_size.col) / matrix_size.row : 600,
        height: matrix_size.row / matrix_size.col > 3 ? 600 + (20 * matrix_size.row) / matrix_size.col : 600,
        font: { size: 18 },
        annotations: [],
        hovermode: "closest",
        // xaxis: {fixedrange: true},
        // yaxis: {fixedrange: true},
        xaxis: { scaleanchor: "y", scaleratio: 1, constrain: "domain", fixedrange: true, showgrid: false, visible: false },
        yaxis: { fixedrange: true, autorange: "reversed", tickvals: [], showgrid: false, visible: false },
        // yaxis:{scaleanchor:"x"},
        scene: { aspectratio: { x: 1, y: 2, z: 1 } },
        margin: { t: 0, b: 0, l: 0, r: 0 },
      };

      const data: any[] = [
        {
          // z: [
          //   [1, 20, 30],
          //   [20, 1, 60],
          //   [30, 60, 1],
          // ],
          z: [],
          text: [],
          type: "heatmap",
          zmid: reference_Tm.value,
          colorscale: [
            [0, "rgb(0,0,255)"],
            [0.5, "rgb(255,255,255)"],
            [1, "rgb(255,0,0)"],
          ],
          colorbar: { title: "<i>T<sub>m</sub></i> (°C)", outlinewidth: 0.3, len: matrix_size.col / matrix_size.row < 0.3 ? 0.5 : 0.7 },
          textposition: "middle center",
          hovertemplate: "%{text}<br /> <i>T<sub>m</sub></i> = %{z}°C<extra></extra>",
          hovergaps: false,
        },
      ];

      let expWell_index = 0;
      for (let index = 0; index < matrix_size.row; index++) {
        const row_Tms: number[] = [];
        const row_text: string[] = [];
        for (let index2 = 0; index2 < matrix_size.col; index2++) {
          if (!props.experimentWells[expWell_index]) continue;
          row_Tms.push(props.experimentWells[expWell_index]?.tm_model_params?.Tm);
          const text_string = `(${props.experimentWells[expWell_index]?.id}) ${props.experimentWells[expWell_index]?.name}`;
          row_text.push(text_string);

          const annotation = {
            xref: "x1",
            yref: "y1",
            x: index2,
            y: index,
            text: props.experimentWells[expWell_index].id.toString(),
            font: {
              //family: "Arial",
              size: 20,
              color: "black",
              //color: this.isTmCloseToZmid(this.experimentWells[expWell_index].tm_model_params.Tm) ? "black" : "white",
            },
            bgcolor: "rgba(255,255,255,0.7)",
            showarrow: false,
          };
          layout.annotations.push(annotation as any);

          expWell_index++;
        }

        data[0].z[index] = row_Tms;
        (data[0].text as any as string[][]).push(row_text);
      }

      const config = { responsive: true, staticPlot: false, displayModeBar: false, fillFrame: false };

      //const chart = this.$refs.chart as HTMLDivElement;

      (Plotly as any).newPlot(chart.value, data, layout, config);
      (chart.value as any).on("plotly_click", (data: any) => {
        if (data.points[0]) {
          const expWellId = data.points[0].x + 1 + data.points[0].y * matrix_size.col;
          const referenceWell = props.experimentWells.find((x) => x.id === expWellId);
          reference_Tm.value = referenceWell.tm_model_params?.Tm;
          drawHeatmap();
        }
      });
    };

    const resetReference = () => {
      //this.reference_well = null;
      calculateReferenceTm();
      drawHeatmap();
    };

    watch(
      computed(() => dialog.value),
      (newVal) => {
        if (newVal === true) {
          calculateReferenceTm();
          console.log(chart.value);
          drawHeatmap();
        } else {
          reference_Tm.value = null;
        }
      }
    );

    return {
      downloadImage,
      resetReference,
      drawHeatmap,
      dialog,
      menu,
      chart,
      reference_Tm,
      items_per_row,
    };
  },
});

interface MatrixSize {
  row: number;
  col: number;
}
</script>

<style>
.plotly {
  display: inline-block;
}
</style>
