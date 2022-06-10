<template>
  <v-card v-if="demo.state" data-cy="demo-card" title outlined>
    <v-card-title class="text-h6 white--text purple darken-3 pa-1 pl-4" dark>
      Tutorial
      <v-divider class="mx-2" color="white" vertical /> {{ step_titles[demo.step - 1] }}
      <v-spacer />

      <v-btn color="error" text x-small @click="_endDemo" v-text="'End'" />

      <v-btn v-if="demo.step > 1" text x-small @click="demo.step--"> <v-icon v-text="'mdi-chevron-left'" />Previous </v-btn>
      <v-btn v-if="demo.step < step_titles.length" text x-small :disabled="!check_condition(demo.step)" @click="demo.step++">
        Next
        <v-icon v-text="'mdi-chevron-right'" />
      </v-btn>
    </v-card-title>
    <v-card-text class="py-2 px-4">
      <v-tabs-items v-model="demo.step">
        <v-tab-item :value="1">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Download
              <v-btn class="pa-1 mx-1" x-small outlined href="/assets/sample_data/SampleData_GenericCSV_CAXIII_3ligands.csv">
                sample data
                <v-icon small v-text="'mdi-download-outline'" />
              </v-btn>
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Click
              <span class="font-weight-black primary--text">Upload</span>
              <!-- <v-btn class="pa-1 mx-1" x-small color="primary" outlined v-text="'Upload'" style="pointer-events: none" /> -->
              button
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn class="pa-1 mx-1" x-small outlined color="success" @click="demo.step++" v-text="'Continue'" />
            </div>
          </div>
        </v-tab-item>

        <v-tab-item :value="2">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Select your
              <v-btn class="pa-1 mx-1" text x-small outlined href="/assets/sample_data/SampleData_GenericCSV_CAXIII_3ligands.csv">
                sample data
                <v-icon small v-text="'mdi-download-outline'" />
              </v-btn>
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Select file type as
              <span class="font-italic">Generic CSV</span>
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Select model as
              <span class="font-italic">Thermodynamic</span>
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Press <span class="font-weight-black primary--text">Upload</span>
              <!-- <v-btn class="pa-1 mx-1" x-small color="primary" outlined v-text="'Upload'" style="pointer-events: none" />in the dialog -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn
                class="pa-1 mx-1"
                x-small
                outlined
                color="success"
                :disabled="appData.experimentWells.length == 0"
                @click="demo.step++"
                v-text="'Continue'"
              />
            </div>
            <div v-if="appData.experimentWells.length == 0" class="secondary--text text--lighten-4 mx-2">
              You need to upload data to continue
            </div>
          </div>
        </v-tab-item>

        <v-tab-item :value="3">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Go to <span class="font-weight-black"> (2) Add experiment info</span> tab.
              <!-- <v-btn class="pa-1 mx-1" text x-small outlined v-text="'Metadata'" to="/MetaData" />tab -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Go to <span class="font-weight-black"> (2.1) Experiment wells editor</span> tab.
              <!-- <v-btn class="pa-1 mx-1" text x-small outlined v-text="'Experiment wells editor'" to="/MetaData/ExperimentWellsEditor" /> -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Click
              <v-btn class="pa-1 mx-1" x-small color="secondary" outlined @click="fillMetadata" v-text="'here'" />
              to fill out experiment metadata
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn
                class="pa-1 mx-1"
                outlined
                x-small
                color="success"
                :disabled="!check_condition(3)"
                @click="demo.step++"
                v-text="'Continue'"
              />
            </div>
            <div v-if="!check_condition(3)" class="secondary--text text--lighten-4 mx-2">You need to fill in metadata</div>
          </div>
        </v-tab-item>

        <v-tab-item :value="4">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Go to <span class="font-weight-black">Experiment builder</span> tab.
              <!-- <v-btn class="pa-1 mx-1" text x-small outlined v-text="'Binding experiment builder'" to="/MetaData/BindingExperimentBuilder" />tab -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Press <span class="font-weight-black primary--text">Create binding experiment</span> button.
              <!-- <v-btn class="pa-1 mx-1" x-small color="primary" outlined v-text="'Create binding experiment'" style="pointer-events: none" />button -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn class="pa-1 mx-1" x-small outlined color="success" @click="demo.step++" v-text="'Continue'" />
            </div>
          </div>
        </v-tab-item>

        <v-tab-item :value="5">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Click
              <v-btn class="pa-1 mx-1" x-small outlined @click="fillBindingExperimentMetadata" v-text="'here'" />to fill out experiment
              metadata
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">Click <span class="font-weight-black primary--text">+Add</span> button.</div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn
                class="pa-1 mx-1"
                x-small
                outlined
                color="success"
                :disabled="!check_condition(5)"
                @click="demo.step++"
                v-text="'Continue'"
              />
            </div>
            <div v-if="!check_condition(5)" class="secondary--text text--lighten-4 mx-2">You need to create a binding experiment</div>
          </div>
        </v-tab-item>

        <v-tab-item :value="6">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Click
              <v-icon color="black" v-text="'mdi-chevron-down'" /> to expand <span class="font-weight-black">Binding exp. 1</span> in the
              table.
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Drag <span class="font-weight-black">first 11 (#1-11, VD11-31-2)</span> exp. wells from left side to
              <span class="font-weight-black">Binding exp. 1</span> to add them
            </div>
            <v-icon v-text="'mdi-chevron-right'" />

            <div class="step-box">
              <v-btn
                class="pa-1 mx-1"
                x-small
                outlined
                color="success"
                :disabled="!check_condition(6)"
                @click="demo.step++"
                v-text="'Continue'"
              />
            </div>
            <div v-if="!check_condition(6)" class="secondary--text text--lighten-4">
              You need to add experiment wells to the binding experiment
            </div>
          </div>
        </v-tab-item>

        <v-tab-item :value="7">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            <div class="step-box">
              Go to <span class="font-weight-black"> (3) Fit binding</span> tab
              <!-- <v-btn class="pa-1 mx-1" text x-small outlined v-text="'Binding'" to="/Binding" />  tab -->
            </div>
            <!-- <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Select <span class="font-weight-black secondary--text">Binding exp. 1</span> in the list on the left.
            </div> -->
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              Press <span class="font-weight-black primary--text">Fit</span> button to fit the data.
              <!-- <v-btn class="pa-1 mx-1" x-small color="primary" outlined v-text="'Fit'" style="pointer-events: none" />
              button to fit the data -->
            </div>
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn
                class="pa-1 mx-1"
                x-small
                outlined
                color="success"
                :disabled="!check_condition(7)"
                @click="demo.step++"
                v-text="'Continue'"
              />
            </div>
            <div v-if="!check_condition(7)" class="secondary--text text--lighten-4">You need to fit K<sub>b</sub> value</div>
          </div>
        </v-tab-item>

        <v-tab-item :value="8">
          <div class="d-flex flex-wrap align-center justify-start flex-gap">
            If everything went as planned, you have determined a binding constant. This is the end of tutorial/demo.
            <v-icon v-text="'mdi-chevron-right'" />
            <div class="step-box">
              <v-btn class="pa-1 mx-1" x-small outlined color="error" @click="_endDemo" v-text="'End'" />
            </div>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { demo, endDemo } from "./Demo";
import { confirmDialog } from "@/components/Generic/confirmdialog";
import { useAppData } from "@/store";

export default defineComponent({
  setup(_, { emit }) {
    const appData = useAppData();
    const step_titles: string[] = [
      "Raw data upload", //1
      "Raw data upload", //2
      "Metadata", //3
      "Metadata", //4
      "Metadata", //5
      "Binding experiment", //6
      "End", //7
    ];
    const check_condition = (step: number) => {
      switch (step) {
        case 2:
          return appData.experimentWells.length > 0;
        case 3:
          return appData.experimentWells[0]?.protein;
        case 5:
          return appData.bindingExperiments.length > 0;
        case 6:
          return appData.bindingExperiments[0]?.expPointIndexes.length > 0;
        case 7:
          return appData.bindingExperiments[0]?.params.Kb > 1;
        default:
          return true;
      }
    };

    const _endDemo = async () => {
      const res = (await confirmDialog({ text: "Do you want to end tutorial/demo session?" })) as boolean;
      if (!res) return;
      endDemo();
    };

    const fillMetadata = () => {
      const expWells = appData.experimentWells;
      for (let index = 0; index < expWells.length; index++) {
        const expWell = expWells[index];
        expWell.ligand_conc = (Math.round(parseFloat(expWell.name.split(" ")[0]) * 100) / 100) * 10 ** -6;
        expWell.protein = "CAXIII";
        expWell.protein_conc = 5 * 10 ** -6;
        expWell.ligand = expWell.name.split(" ")[3];
      }
    };

    const fillBindingExperimentMetadata = () => {
      emit("fillbindingexperiment");
    };

    return { step_titles, _endDemo, fillMetadata, fillBindingExperimentMetadata, check_condition, demo, appData };
  },
});
</script>

<style scoped>
.arrow {
  border: solid black;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
}

.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}

.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
}

.step-box {
  border: 1px solid #dbdbdb;
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
}

.flex-gap {
  gap: 10px;
}
</style>
