/* model detectors */

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
*/
function getModelFromGoogleSearch() {
  let gLinks = document.querySelectorAll('g-link');

  for (let i = 0; i < gLinks.length; i++) {
    let gLink = gLinks[i];
    console.log(gLink);

    let link = gLink.querySelector('a');
    if (link) {
      let dataUrl = link.getAttribute('data-url');
      if (dataUrl && dataUrl.startsWith('intent://arvr')) {
        let intentInfo = extractIntentInfo(dataUrl);
        return intentInfo;
      }
    }

    /*let spans = gLink.querySelectorAll('span');
    for (let k = 0; k < spans.length; k++) {
      let span = spans[k];

      const VIEW_3D_LABEL = 'View in 3D';
      console.log(span.textContent);
      if (span.textContent === VIEW_3D_LABEL) {
        console.log(`'${VIEW_3D_LABEL}' model found`);
        let link = gLink.querySelector('a');
        let dataUrl = link.getAttribute('data-url');
        console.log(dataUrl);

        let intentInfo = extractIntentInfo(dataUrl);
        return intentInfo;
      }
    }*/
  }
}

/*
example:
intent://arvr.google.com/scene-viewer/1.2
  ?file=https://storage.googleapis.com/searchar/306423cf48b3c9e8/162f1f9bb74fbaca/gltf/galaxy-note20-ultra-mystic-bronze.glb
  &title=Samsung+Galaxy+Note20+Ultra+5G
  &referrer=google.com:result
  &link=https://www.samsung.com/us/smartphones/galaxy-note20-5g/
    #Intent;
      package=com.google.android.googlequicksearchbox;
      scheme=https;
      S.browser_fallback_url=https://arvr.google.com/scene-viewer
        ?file=https://storage.googleapis.com/searchar/306423cf48b3c9e8/162f1f9bb74fbaca/gltf/galaxy-note20-ultra-mystic-bronze.glb
        &title=Samsung+Galaxy+Note20+Ultra+5G
        &referrer=google.com:result
        &link=https://www.samsung.com/us/smartphones/galaxy-note20-5g/;end;
*/
function extractIntentInfo(url) {
  let paramsString = url.substring(url.indexOf('?')+1);

  const FB_URL_PARAM = 'S.browser_fallback_url';
  const INTENT_END = ';end;';
  const INTENT_START = '#Intent';

  let info = {};

  let fallbackUrl = paramsString.substring(
    paramsString.indexOf(FB_URL_PARAM)+FB_URL_PARAM.length+1);
  fallbackUrl = fallbackUrl.replace(INTENT_END, '');
  info['viewerUrl'] = fallbackUrl;

  console.log('fallbackUrl', fallbackUrl);

  paramsString = paramsString.split(INTENT_START)[0];

  let parts = paramsString.split('&');

  for (let i = 0; i < parts.length; i++) {
    let param = parts[i];

    let key = param.substring(0, param.indexOf('='));
    let value = param.substring(param.indexOf('=')+1);

    //console.log(key, value);
    info[key] = value;
  }

  return info;
}

/*
https://artsandculture.google.com/project/ar

<div data-model-url="model.glb">
*/
function getModelFromGoogleArtsAndCulture() {
  const GOOGLE_AC_HOST = 'artsandculture.google.com';

  let el = document.querySelector('div[data-model-url]');
  if (el) {
    let url = el.getAttribute('data-model-url');
    return url;
  }
}

/*
GLB supported
<a href="/path/model.glb" id="raw-url" role="button" class="btn">Download</a>
*/
function getModelFromGitHub() {
  let rawEl = document.querySelector('#raw-url');
  if (rawEl) {
    let url = rawEl.href;
    if (url.includes('.glb') || url.includes('.gltf')) {
      return url;
    }
  }
}

/*
<a aria-label="Download" download="resource/model.glb" href="path/model.glb">
*/
function getModelFromGitLab() {
  let rawEl = document.querySelector('a[aria-label="Download"]');
  if (rawEl) {
    let url = rawEl.href;
    if (url.includes('.glb') || url.includes('.gltf')) {
      return url;
    }
  }
}
