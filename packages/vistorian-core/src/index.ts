import pkg from "../package.json";
import * as dynamicgraph from "./data/dynamicgraph";
import * as utils from "./data/utils";
import * as ordering from "./data/ordering";
import * as motifs from "./data/motifs";
import * as importers from "./data/importers";
import * as messenger from "./data/messenger";
import * as main from "./data/main";
import * as datamanager from "./data/dynamicgraphutils";
import * as analytics from "./data/analytics";
import * as search from "./data/search";
import * as colors from "./ui/colors";
import * as BSpline from "./ui/BSpline";
import * as glutils from "./ui/glutils";
import * as legend from "./ui/legend";
import * as rangeslider from "./ui/rangeslider";
import * as slider from "./ui/slider";
import * as smartslider from "./ui/smartslider";
import * as timeline from "./ui/timeline";
import * as timeslider from "./ui/timeslider";
import * as ui from "./ui/ui";
export {
  dynamicgraph,
  utils,
  ordering,
  motifs,
  messenger,
  main,
  importers,
  datamanager,
  analytics,
  search,
  colors,
  BSpline,
  glutils,
  legend,
  rangeslider,
  slider,
  smartslider,
  timeline,
  timeslider,
  ui,
};

const version = pkg.version;
