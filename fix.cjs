const fs = require("fs");
let c = fs.readFileSync("src/App.jsx", "utf8");

c = c.replace(
  "<CityPicker\n                  cities={prefs.preferredCities||[]}",
  "<CityPicker\n                  COLORS={COLORS}\n                  cities={prefs.preferredCities||[]}"
);

fs.writeFileSync("src/App.jsx", c);
console.log("Done!", c.includes("COLORS={COLORS}\n                  cities"));
