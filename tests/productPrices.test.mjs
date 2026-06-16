import assert from "node:assert/strict";

import * as productUtils from "../src/lib/productUtils.js";

const { getProductPrice } = productUtils;

assert.equal(typeof getProductPrice, "function", "getProductPrice should be exported");

assert.equal(
  getProductPrice({ Name: "Gorosei skull tee", category: "tshirts", Price: 2000 }),
  650,
  "tshirts should cost KSh 650"
);

assert.equal(
  getProductPrice({ Name: "Anime hockey jersey", category: "tshirts", Price: 2000 }),
  1250,
  "hockey jerseys should cost KSh 1,250"
);

assert.equal(
  getProductPrice({ Name: "Light jacket", category: "jackets", Price: 2000 }),
  1500,
  "light jackets should cost KSh 1,500"
);

assert.equal(
  getProductPrice({ Name: "Heavy jacket", category: "jackets", Price: 1500 }),
  2000,
  "heavy jackets should cost KSh 2,000"
);

assert.equal(
  getProductPrice({ Name: "Varsity jacket", category: "jackets", Price: 1500 }),
  2000,
  "varsity jackets should cost KSh 2,000"
);

assert.equal(
  getProductPrice(null),
  650,
  "missing products should fall back to the tshirt/base price"
);
