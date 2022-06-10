import "./plotly-cartesian-2.9.0.min.js";
import type { newPlot, toImage } from "plotly.js";
const Plotly = window.Plotly as { newPlot: typeof newPlot; toImage: typeof toImage };
export { Plotly };
