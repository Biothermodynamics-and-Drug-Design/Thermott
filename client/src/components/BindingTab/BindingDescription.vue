<template>
  <v-container class="pa-0">
    <v-card
      v-if="bindingExperiments.length === 1 && bindingExperiment"
      class="my-3"
      elevation="0"
      style="border: 1px solid #cecece"
    >
      <v-card-text class="pa-3 pb-0 text-body-1 text--primary">
        <div
          style="
            display: grid;
            grid-auto-columns: max-content;
            column-gap: 20px;
            row-gap: 5px;
          "
        >
          <div style="grid-column-start: 1">Name</div>
          <div style="grid-column-start: 2">{{ bindingExperiment.name }}</div>
          <div style="grid-column-start: 1">Protein</div>
          <div style="grid-column-start: 2">
            {{ bindingExperiment.protein }} {{ formatProteinConc }}
          </div>
          <div style="grid-column-start: 1">Ligand</div>
          <div style="grid-column-start: 2">
            {{ bindingExperiment.ligand }} {{ formatLigandConc }}
          </div>
        </div>
        <!-- <v-row>name: {{ bindingExperiment.name }}</v-row>
        <v-row>protein: {{ bindingExperiment.protein }}</v-row>
        <v-row>ligand: {{ bindingExperiment.ligand }}</v-row> -->
        <v-row no-gutters align="center">
          <v-text-field
            v-if="isEditingKb"
            v-model.number="bindingExperiment.params.Kb"
            hide-details
            dense
            class="mr-2 mt-4 smallinput"
            @input="clearConfInterval()"
          >
            <template #append>
              <v-icon @click="incrKb(false)">mdi-chevron-down</v-icon>
              <v-icon @click="incrKb(true)">mdi-chevron-up</v-icon>
            </template>
            <template #prepend
              ><span class="mt-1"><i>K</i><sub>b</sub></span></template
            >

            <template #append-outer>
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    icon
                    class="mx-2 pb-2"
                    v-bind="attrs"
                    v-on="on"
                    @click="isEditingKb = !isEditingKb"
                    ><v-icon v-text="isEditingKb ? 'mdi-close' : 'mdi-pencil'"
                  /></v-btn>
                </template>
                <span>Exit editing</span>
              </v-tooltip>
              <v-btn
                v-if="!advanceFit"
                small
                color="primary"
                @click="_fit_KbOnly"
                >Fit</v-btn
              >
            </template>
          </v-text-field>

          <div v-else class="pa-0 mt-4 mb-2">
            <div
              v-html="
                '<i>K</i><sub>d</sub>&nbsp; &nbsp;&nbsp;&nbsp;' +
                _formatKb(bindingExperiment.params.Kb, 'Kd')
              "
            />
            <div
              v-html="
                '<i>K</i><sub>b</sub>&nbsp; &nbsp;&nbsp;&nbsp;' +
                _formatKb(bindingExperiment.params.Kb, 'Kb')
              "
            />
            <div>
              <v-tooltip
                v-if="bindingExperiment.params.Kb_confidence_interval"
                bottom
              >
                <template #activator="{ on, attrs }">
                  <v-chip label small v-bind="attrs" v-on="on">
                    Conf. interval
                  </v-chip>
                </template>
                <div>
                  <div v-html="confInterval"></div>
                </div>
              </v-tooltip>
            </div>
          </div>
          <v-spacer v-if="!isEditingKb" />
          <v-tooltip v-if="!isEditingKb && !advanceFit" bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                class="mx-2"
                v-bind="attrs"
                v-on="on"
                @click="isEditingKb = !isEditingKb"
                ><v-icon v-text="isEditingKb ? 'mdi-close' : 'mdi-pencil'"
              /></v-btn>
            </template>
            <span v-if="!isEditingKb">Edit K<sub>b</sub> value</span
            ><span v-else>Exit editing</span>
          </v-tooltip>
          <v-btn
            v-if="!isEditingKb && !advanceFit"
            depressed
            small
            color="primary"
            @click="_fit_KbOnly"
            >Fit</v-btn
          >
        </v-row>
        <div class="d-flex flex-row justify-end">
          <v-btn
            :color="advanceFit ? 'grey' : 'primary'"
            dark
            text
            small
            class="px-0"
            @click="emit('update-advancefit', !advanceFit)"
            >Advanced fitting<v-icon small> mdi-tools </v-icon>
          </v-btn>
        </div>

        <v-row no-gutters class="my-2">
          <v-text-field
            v-model="bindingExperiment.comment"
            label="Comment"
            outlined
            dense
            hide-details
          />
        </v-row>
      </v-card-text>
    </v-card>
    <v-btn
      v-if="bindingExperiments.length > 1"
      color="primary"
      depressed
      block
      small
      class="my-2"
      @click="_fit_KbOnly"
      >Fit selected</v-btn
    >
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "@vue/composition-api";

import { Fit_KbOnly } from "@/utils/api";
import { getExperimentWellsFromBindingExperiment } from "@/utils/bindingexperiment_manager";
import { BindingExperiment, ExperimentWell } from "@/models";
import { formatKb } from "@/utils/utils";
import { useNotify } from "../Generic/GlobalSnackbarStore";
import { useAppData } from "@/store";

export default defineComponent({
  components: {  },
  props: {
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    experimentWells: Array as PropType<ExperimentWell[]>,
    advanceFit: Boolean,
  },
  emits: ["update-advancefit", "update-chart"],
  setup(props, { emit }) {
    const bindingExperiment = computed(() =>
      props.bindingExperiments.length > 0 ? props.bindingExperiments[0] : null
    );

    const formatProteinConc = computed(() => {
      const protein_conc = bindingExperiment.value.params.Pt;
      return protein_conc != null
        ? `(${(protein_conc * 10 ** 6).toPrecision(3)} μM)`
        : "";
    });

    const isEditingKb = ref(false);

    const formatLigandConc = computed(() => {
      const expWells = getExperimentWellsFromBindingExperiment(
        bindingExperiment.value
      );
      if (expWells == null || expWells.length == 0) return "";
      const ligand_conc = expWells.map((x) => x.ligand_conc * 10 ** 6);
      if (ligand_conc == null || ligand_conc.length == 0) return "";

      const minConc = Math.min(...ligand_conc);
      const maxConc = Math.max(...ligand_conc);
      if (minConc == maxConc) return "";

      const activeLigandFraction =
        bindingExperiment.value.params.ActiveLigandFraction ?? 1;

      const text = `(${
        minConc == 0 ? "0" : minConc.toPrecision(3)
      }-${maxConc.toPrecision(3)}μM)${
        activeLigandFraction < 1
          ? " (" + Math.round(activeLigandFraction * 100).toFixed(0) + "%)"
          : ""
      }`;

      return text;
    });

    const _formatKb = (
      value: number,
      format: "Kd" | "Kb" = "Kd",
      units = true
    ) => formatKb(value, 3, format, units);

    const confInterval = computed(() => {
      if (
        bindingExperiment.value.params.Kb &&
        bindingExperiment.value.params.Kb_confidence_interval
      ) {
        const label =
          "K<sub>d</sub>&nbsp; &nbsp;&nbsp;&nbsp;" +
          "[" +
          _formatKb(
            bindingExperiment.value.params.Kb_confidence_interval[1],
            "Kd",
            false
          ) +
          ", " +
          _formatKb(
            bindingExperiment.value.params.Kb_confidence_interval[0],
            "Kd",
            true
          ) +
          "]" +
          "<br />" +
          "K<sub>b</sub>&nbsp; &nbsp;&nbsp;&nbsp;" +
          "[" +
          _formatKb(
            bindingExperiment.value.params.Kb_confidence_interval[0],
            "Kb",
            false
          ) +
          ", " +
          _formatKb(
            bindingExperiment.value.params.Kb_confidence_interval[1],
            "Kb",
            true
          ) +
          "]";
        return label;
      }

      return "";
    });

    const appData = useAppData();
    const notify = useNotify();

    // const _fit_KbOnly = async (bindingExperiment: BindingExperiment) => {
    //   const result = await Fit_KbOnly(bindingExperiment, props.experimentWells);

    //   notify(result.message, result.ok ? "success" : "error", 4_000);
    //   //this.$emit("change", this.bindingExperiments);
    // }

    const _fit_KbOnly = async () => {
      const success_results: string[] = [];
      const error_results: string[] = [];
      for (let index = 0; index < props.bindingExperiments.length; index++) {
        const bindingExperiment = props.bindingExperiments[index];
        const ids = bindingExperiment.expPointIndexes;
        const experimentWells = appData.experimentWells.filter((x) =>
          ids.includes(x.id)
        );
        const result = await Fit_KbOnly(bindingExperiment, experimentWells);
        result.ok
          ? success_results.push(result.message)
          : error_results.push(result.message);
      }
      if (success_results.length > 0) {
        notify(
          success_results.join("\n"),
          "success",
          4_000 + 2_000 * success_results.length
        );
      }

      if (error_results.length > 0) {
        notify(
          error_results.join("\n"),
          "error",
          4_000 + 2_000 * error_results.length
        );
      }

      //this.$emit("change", this.bindingExperiments);
    };

    const incrKb = (increase = true) => {
      if (bindingExperiment.value.params.Kb) {
        const amount =
          Math.ceil(Math.log10(bindingExperiment.value.params.Kb)) - 1;
        bindingExperiment.value.params.Kb += (increase ? 1 : -1) * 10 ** amount;
        bindingExperiment.value.params.Kb_confidence_interval = null;
        //emit("change", this.bindingExperiments);
      } else {
        bindingExperiment.value.params.Kb_confidence_interval = null;
        bindingExperiment.value.params.Kb = 1e5;
        //this.$emit("change", this.bindingExperiments);
      }
    };

    const clearConfInterval = () => {
      bindingExperiment.value.params.Kb_confidence_interval = null;
    };

    return {
      bindingExperiment,
      formatProteinConc,
      isEditingKb,
      formatLigandConc,
      emit,
      _formatKb,
      _fit_KbOnly,
      confInterval,
      incrKb,
      clearConfInterval,
    };
  },
});
</script>



