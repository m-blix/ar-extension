/* content script */
'use strict';

const VERSION = 0.1;
let pageTitle = document.title;
console.log(`AR Extension: v${VERSION} ('${pageTitle}')`);

const VIEW_BASE_URL = 'https://m-blix.github.io/share-poc/?url=';

const CORRECT_LEVEL = QRCode.CorrectLevel.L;
let qrCode;

let uiEl, qrEl, msgEl;


function setupUI() {
  uiEl = document.createElement('div');
  uiEl.id = 'arext-ui';
  qrEl = document.createElement('div');
  qrEl.id = 'arext-qrc';
  uiEl.appendChild(qrEl);
  msgEl = document.createElement('h1');
  msgEl.id = 'arext-msg';
  msgEl.textContent = 'Scan to View Model';
  uiEl.appendChild(msgEl);

  qrEl.addEventListener('dblclick', function(ev){
    window.open(qrEl.dataset.url, '_blank');
  });
}

function load() {
  setupUI();

  let modelUrl = get3DModelFromPage();
  if (modelUrl) {
    console.log(`3D model found (schema): ${modelUrl}`);
  }
  if (!modelUrl) {
    modelUrl = getModelFromModelViewer();
    if (modelUrl) {
      console.log(`3D model found (model-viewer): ${modelUrl}`);
    }
  }
  if (!modelUrl) {
    modelUrl = getModelFromGoogleSearch();
    if (modelUrl) {
      console.log(`3D model found (google-search): ${modelUrl}`);
    }
  }

  if (modelUrl) {
    console.log('generating QR Code, adding to page');

    let url = VIEW_BASE_URL+modelUrl;

    generateQRCode(url);
    qrEl.dataset.url = url;

    document.body.appendChild(uiEl);
  } else {
    console.log('no 3D model found');
  }
}

load();

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

/*
Example:
<model-viewer src="model.glb" ar camera-controls alt="model"></model-viewer>
*/

function getModelFromModelViewer() {
  let modelViewerTags = document.getElementsByTagName('model-viewer');

  if (modelViewerTags.length === 0) {
    return;
  }

  let mv = modelViewerTags[0];
  let src = mv.getAttribute('src');

  return src;
}

/*
Google Search page results may contain models:

<g-link>
  <a data-url="${url}">
    <span>View in 3D</span>
  </a>
</g-link>

with url like:
intent://arvr.google.com/scene-viewer/1.2?file=https://storage.googleapis.com/searchar/306423cf48b3c9e8/162f1f9bb74fbaca/gltf/galaxy-note20-ultra-mystic-bronze.glb&title=Samsung+Galaxy+Note20+Ultra+5G&referrer=google.com:result&link=https://www.samsung.com/us/smartphones/galaxy-note20-5g/#Intent;package=com.google.android.googlequicksearchbox;scheme=https;S.browser_fallback_url=https://arvr.google.com/scene-viewer?file=https://storage.googleapis.com/searchar/306423cf48b3c9e8/162f1f9bb74fbaca/gltf/galaxy-note20-ultra-mystic-bronze.glb&title=Samsung+Galaxy+Note20+Ultra+5G&referrer=google.com:result&link=https://www.samsung.com/us/smartphones/galaxy-note20-5g/;end;
*/
function getModelFromGoogleSearch() {
  let gLinks = document.querySelectorAll('g-link');

  for (let i = 0; i < gLinks.length; i++) {
    let gLink = gLinks[i];
    let spans = gLink.querySelectorAll('span');
    for (let k = 0; k < spans.length; k++) {
      let span = spans[k];

      const label = 'View in 3D';
      if (span.textContent === label) {
        console.log(`'label' model found`);
        let link = gLink.querySelector('a');
        let dataUrl = link.getAttribute('data-url');
        console.log(dataUrl);

        let modelUrl = extractIntentUrl(dataUrl);
        return modelUrl;
      }
    }
  }

  return;
}

function extractIntentUrl(url) {
  let paramsString = url.split('?')[1];
  let params = new URLSearchParams(paramsString);
  let modelFile = params.get('file');
  return modelFile;
}


function generateQRCode(url, size = 128) {
  if (qrCode) {
    qrCode.clear();
  }
  qrEl.innerHTML = '';

  qrCode = new QRCode(qrEl, {
    text: url,
    width: size,
    height: size,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : CORRECT_LEVEL
  });

  return qrCode;
}
