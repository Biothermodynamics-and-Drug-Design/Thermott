<template>
  <v-container>
    <div class="d-flex justify-space-between mb-3">
      <div class="d-flex flex-row">
        <v-btn small depressed color="secondary" :href="submissionModel.databaseInfo.dbLink + '/file'" target="_blank" class="mx-1"
          >Upload file from DB website<v-icon>mdi-upload</v-icon>
        </v-btn>
        <file-upload :dialog.sync="fileDialog" :submission-model.sync="submissionModel" class="mx-1" />
      </div>
      <v-btn small depressed color="primary" @click="submissionModel.step = 5">Next <v-icon>mdi-chevron-right</v-icon> </v-btn>
    </div>

    <v-divider class="mt-2 mb-4" />
    <div class="d-flex justify-end">
      <v-btn color="secondary" x-small depressed class="mb-4" @click="findAllFiles">Find all files</v-btn>
    </div>

    <div class="d-flex flex-column">
      <div>(Analysis file) JSON</div>
      <div
        v-if="submissionModel.analysisFile && submissionModel.analysisFile.sessionFileName"
        class="d-flex flex-row justify-space-between"
      >
        <div>{{ submissionModel.analysisFile.sessionFileName }}</div>
        <v-btn color="secondary" x-small depressed @click="findFile(submissionModel.analysisFile.sessionFileName)">Find file</v-btn>
      </div>
      <div>
        <v-autocomplete
          v-if="submissionModel.analysisFile"
          v-model="submissionModel.analysisFile.file"
          outlined
          :height="inputHeight"
          :search-input.sync="searchStrings[0]"
          :items="submissionModel.dbData.file"
          return-object
          dense
          item-text="label"
          item-value="id"
          class="grey--text text--darken-1 my-3"
          label="File"
          :rules="objectRules"
          :filter="fileFilter"
        >
          <template #selection="data">
            <div class="d-flex flex-column">
              <div>({{ data.item.id }}) {{ data.item.file_name }}</div>
              <div>uri:{{ data.item.uri }}</div>
            </div>
          </template>
          <template #item="data">
            <div class="d-flex flex-column">
              <div>({{ data.item.id }}) {{ data.item.file_name }}</div>
              <div>uri:{{ data.item.uri }}</div>
            </div>
          </template>
        </v-autocomplete>
      </div>
    </div>

    <v-divider class="mt-2 mb-4" />

    <div v-for="(file, index) in submissionModel.files" :key="index" class="my-2">
      <div class="d-flex flex-row justify-space-between">
        <div>(Raw file) {{ display_fileRequest(file) }}</div>
        <v-btn color="secondary" x-small depressed @click="findFile(file.name)">Find file</v-btn>
      </div>
      <v-autocomplete
        v-if="submissionModel.files[index]"
        v-model="submissionModel.files[index].file"
        outlined
        :height="inputHeight"
        :items="submissionModel.dbData.file"
        :search-input.sync="searchStrings[index + 1]"
        return-object
        dense
        item-text="label"
        item-value="id"
        class="grey--text text--darken-1 my-3"
        label="File"
        :rules="objectRules"
        :filter="fileFilter"
      >
        <template #selection="data">
          <div class="d-flex flex-column">
            <div>({{ data.item.id }}) {{ data.item.file_name }}</div>
            <div>uri:{{ data.item.uri }}</div>
          </div>
        </template>
        <template #item="data">
          <div class="d-flex flex-column">
            <div>({{ data.item.id }}) {{ data.item.file_name }}</div>
            <div>uri:{{ data.item.uri }}</div>
          </div>
        </template>
      </v-autocomplete>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, ref, watch } from "@vue/composition-api";
import { validationRules } from "@/utils/validationRules";
import * as DB from "./database";
import FileUpload from "./FileUpload.vue";
import { Notify } from "../Generic/GlobalSnackbarStore";
import { DownloadDbTable } from "./databaseFunc";

export default defineComponent({
  components: { FileUpload },
  props: { submissionModel: Object as PropType<DB.DatabasePageModel> },
  emits: ["update:submissionModel"],
  setup(props) {
    const originFiles = computed(() => props.submissionModel.session.originFiles);

    const objectRules = [validationRules.exists];

    const searchStrings: Ref<Record<number, string>> = ref({ 0: "" });
    const loading: Ref<Record<number, boolean>> = ref({ 0: false });

    const timeout = ref(null);

    const searchDatabaseFile = async (searchString: string) => {
      const filter = `((file_name CONTAINS "${encodeURI(searchString)}") OR (uri CONTAINS "${encodeURI(searchString)}"))`;
      const results = (await DownloadDbTable(props.submissionModel.databaseInfo.apiLink, "file", props.submissionModel.auth, {
        format: "csv",
        rows: 5,
        filter: filter,
      })) as DB.File[];
      for (const file of results) {
        const index = props.submissionModel.dbData.file.findIndex((x) => x.id == file.id);
        if (index > -1) {
          props.submissionModel.dbData.file[index] = file;
        } else {
          props.submissionModel.dbData.file.push(file);
        }
      }
    };

    watch(
      searchStrings.value,
      async (newSearch) => {
        if (timeout.value) {
          clearTimeout(timeout.value);
        }

        timeout.value = setTimeout(async () => {
          for (const key in newSearch) {
            if (Object.prototype.hasOwnProperty.call(newSearch, key)) {
              const searchString = newSearch[key];
              if (searchString == null || searchString.toString().length == 0) continue;
              loading.value[key] = true;
              const filter = `((file_name CONTAINS "${encodeURI(searchString)}") OR (uri CONTAINS "${encodeURI(searchString)}"))`;
              const results = (await DownloadDbTable(props.submissionModel.databaseInfo.apiLink, "file", props.submissionModel.auth, {
                filter: filter,
              })) as DB.File[];
              console.log(results);
              loading.value[key] = false;

              for (const file of results) {
                const index = props.submissionModel.dbData.file.findIndex((x) => x.id == file.id);
                if (index > -1) {
                  props.submissionModel.dbData.file[index] = file;
                } else {
                  props.submissionModel.dbData.file.push(file);
                }
              }

              for (const key in loading.value) {
                if (Object.prototype.hasOwnProperty.call(loading.value, key)) {
                  loading.value[key] = false;
                }
              }
            }
          }
        }, 800);
      },
      { deep: true }
    );

    //const filesLoading = ref(false);

    const display_files = (file: DB.File) => {
      return `(${file.id}) ${file.file_name}`;
    };

    const display_fileRequest = (file: DB.FileRequest) => {
      return `(${file.id}) ${file.name}`;
    };

    const fileDialog = ref(false);

    const setFile = (filename: string, file: DB.File) => {
      if (filename == props.submissionModel.analysisFile.sessionFileName) {
        props.submissionModel.analysisFile.file = file;
      } else {
        const index = props.submissionModel.files.findIndex((x) => x.name == filename);
        if (index > -1) props.submissionModel.files[index].file = file;
      }
    };

    const findFile = async (fileName: string) => {
      let searchLocalFile = props.submissionModel.dbData.file.find((x) => x.file_name == fileName);
      if (searchLocalFile != null) {
        setFile(fileName, searchLocalFile);
        Notify("File found", "success");
        //if (rawFileIndex > -1) props.submissionModel.files[rawFileIndex].file = searchLocal;
      } else {
        await searchDatabaseFile(fileName);

        searchLocalFile = props.submissionModel.dbData.file.find((x) => x.file_name == fileName);
        if (searchLocalFile != null) {
          setFile(fileName, searchLocalFile);
          Notify("File found", "success");
        } else {
          Notify("File not found", "error");
        }
      }
    };

    const findAllFiles = () => {
      for (const file of props.submissionModel.files) {
        findFile(file.name);
      }
      if (props.submissionModel.analysisFile.sessionFileName) findFile(props.submissionModel.analysisFile.sessionFileName);
    };

    const inputHeight = 60;

    const fileFilter = (file: DB.File, queryText: string) => `${file.id} ${file.file_name} ${file.uri}`.includes(queryText);

    return {
      originFiles,
      objectRules,
      loading,
      fileDialog,
      searchStrings,
      findFile,
      findAllFiles,
      inputHeight,
      display_files,
      display_fileRequest,
      fileFilter,
    };
  },
});
</script>
