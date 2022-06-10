<template>
  <div>
    <v-dialog v-model="_dialog">
      <template #activator="{ on, attrs }">
        <v-btn rounded small depressed v-bind="attrs" v-on="on">Version {{ versionFile.CurrentVersion }}</v-btn>
        <!-- <slot name="activator" :on="on" v-bind="attrs" v-on="on"></slot> -->
      </template>
      <v-card-title class="grey lighten-2">Changelog</v-card-title>
      <v-list v-if="versionFile" dense>
        <v-list-item v-for="(changelog, index) in versionFile.Changelog.slice().reverse()" :key="index" dense>
          <v-list-item-content dense>
            <v-list-item-title class="align-center text-h6">
              {{ changelog.VersionChange.split("->")[0] }}
              <v-icon class="mb-1">mdi-chevron-right</v-icon>
              {{ changelog.VersionChange.split("->")[1] }}
            </v-list-item-title>
            <v-list-item-subtitle class="subtitle-2">
              <div v-for="(description, index2) in changelog.Description" :key="index2">
                <v-icon x-small class="mb-1 mr-2">mdi-checkbox-blank-circle</v-icon> {{ description }}
              </div>
            </v-list-item-subtitle>
            <v-divider v-if="index !== versionFile.Changelog.length - 1" class="mt-2" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "@vue/composition-api";
import { versionFile } from "./Changelog";

export default defineComponent({
  props: { dialog: { type: Boolean, default: false } },
  emits: ["update-dialog"],
  setup(props, { emit }) {
    const _dialog = computed({
      get(): boolean {
        return props.dialog;
      },
      set(newValue: boolean) {
        emit("update-dialog", newValue);
      },
    });

    const showDialog = () => {
      _dialog.value = true;
    };

    return { _dialog, versionFile, showDialog };
  },
});
</script>
