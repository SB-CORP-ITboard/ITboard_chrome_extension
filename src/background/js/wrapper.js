import { backgroundEvent } from "./index.js";

try {
  backgroundEvent();
}
catch (error) {
  console.log(error);
};