const fs = require("fs");

function parseCatalogueFormat(data) {
  const sections = data.split(
    "[ **** THIS PART IS AUTOGENERATED - DO NOT EDIT *** ]"
  );
  const pages = sections[0]
    .split("\n")
    .filter((line) => line.startsWith("PAGE="))
    .map(parsePageLine);
  const items = sections[1]
    .split("\n")
    .filter((line) => line.startsWith("ITEM="))
    .map(parseItemLine);

  return { pages, items };
}

function parsePageLine(line) {
  return {
    page: getValue(line, "page"),
    catId: getValue(line, "catId"),
    catName: getValue(line, "catName"),
  };
}

function getAttributes(line) {
  const regex = /#attributes:\s*\[(.*?)\]/i;
  const match = line.match(regex);
  if (!match) {
    return {};
  }

  const attributesString = match[1];
  const attributesArray = attributesString.split(",").filter(Boolean);

  const attributes = {};
  attributesArray.forEach((attr) => {
    let [key, value] = attr.split(":");
    if (key) {
      if (key.startsWith("#")) {
        key = key.substring(1);
      }
      attributes[key.trim()] = value ? value.trim().replace(/"/g, "") : null;
    }
  });

  return attributes;
}

function parseItemLine(line) {
  return {
    prodId: getValue(line, "prodId"),
    name: getValue(line, "name"),
    type: getValue(line, "type"),
    action: getValue(line, "action"),
    catName: getValue(line, "catName"),
    catId: getValue(line, "catId"),
    catDesc: getValue(line, "catDesc"),
    roomDesc: getValue(line, "roomDesc"),
    imageBase: getValue(line, "imageBase"),
    attributes: getAttributes(line),
    width: getValue(line, "width"),
    depth: getValue(line, "depth"),
    height: getValue(line, "height"),
    itemsAllowedOnTop: getValue(line, "itemsAllowedOnTop") === "true",
    modifiable: getValue(line, "modifiable") === "true",
  };
}

function getValue(line, key) {
  const regex = new RegExp(`#${key}:\\s*"(.*?)"`, "i");
  const match = line.match(regex);

  if (match) {
    return match[1];
  }

  const fallbackRegex = new RegExp(`#${key}:\\s*([^,\\s\\]]+)`, "i");
  const fallbackMatch = line.match(fallbackRegex);

  return fallbackMatch ? fallbackMatch[1] : null;
}

fs.mkdirSync("out", {
  recursive: true,
});

let file;
if (process.argv[2]) {
  file = process.argv[2];
} else {
  file = "Catalogue_English.txt";
}

console.log(`Parsing file: ${file}`);

fs.readFile(file, "utf8", (err, data) => {
  if (err) {
    throw err;
  }

  const parsedData = parseCatalogueFormat(data);

  parsedData.pages.forEach((page) => {
    const itemsForPage = parsedData.items.filter(
      (item) => item.catId === page.catId
    );

    // Convert special characters in category name to underscores to ensure a valid filename
    const safeCategoryName = page.catName.replace(/[^a-zA-Z0-9]/g, "_");

    fs.writeFile(
      `out/${page.catId}_${safeCategoryName}.json`,
      JSON.stringify(itemsForPage, null, 2),
      (err) => {
        if (err) {
          throw err;
        }
        console.log(`Saved to ${safeCategoryName}.json!`);
      }
    );
  });

  const all = JSON.stringify(parsedData.items, null, 2);

  fs.writeFile(`out/all.json`, all, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Saved to all.json!`);
  });
});
