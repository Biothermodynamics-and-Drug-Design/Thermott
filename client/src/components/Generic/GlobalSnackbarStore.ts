import Vue from "vue";
import _Vue from "vue";

export const toast = Vue.observable({
  snackbars: [] as SnackbarModel[]
});

export interface SnackbarModel{
  id: number;
  state: boolean;
  color: string;
  timeout: number;
  text: string;
}



export function Notify(text: string, color: string, timeout= 1000){
  //if (!toast.snackbars.map(x => x.state).includes(true)) toast.snackbars = []; //cleanup function

  const snackbars = toast.snackbars as SnackbarModel[];
  
  const snackbar: SnackbarModel = {id: Number.isFinite(Math.max(...snackbars.map(x => x.id))) ? Math.max(...snackbars.map(x => x.id))+1 : 1, state: true, color: color, text: text, timeout: timeout}
  snackbars.push(snackbar);
  setTimeout(() => {filtering(snackbar)},timeout+2000);
}

function filtering(snackbar: SnackbarModel){
  const snackbars = toast.snackbars as SnackbarModel[];
  const index = snackbars.findIndex(x => x.id === snackbar.id);
  snackbars.splice(index, 1)


}

export function useNotify(){
  return Notify;
}

export function notify(Vue: typeof _Vue): void {
  Vue.prototype.$notify = Notify as (text: string, color: string, timeout?: number) => void;
}        

declare module 'vue/types/vue' {
  interface Vue {
    $notify: (text: string, color: string, timeout?: number) => void;
  }
}