<template>
  <v-app>
    <v-container fill-height fluid justify-center align-center>
      <v-card class="ma-0" elevation="0" outlined>
        <v-card-title class="grey lighten-2">
          Protein (single-domain) parameter prediction
          <v-spacer />
        </v-card-title>

        <v-card-text class="pa-2 pt-6 ma-2 pb-4 text-subtitle-1">
          <v-form v-model="form">
            <div no-gutters class="d-flex align-center flex-row justify-space-around">
              <div class="d-flex flex-column">
                <div class="text-subtitle-1 d-flex">Residue count</div>
                <v-text-field v-model.number="n_residues" dense filled :rules="n_residues_rules" />
              </div>
              <v-btn
                depressed
                color="primary"
                class="mx-4 mb-3"
                :disabled="!form || loading_dCp || loading_dHu"
                :loading="loading_dCp || loading_dHu"
                @click="predict"
                >predict</v-btn
              >
              <div class="d-flex flex-column">
                <div class="text-subtitle-1 d-flex mx-2">
                  Predicted heat capacity of unfolding (<Params class="font-weight-bold" parameter="DuCp" />)
                </div>
                <div class="d-flex flex-row align-center">
                  <!-- <v-text-field :value="(predicted_dCp>0) ? predicted_dCp : '-'" disabled dense filled>
                  <template #[`append`]>
                    <div class="text-subtitle-1">J/mol/K</div>
                  </template>
                </v-text-field> -->
                  <v-sheet class="px-2 py-2" elevation="0" color="grey lighten-3" rounded style="width: 100%">
                    <div class="d-flex justify-space-between align-center text-subtitle-1">
                      <div class="ml-4">{{ predicted_dCp > 0 ? predicted_dCp.toLocaleString("en-US").replace(/,/g, " ") : "-" }}</div>
                      <div>J/mol/K</div>
                    </div>
                  </v-sheet>
                  <v-btn icon small @click="copyToClipBoard(predicted_dCp)"><v-icon>mdi-content-copy</v-icon></v-btn>
                </div>
                <div class="text-subtitle-1 d-flex mx-2 mt-4">
                  Predicted unfolding enthalpy (<Params class="font-weight-bold" parameter="DuH_Tr" />)
                </div>
                <div class="d-flex flex-row align-center">
                  <!-- <v-text-field :value=" dense disabled filled>
                  <template #[`append`]>
                    <div class="text-subtitle-1">J/mol</div>
                  </template>
                </v-text-field> -->
                  <v-sheet class="px-2 py-2" elevation="0" color="grey lighten-3" rounded style="width: 100%">
                    <div class="d-flex justify-space-between align-center text-subtitle-1">
                      <div class="ml-4">{{ predicted_dHu > 0 ? predicted_dHu.toLocaleString("en").replace(/,/g, " ") : "-" }}</div>
                      <div class="">J/mol</div>
                    </div>
                  </v-sheet>
                  <v-btn icon small @click="copyToClipBoard(predicted_dHu)"><v-icon>mdi-content-copy</v-icon></v-btn>
                </div>
                <div class="text-caption mt-4">*Predicted values are only a rough approximation.</div>
              </div>
            </div>
          </v-form>
        </v-card-text>
        <v-sheet class="pa-2 d-flex flex-wrap flex-column" color="red lighten-4">
          <span>
            Binding enthalpy (<Params class="font-weight-bold" parameter="DbH_T0" />) and binding heat capacity (<Params
              class="font-weight-bold"
              parameter="DbCp"
            />) should be determined experimentally
          </span>
        </v-sheet>
        <v-sheet class="pa-2 d-flex flex-wrap flex-column" color="grey lighten-3">
          Calculation based on:<br />
          <a class="text-decoration-none" href="https://doi.org/10.1021/cr960383c" target="_href">
            Robertson, Andrew D., and Kenneth P. Murphy. <br />
            "Protein structure and the energetics of protein stability." Chemical reviews 97.5 (1997): 1251-1268.<br />
          </a>
        </v-sheet>
      </v-card>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";
import { validationRules } from "@/utils/validationRules";
import { useNotify } from "./GlobalSnackbarStore";
import { Predict_dCp, Predict_dHu } from "@/utils/api_hub";
import Params from "@/components/Generic/DisplayParamater.vue";

export default defineComponent({
  components: { Params },
  setup() {
    const form = ref(false);

    const n_residues = ref(1);
    const n_residues_rules = [validationRules.exists, validationRules.integer, validationRules.positiveNumber];

    const loading_dCp = ref(false);
    const loading_dHu = ref(false);

    const predicted_dCp = ref(-1);
    const predicted_dHu = ref(-1);

    const notify = useNotify();

    const predict = () => {
      predict_dCp();
      predict_dHu();
    };

    const predict_dCp = async () => {
      loading_dCp.value = true;
      const res = await Predict_dCp({ n_residues: n_residues.value, molecular_weight: null });
      if (res.ok) {
        predicted_dCp.value = res.dCp;
      } else {
        predicted_dCp.value = -1;
        notify(res.message, "error", 5_000);
      }
      loading_dCp.value = false;
    };

    const predict_dHu = async () => {
      loading_dHu.value = true;
      const res = await Predict_dHu({ n_residues: n_residues.value, molecular_weight: null });
      if (res.ok) {
        predicted_dHu.value = res.dHu;
      } else {
        predicted_dHu.value = -1;
        notify(res.message, "error", 5_000);
      }
      loading_dHu.value = false;
    };

    const copyToClipBoard = async (value: string | number) => {
      try {
        await navigator.clipboard.writeText(value.toString());
        notify("Copied to clipboard", "success", 4_000);
      } catch (err) {
        console.log("failed to copy", err);
      }
    };

    return { form, n_residues, n_residues_rules, loading_dCp, loading_dHu, predicted_dCp, predicted_dHu, predict, copyToClipBoard };
  },
});
</script>
