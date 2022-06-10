<template>
  <v-dialog v-model="dialog" persistent max-width="720px">
    <template #activator="{ on }">
      <v-btn small depressed outlined v-on="on"> <v-icon class="mr-2" small>mdi-file-document-multiple</v-icon>Merge session files </v-btn>
    </template>

    <v-card ref="card">
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1"
        >Session merging
        <v-spacer />
        <v-btn icon @click="closeDialog()">
          <v-icon>mdi-window-close</v-icon>
        </v-btn>
      </v-card-title>
      <a ref="downloadAnchor"></a>

      <v-card-text class="pt-5">
        <v-row justify="center">
          <v-col xs="12" md="10" lg="8" xl="6">
            <template v-for="(file, index) in files">
              <div :key="index" class="d-flex align-center">
                <span>File #{{ index + 1 }}</span>
                <v-file-input v-model="files[index]" dense show-size truncate-length="50">
                  <template #[`append`]>
                    <v-btn v-if="index > 1" color="gray" icon @click="removeFile(index)"><v-icon>mdi-delete</v-icon></v-btn>
                  </template>
                </v-file-input>
              </div>
            </template>
            <v-row no-gutters class="justify-end">
              <v-btn color="green" class="mb-4" small text @click="addFile"
                ><div>Add more files</div>
                <v-icon class="mr-2">mdi-file-plus</v-icon></v-btn
              >
            </v-row>
            <v-divider class="my-4" />
            <div class="d-flex flex-row justify-end">
              <v-btn color="primary" small :disabled="files.some((x) => x === null)" @click="downloadMergedSession"
                >Merge and download</v-btn
              >
              <v-btn class="mx-2" small color="secondary" :disabled="files.some((x) => x === null)" @click="loadMergedSession"
                >Merge and load</v-btn
              >
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { AppData } from "@/models";
import { Delete_AppData, Load_Appdata, Read_AppData } from "@/utils/localStorage";
import { DownloadFile, MergeFiles } from "@/utils/utils";
import { defineComponent, ref, Ref } from "@vue/composition-api";
import { useConfirm } from "../Generic/confirmdialog";
import { useNotify } from "../Generic/GlobalSnackbarStore";

export default defineComponent({
  setup() {
    const downloadAnchor: Ref<HTMLDivElement> = ref(null);
    const notify = useNotify();
    const confirm = useConfirm();
    const dialog = ref(false);
    const files: Ref<File[]> = ref([null, null]);

    const addFile = () => files.value.push(null);

    const removeFile = (index: number) => files.value.splice(index, 1);

    const closeDialog = () => {
      dialog.value = false;
      files.value = [null, null];
    };

    const mergeFiles = async (): Promise<AppData> => {
      const appDataSessions: AppData[] = [];
      for (let index = 0; index < files.value.length; index++) {
        const file = files.value[index];

        try {
          const sessionData = JSON.parse(await file.text());
          appDataSessions.push(Read_AppData(sessionData));
        } catch (error) {
          notify("Failed reading files", "error", 5_000);
          return null;
        }
      }
      return MergeFiles(appDataSessions);
    };

    const downloadMergedSession = async () => {
      const mergedSession = await mergeFiles();
      const text = JSON.stringify(mergedSession);
      DownloadFile(text, "session.json", { anchor: downloadAnchor.value, mimetype: "data:application/json;charset=utf-8" });
    };

    const loadMergedSession = async () => {
      const res = (await confirm({ text: "Loading merged session will delete current session. Do want to continue?" })) as boolean;
      if (!res) return;
      const mergedSession = await mergeFiles();
      await Delete_AppData();
      await Load_Appdata(mergedSession);
      notify("Merged session data", "success", 8_000);
      closeDialog();
    };

    return { dialog, files, addFile, removeFile, closeDialog, downloadAnchor, downloadMergedSession, loadMergedSession };
  },
});
</script>
