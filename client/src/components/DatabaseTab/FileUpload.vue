<template>
  <v-dialog v-model="dialogModel" width="900px" persistent>
    <template #activator="{ on, attrs }">
      <v-btn color="accent" dark small depressed v-bind="attrs" v-on="on"> Bulk file upload <v-icon>mdi-upload-multiple</v-icon> </v-btn>
    </template>
    <v-card>
      <v-card-title class="grey lighten-2">
        File upload
        <v-spacer />
        <v-icon @click="dialogModel = false">mdi-close</v-icon>
      </v-card-title>
      <v-card-text class="pa-2">
        <v-chip color="grey lighten-3" class="mb-2">Database {{ submissionModel.databaseInfo.name }}</v-chip>
        <div v-if="fileStatus.length === 0" class="d-flex flex-row align-center">
          <v-file-input
            v-model="files"
            label="files"
            outlined
            multiple
            chips
            append-outer-icon="mdi-upload"
            @click:append-outer="uploadFiles"
          />
        </div>
        <div v-else>
          Results
          <v-sheet outlined>
            <v-list>
              <v-list-item v-for="(item, index) in fileStatus" :key="index">
                <v-list-item-icon>
                  <v-icon v-if="item.loading" class="mdi-spin">mdi-loading</v-icon>
                  <template v-else>
                    <v-icon :color="item.ok ? 'success' : 'error'" v-text="item.ok ? 'mdi-check' : 'mdi-alert-circle'" />
                  </template>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="text-subtitle-1" style="white-space: normal" v-text="item.file.name" />
                  <v-list-item-subtitle v-if="item.duplicates.length == 0">
                    type: {{ item.file.type }} | modified: {{ new Date(item.file.lastModified).toDateString() }}| size:
                    {{ (item.file.size / (1024 * 1024)).toFixed(2) }} mb
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-else class="d-flex flex-row flex-wrap align-center">
                    <span class="error--text">Duplicates</span>
                    <view-database-item-bttn
                      v-for="dup in item.duplicates"
                      :key="dup.id"
                      :database-link="`${submissionModel.databaseInfo.dbLink}`"
                      :item="dup"
                    />
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "@vue/composition-api";
import { DatabasePageModel } from "./database";
import * as DB from "./database";
import ViewDatabaseItemBttn from "./ViewDatabaseItemBttn.vue";
import { DownloadDbTable } from "./databaseFunc";

export default defineComponent({
  components: { ViewDatabaseItemBttn },
  props: { submissionModel: Object as PropType<DatabasePageModel>, dialog: { type: Boolean, default: false } },
  emits: ["update:dialog"],
  setup(props, { emit }) {
    const dialogModel = computed({
      get: () => props.dialog,
      set: (value: boolean) => emit("update:dialog", value),
    });

    const files = ref([] as File[]);
    const fileStatus = ref([] as { loading: boolean; ok: boolean; file: File; duplicates: DB.File[] }[]);

    watch(dialogModel, () => {
      fileStatus.value = [];
    });

    const uploadFiles = async () => {
      const auth = "Basic " + btoa(`${props.submissionModel.auth.username}:${props.submissionModel.auth.password}`);

      // const getSettings = {
      //   method: "GET",
      //   headers: { Authorization: auth },
      // };

      for (let index = 0; index < files.value.length; index++) {
        const form = new FormData();
        const file = files.value[index];

        form.append(`column:file:0.content`, file);
        form.append(`action:file:0`, "insert");
        form.append("Save", "Save");

        const postSettings = {
          method: "POST",
          headers: { Authorization: auth },
          body: form,
        };

        const status = { loading: true, file: file, ok: false, duplicates: [] as DB.File[] };
        fileStatus.value.push(status);

        const url = props.submissionModel.databaseInfo.apiLink;
        const dup_res = (await DownloadDbTable(url, "file", props.submissionModel.auth, {
          filter: `((file_name CONTAINS "${encodeURIComponent(file.name)}") OR (uri CONTAINS "${encodeURIComponent(file.name)}"))`,
        })) as DB.File[];
        status.duplicates = dup_res;

        if (status.duplicates.length > 0) {
          status.loading = false;
          status.ok = false;
          continue;
        }

        try {
          const res = await fetch(`${url}/file`, postSettings);
          status.loading = false;
          if (res.ok) {
            status.ok = true;
          }
        } catch (error) {
          status.loading = false;
          status.ok = false;
        }
      }
      files.value = [];
    };
    return { uploadFiles, files, fileStatus, dialogModel };
  },
});
</script>
