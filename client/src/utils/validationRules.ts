import { isValid, parseISO } from "date-fns";

type RangeInclusivity = "[]" | "(]" | "()" | "[)";
function betweenRuleFunction(number1: number, number2: number, type: RangeInclusivity = "()") {
  const errorMessage = `Number must be in range of ${type[0]}${number1.toString()}, ${number2.toString()}${type[1]}`;
  const func = (value: number): boolean | string => {
    if (type === "[]") {
      return (value >= number1 && value <= number2) || errorMessage;
    } else if (type === "(]") {
      return (value > number1 && value <= number2) || errorMessage;
    } else if (type === "()") {
      return (value > number1 && value < number2) || errorMessage;
    } else if (type === "[)") {
      return (value >= number1 && value < number2) || errorMessage;
    }
  };
  return func;
}

function validISODateYYYYMMDD(v: string): boolean {
  const date = parseISO(v);
  if (!isValid(date)) return false;
  const split = v.split("-");
  if (split.length !== 3 || split[0].length != 4 || split[1].length != 2 || split[2].length != 2) return false;
  return true;
}

export const validationRules = {
  exists: (v: string | number) => (v !== null && (!!v || v === 0)) || "Requires input",
  between: betweenRuleFunction,
  validISODate: (v: string) => isValid(parseISO(v)) || "Invalid date (YYYY-MM-DD)",
  validISODateYYYYMMDD: (v: string) => validISODateYYYYMMDD(v) || "Invalid date (YYYY-MM-DD)",
  integer: (v: number) => Math.floor(v) === v || "Must be integer",
  positiveNumber: (v: number) => v > 0 || "Must be positive number",
  positiveOrZeroNumber: (v: number) => v >= 0 || "Must be positive number or zero",
  numeric: (v: string) => !Number.isNaN(v) || "Must be a numeric value",
};
