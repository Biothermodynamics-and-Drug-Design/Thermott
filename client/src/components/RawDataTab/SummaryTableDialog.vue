<template>
  <v-dialog ref="dialogref" v-model="dialog" max-width="600px" persistent>
    <template #activator="{ on }">
      <v-btn x-small outlined depressed color="blue-grey darken-1" class="ma-1" v-on="on">Summary</v-btn>
    </template>

    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1 d-flex align-center">
        Summary
        <v-spacer></v-spacer>
        <v-menu right offset-y>
          <template #activator="{ on }">
            <v-btn v-model="menu" height="24" text small v-on="on">
              Export
              <v-icon size="large" class="ml-1">mdi-file-export-outline</v-icon>
            </v-btn>
          </template>

          <v-list class="denseselect" dense>
            <v-list-item dense @click="downloadTable">
              <v-list-item-title> <v-icon small class="mr-2">mdi-file-table</v-icon>Download table (CSV) </v-list-item-title>
            </v-list-item>

            <v-list-item dense @click="copyTableToClipboard">
              <v-list-item-title> <v-icon small class="mr-2">mdi-content-copy</v-icon>Copy table </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-icon class="mr-2" @click="dialog = false">mdi-close</v-icon>
      </v-card-title>

      <v-card-text ref="cardtext" class="pa-0">
        <v-data-table dense :headers="headers" :items="experimentWells" class="elevation-1">
          <template #[`header.tm_model_params.Tm`]>
            <DisplayParameter parameter="Tm" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { ExperimentWell } from "@/models";
import { defineComponent, PropType, ref } from "@vue/composition-api";
import { unparse } from "papaparse";
import { useNotify } from "@/components/Generic/GlobalSnackbarStore";
import DisplayParameter from "@/components/Generic/DisplayParamater.vue";
import { CopyToClipboard } from "@/utils/utils";

export default defineComponent({
  name: "SummaryTableDialog",
  components: { DisplayParameter },
  props: {
    experimentWells: Array as PropType<ExperimentWell[]>,
    //dialog: { type: Boolean, default: false },
  },
  setup(props) {
    const dialog = ref(false);
    const cardtext = ref(null as unknown as HTMLElement);
    const menu = ref(false);

    const notify = useNotify();

    const headers: { text: string; value: string }[] = [
      { text: "ID", value: "id" },
      { text: "Name", value: "name" },
      { text: "Tm", value: "tm_model_params.Tm" },
    ];

    const downloadTable = () => {
      const element = document.createElement("a");

      const csvTable = unparse(
        props.experimentWells.map((x) => ({
          id: x.id,
          name: x.name,
          Tm: x.tm_model_params.Tm,
        })),
        { delimiter: ",", columns: ["id", "name", "Tm"] }
      );

      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csvTable));

      element.setAttribute("download", "table.csv");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    const copyTableToClipboard = () => {
      const text = unparse(
        props.experimentWells.map((x) => ({
          id: x.id,
          name: x.name,
          Tm: x.tm_model_params.Tm,
        })),
        { delimiter: "\t", columns: ["id", "name", "Tm"] }
      );
      CopyToClipboard(text);
      notify("Copied to clipboard", "success");
    };

    return {
      dialog,
      cardtext,
      menu,
      headers,
      downloadTable,
      copyTableToClipboard,
    };
  },
});
</script>
