<template>
  <v-dialog v-model="dialog" max-width="900px">
    <template #activator="{ on }">
      <v-btn small depressed outlined v-on="on">
        <v-icon class="mx-1 my-1">mdi-playlist-star</v-icon>Binding model
        presets
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1"
        >Binding model presets
        <v-spacer />
        <v-btn icon @click="closeDialog()">
          <v-icon>mdi-window-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-container>
          <div v-show="!presetCard">
            <v-row class="px-2">
              <v-spacer />
              <v-btn
                color="primary"
                class="my-1"
                x-small
                depressed
                @click.stop="startCreatePreset"
                v-text="'Create new preset'"
              />
            </v-row>
          </div>
          <v-card v-show="presetCard" outlined elevation="0" my-1>
            <v-form ref="form" v-model="formModel">
              <v-card-title class="grey lighten-2 text-subtitle-2 py-1 pr-0">
                {{ presetIsEditing ? "Edit preset" : "Create preset" }}
                <v-spacer />
                <v-btn
                  depressed
                  class="mx-1"
                  color="gray"
                  x-small
                  @click.stop="cancelPreset"
                >
                  <v-icon small>mdi-cancel</v-icon>
                </v-btn>
                <v-btn
                  :disabled="!formModel"
                  class="mx-1"
                  depressed
                  color="primary"
                  x-small
                  @click.stop="
                    presetIsEditing ? finishEditPreset() : finishNewPreset()
                  "
                >
                  <v-icon small>mdi-check-bold</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text class="py-0">
                <div class="d-flex flex-wrap pt-3 align-center">
                  <v-text-field
                    v-model="newPreset.protein"
                    outlined
                    class="px-1 small_input"
                    dense
                    label="protein"
                    :rules="presetIsEditing ? rules_editing : rules_new"
                  />
                  <v-combobox
                    v-model="newPreset.protein_aliases"
                    dense
                    outlined
                    label="Alternative aliases"
                    :rules="[checkAliasRules]"
                    multiple
                  >
                    <template #no-data>
                      <v-list-item>
                        <v-list-item-content class="py-0">
                          <v-list-item-title>
                            Press
                            <kbd
                              >enter<v-icon x-small dark
                                >mdi-subdirectory-arrow-left</v-icon
                              ></kbd
                            >
                            to create a new one
                          </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </template>

                    <template #selection="data">
                      <v-chip
                        :key="data.item"
                        close
                        dense
                        small
                        @click:close="removeAlias(data.item)"
                      >
                        {{ data.item }}
                      </v-chip>
                    </template>
                  </v-combobox>
                </div>

                <div class="d-flex flex-wrap pt-1">
                  <v-text-field
                    v-model.number="newPreset.DuH_Tr"
                    class="px-1 small_input"
                    outlined
                    dense
                    label="Unfolding enthalpy"
                    suffix="J/mol"
                  >
                    <template #prepend-inner
                      ><Param parameter="DuH_Tr" class="text-subtitle-2 mr-2"
                    /></template>
                  </v-text-field>
                  <v-text-field
                    v-model.number="newPreset.DuCp"
                    class="px-1 small_input"
                    outlined
                    dense
                    label="Unfolding heat capacity"
                    suffix="J/(mol⋅K)"
                  >
                    <template #prepend-inner
                      ><Param parameter="DuCp" class="text-subtitle-2 mr-2"
                    /></template>
                  </v-text-field>
                  <v-text-field
                    v-model.number="newPreset.DbH_T0"
                    class="px-1 small_input"
                    outlined
                    dense
                    label="Binding enthalpy"
                    suffix="J/mol"
                  >
                    <template #prepend-inner
                      ><Param parameter="DbH_T0" class="text-subtitle-2 mr-2"
                    /></template>
                  </v-text-field>
                  <v-text-field
                    v-model.number="newPreset.DbCp"
                    class="px-1 small_input"
                    outlined
                    dense
                    label="Binding heat capacity"
                    suffix="J/(mol⋅K)"
                  >
                    <template #prepend-inner
                      ><Param parameter="DbCp" class="text-subtitle-2 mr-2"
                    /></template>
                  </v-text-field>
                </div>
              </v-card-text>
            </v-form>
          </v-card>
        </v-container>
        <v-divider />
        <v-data-table
          dense
          :headers="headers"
          :items="bindingParamPresets"
          class="elevation-0"
        >
          <template #[`item.protein_aliases`]="{ item }">
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on">{{
                  aliasesTruncate(item.protein_aliases, true)
                }}</span>
              </template>
              <span>{{ aliasesTruncate(item.protein_aliases, false) }}</span>
            </v-tooltip>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              icon
              :disabled="presetIsEditing"
              @click.stop="startEditPreset(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              :disabled="presetIsEditing"
              @click.stop="deletePreset(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template #[`header.DuH_Tr`]><Param parameter="DuH_Tr" /></template>
          <template #[`header.DuCp`]><Param parameter="DuCp" /></template>
          <template #[`header.DbH_T0`]><Param parameter="DbH_T0" /></template>
          <template #[`header.DbCp`]><Param parameter="DbCp" /></template>
        </v-data-table>
        <v-divider />
        <v-card-actions>
          <v-btn
            x-small
            depressed
            outlined
            color="blue-grey darken-1"
            @click="loadDefaultBindingModelPresets"
          >
            <v-icon small class="mr-2">mdi-refresh</v-icon>
            Reload server defaults
          </v-btn>

          <v-btn
            x-small
            depressed
            outlined
            color="blue-grey darken-1"
            @click="downloadPresetsJSON"
          >
            <v-icon small class="mr-2">mdi-download</v-icon>
            Downloads presets
          </v-btn>
          <v-btn
            x-small
            depressed
            outlined
            color="blue-grey darken-1"
            @click="uploadPresetsClick"
          >
            <v-icon small class="mr-2">mdi-upload</v-icon>
            Import presets
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
    <input
      id="fileinputpresets"
      type="file"
      hidden
      style="height: 0px; width: 0px"
      @change="uploadPresets"
    />
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from "@vue/composition-api";
import * as Preset from "./BindingParamPresetsFunc";
import Param from "@/components/Generic/DisplayParamater.vue";
import { SaveAppSetting_LocalStorage } from "@/utils/localStorage";
import { useConfirm } from "../Generic/confirmdialog";
import { useAppData, useAppSettings } from "@/store";
import { BindingThermodynamicPreset } from "@/models";
import { DownloadFile } from "@/utils/utils";

export default defineComponent({
  components: { Param },
  setup() {
    const dialog = ref(false);
    const presetCard = ref(false);
    const presetIsEditing = ref(false);
    const presetCardTitle = ref("");
    const formModel = ref(false);
    const formComponent: any = ref(null);

    const form: Ref<any> = ref(null);

    const confirm = useConfirm();

    const newPreset: Ref<BindingThermodynamicPreset> = ref({
      id: 0,
      protein: "",
      protein_aliases: [],
      DuH_Tr: 100_000,
      DuCp: 3_500,
      DbCp: -200,
      DbH_T0: -10_000,
    });

    const appData = useAppData();
    const appSettings = useAppSettings();

    const headers = [
      { text: "#", value: "id" },
      { text: "Protein", value: "protein" },
      { text: "Aliases", value: "protein_aliases" },
      { text: "DuH_Tr", value: "DuH_Tr" },
      { text: "DuCp", value: "DuCp" },
      { text: "DbH_T0", value: "DbH_T0" },
      { text: "DbCp", value: "DbCp" },
      { text: "", value: "actions" },
    ];

    const rules_new: ((value: string) => boolean | string)[] = [
      Preset.CheckUniqueProtein,
      (value: string) => value.trim().length !== 0 || "No protein name",
    ];
    let rules_editing: ((value: string) => string | boolean)[] = [];

    //const aliasRules: Function[] = [checkAliasRules];

    //const illegalAliases: string[] = [];
    //aliasesTruncate;

    function aliasesTruncate(aliases: string[], truncate = false): string {
      const joined = aliases.join(", ");
      if (!truncate) return joined;
      if (joined.length > 12) return joined.slice(0, 24) + "...";
      return joined;
    }

    async function downloadPresetsJSON(): Promise<void> {
      const presetsData = Object.assign([], appSettings.BindingParamPresets);
      const downloadData: JSONPresets = {
        version: appData.sessionInfo.currentClientVersion,
        presets: presetsData,
      };
      const downloadDataString = JSON.stringify(downloadData);

      DownloadFile(downloadDataString, "preset.json");
    }

    async function uploadPresetsClick(): Promise<void> {
      const fileinput = document.getElementById("fileinputpresets");
      fileinput.click();
    }

    async function uploadPresets(e: any): Promise<void> {
      const file = e.target.files[0] as File;
      const reader = new FileReader();
      reader.readAsText(file);
      console.log(appSettings.BindingParamPresets);
      let text_data = null;
      reader.onload = function () {
        text_data = reader.result.toString();
        const parsedData = JSON.parse(text_data) as JSONPresets;
        if (parsedData?.presets) {
          for (let index = 0; index < parsedData.presets.length; index++) {
            const element = parsedData.presets[index];
            element.id = index + 1;
          }
          appSettings.BindingParamPresets = parsedData.presets;
        }
        SaveAppSetting_LocalStorage();
      };
    }

    async function loadDefaultBindingModelPresets() {
      await loadDefaultBindingModelPresets();
    }

    function rules_editing_func(
      protein: string
    ): ((value: string) => boolean | string)[] {
      const func = (value: string) => {
        if (value === protein) return true;
        else return Preset.CheckUniqueProtein(value);
      };
      return [
        func,
        (value: string) => value.trim().length !== 0 || "No protein name",
      ];
    }

    function checkAliasRules(): boolean | string {
      const protein = newPreset.value.protein.toLowerCase().trim();
      const alias_list = newPreset.value.protein_aliases
        ? newPreset.value.protein_aliases.map((x) => x.toLowerCase().trim())
        : [];

      const checkAliasFunction = Preset.CheckUniqueAliasFunction(
        presetIsEditing.value ? newPreset.value.id : null
      );
      for (
        let index = 0;
        index < newPreset.value.protein_aliases.length;
        index++
      ) {
        const alias = newPreset.value.protein_aliases[index]
          .toLowerCase()
          .trim();

        if (alias === protein) return "Same as protein name";
        if (alias_list.filter((x) => x === alias).length > 1)
          return "Duplicate alias";

        if (!checkAliasFunction(alias, presetIsEditing.value))
          return "Duplicate alias from other preset";
        // else return "Not unique alias";
      }
      return true;
    }

    const bindingParamPresets = computed(() => appSettings.BindingParamPresets);

    function removeAlias(alias: string) {
      const index = newPreset.value.protein_aliases.findIndex(
        (x) => x === alias
      );
      newPreset.value.protein_aliases.splice(index, 1);
    }

    function startCreatePreset() {
      presetIsEditing.value = false;
      resetNewPreset();
      presetCard.value = true;
      formModel.value = false;
    }

    function finishNewPreset() {
      Preset.Create(newPreset.value);
      presetCard.value = false;
      resetNewPreset();
    }

    async function deletePreset(preset: BindingThermodynamicPreset) {
      const res = (await confirm({
        text: "Are you sure you want to delete this preset?",
      })) as boolean;
      if (res) {
        Preset.Delete(preset);
      }
    }

    function cancelPreset() {
      presetCard.value = false;
      resetNewPreset();
      presetIsEditing.value = false;
    }

    async function startEditPreset(preset: BindingThermodynamicPreset) {
      rules_editing = [];
      presetCard.value = false;
      resetNewPreset();

      presetIsEditing.value = true;
      newPreset.value = Object.assign({}, preset);
      rules_editing = rules_editing_func(newPreset.value.protein);
      // aliasRules_editing = [
      //   aliasRules_new[0],
      //   (value:string) => Preset.CheckUniqueProtein(value, preset.protein_aliases),
      //   ];
      presetCard.value = true;
      formModel.value = false;
      form.value.resetValidation();
    }

    function finishEditPreset() {
      Preset.Edit(newPreset.value);
      rules_editing = [];
      presetCard.value = false;
      presetIsEditing.value = false;
      resetNewPreset();
    }

    function resetNewPreset() {
      newPreset.value = {
        id: 0,
        protein: "",
        protein_aliases: [],
        DuH_Tr: 100_000,
        DuCp: 3_500,
        DbCp: -200,
        DbH_T0: -10_000,
      };
    }

    function closeDialog() {
      dialog.value = false;
      presetCard.value = false;
    }

    return {
      bindingParamPresets,
      uploadPresetsClick,
      downloadPresetsJSON,
      uploadPresets,
      loadDefaultBindingModelPresets,
      rules_editing_func,
      removeAlias,
      startCreatePreset,
      finishNewPreset,
      deletePreset,
      form,
      presetCardTitle,
      formComponent,
      cancelPreset,
      startEditPreset,
      presetIsEditing,
      newPreset,
      closeDialog,
      finishEditPreset,
      aliasesTruncate,
      rules_new,
      rules_editing,
      checkAliasRules,
      headers,
      formModel,
      presetCard,
      dialog,
    };
  },
});

interface JSONPresets {
  version: string;
  presets: BindingThermodynamicPreset[];
}
</script>

<style scoped>
.v-text-field >>> input {
  font-size: 0.9em;
  font-weight: 400;
  text-transform: capitalize;
}

.v-text-field >>> div .v-text-field__suffix {
  font-size: 0.8em;
  font-weight: 400;
  opacity: 0.95;
}
.v-input {
  width: 9%;
}

.v-list-item {
  min-height: 24px;
}
</style>
