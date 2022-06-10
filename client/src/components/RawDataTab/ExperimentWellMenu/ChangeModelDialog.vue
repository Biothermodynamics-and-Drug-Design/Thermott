<template>
  <v-dialog :value="value" max-width="600px" persistent>
    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        Change <Param parameter="Tm" /> model
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pb-4 pt-2">
        <v-select v-model="selectedModel" :items="tmModels" hide-details outlined item-text="display_name" item-value="key" label="Model" />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          depressed
          color="primary"
          :disabled="selectedModel == null || selectedModel.trim().length == 0"
          :loading="loading"
          @click="changeModel(selectedModel)"
          >Change</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { TmModels } from "@/utils/tm_models";
import { defineComponent, computed, ref } from "@vue/composition-api";
import { useNotify } from "@/components/Generic/GlobalSnackbarStore";
import Param from "@/components/Generic/DisplayParamater.vue";
import { FitTm } from "@/utils/api_hub";
import { ActiveFluorescenceXYArray } from "@/utils/utils";
import { useAppData } from "@/store";

export default defineComponent({
  name: "ChangeModelDialog",
  components: { Param },
  props: {
    modelValue: Boolean,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const appData = useAppData();

    const notify = useNotify();

    const value = computed({
      get() {
        return props.modelValue;
      },
      set(value: boolean) {
        emit("update:modelValue", value);
      },
    });

    const experimentWells = computed(() => appData.experimentWells);
    const tmModels = computed(() => TmModels.filter((x) => x.enabled));

    const selectedModel = ref("");
    const loading = ref(false);

    const closeDialog = () => {
      selectedModel.value = "";
      loading.value = false;
      value.value = false;
    };

    const changeModel = async (model: string) => {
      const request = [];
      for (const expWell of experimentWells.value) {
        const req = {
          id: expWell.id,
          data: ActiveFluorescenceXYArray(expWell),
          tm_model: model,
        };
        request.push(req);
      }

      loading.value = true;
      const response = await FitTm(request);

      notify("Changed model and refitted data", "success", 4000);
      for (const fit of response.FitData) {
        const expWell = experimentWells.value.find((x) => x.id === fit.id);
        if (!expWell) continue;
        expWell.tm_model_params = fit.tm_params;
        expWell.tm_model_params.Model = model;
      }

      console.log(experimentWells.value);

      if (response.FitData.some((x) => x.ok == false)) {
        notify(
          `Failed to fit: ${response.FitData.filter((x) => x.ok === false)
            .map((x) => x.id)
            .join(", ")}`,
          "error",
          8000
        );
      }
      loading.value = false;
    };

    return {
      value,
      experimentWells,
      selectedModel,
      tmModels,
      loading,
      closeDialog,
      changeModel,
    };
  },
});
</script>
