import pkg from "../package.json";
import * as dynamicgraph from "./dynamicgraph";
import * as utils from "./utils";
import * as ordering from "./ordering";
import * as motifs from "./motifs";
import * as importers from "./importers";
import * as messenger from "./messenger";
import * as main from "./main";
import * as datamanager from "./dynamicgraphutils";
import * as analytics from "./analytics";
import * as search from "./search";
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
