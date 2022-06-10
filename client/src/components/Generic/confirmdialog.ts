import Vue from "vue";

class DialogOptions {
  color?: string = "primary";
  title?: string;
  text?: string = "Do want you want confirm?";
  width?: string | number = "500px";
  inputs?: InputSelection[] = [
    { value: true, text: "yes", color: "primary" },
    { value: false, text: "no", color: "secondary" },
  ];
}

class InputSelection {
  value: string | number | boolean;
  text: string;
  color?: string = "";
  disabled?: boolean = false;
}

export const dialogModel = Vue.observable({
  state: false,
  options: new DialogOptions(),
  resolve: {} as (value?: string | number | boolean | PromiseLike<string | number | boolean>) => void,
});

export function confirmDialog(options: DialogOptions = new DialogOptions()) {
  const newOptions = new DialogOptions();

  dialogModel.options ??= newOptions;
  options.inputs ??= newOptions.inputs;
  options.width ??= newOptions.width;
  options.title ??= newOptions.title;
  options.text ??= newOptions.text;
  options.color ??= newOptions.color;

  dialogModel.options = options;
  dialogModel.state = true;

  // console.log(options.inputs);
  // const values = options.inputs.map((x) => x.value);
  // type decison = typeof values[number];

  const promise = new Promise<string | number | boolean>((resolve) => {
    dialogModel.resolve = resolve;
  });
  console.log(promise);
  return promise;
}

export function useConfirm() {
  return confirmDialog;
}

export function closeDialog() {
  dialogModel.state = false;
  dialogModel.options = new DialogOptions();
}
