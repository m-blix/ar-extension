/* content script */
'use strict';

const version = 0.1;

let pageTitle = document.title;

console.log(`AR Extension: v${version} ('${pageTitle}')`);

let modelUrl = get3DModelFromPage();
if (modelUrl) {
  console.log(`3D model found: ${modelUrl}`);
}

/*
Extract 3D Model From html string

3DModel Schema example:
<script type="application/ld+json">
{
  "@context" : "http://schema.org/",
  "@type" : "3DModel",
  "image" : "https://images.samsung.com/us/smartphones/galaxy-note20/v1/images/galaxy-note20-thumbnail-image.jpg",
  "name" : "Samsung Galaxy Note20 Ultra 5G",
  "encoding" : [
    {
      "@type" : "MediaObject",
      "contentUrl" : "https://images.samsung.com/common/smartphones/models/galaxy-note20-ultra/galaxy-note20-ultra-mystic-bronze.glb",
      "encodingFormat" : "model/gltf-binary"
    }
  ]
}
</script>
*/
function get3DModelFromHtml(html) {
  const key = `3DModel`;
  const start = `<script type="application/ld+json">`;
  const end = `</script>`;

  let modelIndex = html.indexOf(key);
  if (modelIndex === -1) {
    console.log('no 3DModel found');
    return false;
  }

  let startIndex = html.lastIndexOf(start, modelIndex);
  if (startIndex === -1) {
    return false;
  }
  let endIndex = html.indexOf(end, startIndex);
  if (endIndex === -1) {
    return false;
  }

  let section = html.substring(startIndex+start.length, endIndex);

  console.log(section);

  let json = JSON.parse(section);

  console.log(json);

  let modelUrl = getModelUrlFromSchema(json);

  return modelUrl;
}

/*
*/
function get3DModelFromPage() {
  let scripts = document.querySelectorAll("script[type='application/ld+json']");

  let schema;
  let json;

  const key = `3DModel`;
  for (let i = 0; i < scripts.length; i++) {
    let script = scripts[i];

    let schemaText = script.innerHTML;
    if (!schemaText.includes(key))
      continue;

    schema = JSON.parse(schemaText);

    if (schema['@type'] && schema['@type'] === key) {
      console.log('found 3D model');
      json = schema;
      console.log(json);
      break;
    }
  }

  if (!json) {
    return;
  }

  let modelUrl = getModelUrlFromSchema(json);

  return modelUrl;
}

function getModelUrlFromSchema(schema) {
  let modelUrl;

  const mimeTime = 'model/gltf';

  let encodings = schema.encoding;
  for (let i = 0; i < encodings.length; i++) {
    let en = encodings[i];
    if (en.encodingFormat.startsWith('model/gltf')) {
      modelUrl = en.contentUrl;
      break;
    }
  }

  return modelUrl;
}
