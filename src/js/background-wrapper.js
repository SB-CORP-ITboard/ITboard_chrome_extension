import { backgroundEvent } from "./background.js";

try {
  backgroundEvent();
}
catch (error) {
  console.log(error);
};