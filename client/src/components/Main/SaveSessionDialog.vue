<template>
  <v-dialog v-model="sessionDialog" width="500px" max-width="900px" persistent>
    <v-card>
      <v-card-title class="text-h6 grey lighten-2">
        Download session
        <v-spacer />
        <v-icon class="mr-2" @click="$emit('update:dialog', false)">mdi-close</v-icon>
      </v-card-title>

      <v-card-text>
        <a ref="downloadAnchor"></a>
        <v-text-field v-model="sessionTitle" label="File name" />
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="downloadSession">Download</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { useAppData } from "@/store";
import { computed, defineComponent, ref } from "@vue/composition-api";
import { useNotify } from "../Generic/GlobalSnackbarStore";

export default defineComponent({
  props: { dialog: { type: Boolean, default: false } },
  emit: ["update:dialog"],
  setup(props, { emit }) {
    const downloadAnchor = ref(null as unknown as HTMLElement);
    const notify = useNotify();
    const appData = useAppData();

    const sessionTitle = ref("");

    const setSessionTitle = () => {
      if (appData.originFiles.length === 1) {
        const originFile = appData.originFiles[0];
        sessionTitle.value = originFile ? originFile.name.split(".")[0] : new Date().toISOString().slice(0, 10);
      } else sessionTitle.value = new Date().toISOString().slice(0, 10);
    };

    const sessionDialog = computed(() => {
      setSessionTitle();
      return props.dialog;
    });

    const downloadSession = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
      const downloadAnchorNode = downloadAnchor.value;
      const filename = (sessionTitle.value || "session") + ".json";

      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      notify("Downloaded session data", "success", 3_000);
      emit("update:dialog", false);
    };

    return { sessionTitle, sessionDialog, downloadAnchor, downloadSession };
  },
});
</script>
