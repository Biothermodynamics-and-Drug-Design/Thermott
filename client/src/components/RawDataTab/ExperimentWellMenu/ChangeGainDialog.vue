<template>
  <v-dialog :value="value" max-width="600px" persistent>
    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        Change gain
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-2">
        <div class="d-flex flex-column justify-center">
          <v-select
            v-if="!(originFiles.length <= 1)"
            v-model="selectedFile"
            :items="originFiles"
            label="File"
            outlined
            hide-details
            return-object
            item-value="id"
          >
            <template #[`item`]="{ item }"> #{{ item.id }} {{ item.name }} </template>
            <template #[`selection`]="{ item }"> #{{ item.id }} {{ item.name }} </template>
          </v-select>
          <v-select
            v-model="selectedGain"
            :items="gains()"
            label="Gain"
            :disabled="selectedFile == null && originFiles.length > 1"
            outlined
            hide-details
            return-object
            item-value="id"
            class="my-3"
          >
            <template #[`item`]="{ item }"> {{ item.id }} {{ item.name }} </template>
            <template #[`selection`]="{ item }"> #{{ item.id }} {{ item.name }} </template>
          </v-select>
          <v-btn
            outlined
            depressed
            color="blue-grey darken-1"
            :disabled="selectedGain == null || loading"
            :loading="loading"
            @click="changeGain"
            >Apply
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "@vue/composition-api";
import { Fluorescence } from "@/models";
import { Notify } from "@/components/Generic/GlobalSnackbarStore";
import { ActiveFluorescenceXYArray } from "@/utils/utils";
import { FitTm } from "@/utils/api_hub";
import { useAppData } from "@/store";

export default defineComponent({
  name: "ChangeGainDialog",
  components: {},
  props: {
    modelValue: Boolean,
  },
  emits: ["update:modelValue", "update:gain"],
  setup(props, { emit }) {
    const appData = useAppData();
    const originFiles = computed(() => appData.originFiles);
    const selectedFile = ref(originFiles.value[0]);
    const selectedGain = ref(null as Fluorescence);
    const loading = ref(false);

    const value = computed({
      get() {
        return props.modelValue;
      },
      set(value: boolean) {
        emit("update:modelValue", value);
      },
    });

    const gains = () => {
      if (selectedFile.value == null && originFiles.value.length === 1) selectedFile.value = originFiles.value[0];
      if (selectedFile.value == null && originFiles.value.length > 1) return [];

      const fluorescence = appData.experimentWells.find((x) => x.file_id == selectedFile.value.id).fluorescence;
      return fluorescence;
    };

    const changeGain = async () => {
      //if (this.selectedFile == null && this.originFiles.length == 1 ) this.selectedFile = this.originFiles[0];
      if (selectedGain.value == null || selectedFile.value == null) return Notify("Failed changing gain", "error", 7_000);

      const experimentWells = appData.experimentWells.filter((x) => x.file_id == selectedFile.value.id);

      if (experimentWells.length == 0) return Notify("Failed changing gain", "error", 7_000);

      loading.value = true;

      for (const expWell of experimentWells) {
        expWell.active_gain = selectedGain.value.id;
      }

      const request = experimentWells.map((x) => ({ id: x.id, data: ActiveFluorescenceXYArray(x), tm_model: x.tm_model_params.Model }));

      const response = await FitTm(request);
      if (response.ok == false) {
        loading.value = false;
        return;
      }
      const failedFits = response.FitData.filter((x) => x.ok == false);
      //const okFits = response.FitData.filter(x => x.ok == true);
      for (const fit of response.FitData) {
        experimentWells.find((x) => x.id === fit.id).tm_model_params = fit.tm_params;
      }
      if (failedFits.length == 0) {
        Notify("Refitted data", "success", 7_000);
      } else {
        Notify(`Failed to refit: ${failedFits.map((x) => x.id).join(", ")}`, "error", 12_000);
      }
      emit("update:gain");
      loading.value = false;
    };

    const closeDialog = () => {
      value.value = false;
      selectedGain.value = null;
      selectedFile.value = originFiles.value[0];
    };

    return {
      value,
      originFiles,
      selectedFile,
      selectedGain,
      loading,
      gains,
      changeGain,
      closeDialog,
    };
  },
});
</script>
