<template>
  <v-dialog ref="fileDialog" v-model="dialog" persistent max-width="700">
    <template #activator="{ on }">
      <v-btn
        ref="dataUpload_btn"
        depressed
        :color="
          appData.experimentWells.length === 0 ? 'primary' : 'grey lighten-2'
        "
        :small="appData.experimentWells.length > 0"
        :large="appData.experimentWells.length === 0"
        v-on="on"
        @click="$emit('dialog-open')"
      >
        <v-icon class="mr-2" v-text="'mdi-upload'" />Upload
      </v-btn>
    </template>
    <demo-component class="mb-2" />

    <v-card>
      <v-card-title class="grey lighten-2 mb-2">
        Raw data upload
        <v-spacer></v-spacer>
        <v-icon class="mr-2" @click="closeDialog">mdi-close</v-icon>
      </v-card-title>
      <v-card-text>
        <v-row class="my-2">
          <div>
            <v-icon small class="mx-2">mdi-information</v-icon>Select data file,
            data type and press 'upload'
          </div>
          <v-spacer />
          <v-menu open-on-hover left offset-y>
            <template #activator="{ on, attrs }">
              <v-btn
                small
                rounded
                depressed
                color="gray"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon small class="mr-1">mdi-download</v-icon>Sample data
              </v-btn>
            </template>

            <v-list dense>
              <v-list-item
                v-for="(item, index) in sampleData"
                :key="index"
                :href="item.value"
              >
                <v-list-item-title v-text="item.text" />
                <v-list-item-icon
                  ><v-icon>mdi-download</v-icon></v-list-item-icon
                >
              </v-list-item>

              <v-list-item key="samplesession" @click="loadSampleSession">
                <v-list-item-title v-text="'Load sample session'" />
                <v-list-item-icon
                  ><v-icon>mdi-table-check</v-icon></v-list-item-icon
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-row>
        <v-file-input
          v-model="uploadFile"
          class="my-2"
          label="File input"
          truncate-length="40"
          show-size
          @change="checkFileType"
        ></v-file-input>
        <v-select
          v-model="selectedDataType"
          class="my-2"
          :items="rawDataTypes"
          label="File type"
          item-value="value"
          item-text="text"
          dense
        ></v-select>

        <v-select
          v-if="selectedDataType !== 'TmOnlyCSV'"
          v-model="selectedTmModel"
          class="my-2"
          :items="tmModels.filter((x) => x.enabled === true)"
          item-value="key"
          item-text="display_name"
          dense
          ><template #[`label`]>
            <Param parameter="Tm" /><span class="ml-3">model</span>
          </template>
        </v-select>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          depressed
          :loading="isUploading"
          :disabled="!uploadFile || !selectedDataType || !selectedTmModel"
          @click="RawDataUpload"
        >
          Upload
          <v-icon class="ml-2">mdi-cloud-upload</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "@vue/composition-api";
import { RawDataTypes, UploadRawData, RawUploadType } from "@/utils/api_hub";
import { TmModels } from "@/utils/tm_models";
import { useNotify } from "@/components/Generic/GlobalSnackbarStore";
import { useAppData } from "@/store";
import { useConfirm, confirmDialog } from "../Generic/confirmdialog";
import { Delete_AppData, Load_Appdata } from "@/utils/localStorage";
import { AppData, OriginFile } from "@/models";
import { getNewExperimentWellIndex } from "@/utils/utils";
import DemoComponent from "@/components/Generic/Demo/DemoCard.vue";
import Param from "@/components/Generic/DisplayParamater.vue";

export default defineComponent({
  components: { DemoComponent, Param },
  emits: ["selectExpWell", "dialog-closed"],
  setup(_, { emit }) {
    const dialog = ref(false);
    const uploadFile: Ref<File> = ref(null);

    const selectedDataType: Ref<RawUploadType> = ref(null);
    const selectedTmModel = ref("thermodynamic");

    const notify = useNotify();
    const confirm = useConfirm();
    const appData = useAppData();

    const sampleData = [
      {
        text: "Generic CSV",
        value: "/assets/sample_data/SampleData_GenericCSV_CAXIII_3ligands.csv",
      },
    ];

    const rawDataTypes = RawDataTypes;

    const tmModels = TmModels;

    const isUploading = ref(false);

    function checkFileType() {
      const file = uploadFile.value;
      if (file && file.name) {
        const splitfilename = file.name.trim().split(".");
        if (splitfilename.length > 1) {
          const ending = splitfilename[splitfilename.length - 1];
          if (ending === "rex") {
            selectedDataType.value = "RotorGeneQ_Rex";
          }
        }
      }
    }

    async function RawDataUpload() {
      const request = {
        uploadFile: uploadFile.value,
        fileType: selectedDataType.value,
        tmModel: selectedTmModel.value,
      };
      isUploading.value = true;
      const res = await UploadRawData(request);
      if (!res.ok) {
        notify(res.message, "error", 10_000);
        console.log(res.data);
      }
      isUploading.value = false;

      if (appData.experimentWells.length > 0) {
        const decision = (await confirm({
          text: "You already have data uploaded<br>How do you want to continue?",
          width: "400px",
          inputs: [
            { value: "replace", text: "replace data", color: "primary" },
            { value: "append", text: "append data", color: "accent" },
            { value: "cancel", text: "cancel", color: "grey" },
          ],
        })) as "replace" | "append" | "cancel";

        switch (decision) {
          case "replace":
            Delete_AppData();
            break;
          case "append":
            break;
          case "cancel":
            return;
          default:
            break;
        }
      }

      const newExperimentWells = res.data;
      const originFile: OriginFile = createOriginFile(uploadFile.value);
      if (appData.originFiles.length > 0) {
        originFile.id = Math.max(...appData.originFiles.map((x) => x.id)) + 1;
      }
      appData.originFiles.push(originFile);

      const failedFits: number[] = [];
      const startIndex = getNewExperimentWellIndex(appData.experimentWells);
      for (let index = 0; index < newExperimentWells.length; index++) {
        newExperimentWells[index].id = startIndex + index;
        newExperimentWells[index].file_id = originFile.id;
        if (newExperimentWells[index].tm_model_params === null) {
          failedFits.push(newExperimentWells[index].id);
        }
      }

      appData.experimentWells.push(...newExperimentWells);

      if (failedFits.length === 0) notify("Successful upload", "success", 4000);
      else notify(`Failed to fit :${failedFits.join(", ")}`, "warning", 10_000);

      if (appData.experimentWells.length > 0) {
        emit("selectExpWell", [appData.experimentWells[0]]);
      }

      closeDialog();
    }

    function closeDialog() {
      emit("dialog-closed");
      dialog.value = false;
      uploadFile.value = null;
    }

    function createOriginFile(file: File): OriginFile {
      const originFile: OriginFile = {
        id: 1,
        name: file.name,
        lastModified: file.lastModified,
        size: file.size,
        type: file.type,
        //file: btoa(await this.uploadFile.text()),
        file: null, //don't save raw file
      };
      return originFile;
    }

    async function loadSampleSession() {
      const res = (await confirmDialog({
        text: "This will clear current session data and load a sample session.<br>Do you want to continue?",
      })) as boolean;
      if (res === false) return;
      const response = await fetch(
        "/assets/sample_data/SampleSession_CAXIII_3ligands.json"
      );
      try {
        const parsedData = (await response.json()) as AppData;
        Load_Appdata(parsedData);
        closeDialog();
      } catch (error) {
        notify("Error: could not load sample session", "error", 5_000);
      }
    }

    return {
      dialog,
      rawDataTypes,
      selectedDataType,
      selectedTmModel,
      tmModels,
      sampleData,
      uploadFile,
      checkFileType,
      isUploading,
      RawDataUpload,
      closeDialog,
      loadSampleSession,
      appData,
    };
  },
});
</script>

<style scoped>
.v-file-input__text {
  font-size: 5px;
}
</style>
