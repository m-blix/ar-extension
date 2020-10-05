'use strict';

const VERSION = 0.1;
let pageTitle = document.title;
console.log(`AR Extension: v${VERSION} ('${pageTitle}')`);

const VIEWER_DOMAIN = 'https://m-blix.github.io';
const VIEWER_BASE_URL = VIEWER_DOMAIN+'/share-poc/?url=';
let useViewer = true;

const CORRECT_LEVEL = QRCode.CorrectLevel.L;
let qrCode;

let uiEl, qrEl, msgEl;

function setup() {
  chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    console.log(response.farewell);
  });

  chrome.runtime.onMessage.addListener(function backgroundListener(request, sender, sendResponse) {
    console.log("background.js: ", request);
  });
}

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

  qrEl.addEventListener('click', function(ev){
    window.open(qrEl.dataset.url, '_blank');
  });
}

function load() {
  setup();
  setupUI();

  let viewerUrl;

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
  const GOOGLE_HOST = 'www.google.com';
  if (!modelUrl && location.host === GOOGLE_HOST) {
    console.log(`detect on ${GOOGLE_HOST}`);
    let data = getModelFromGoogleSearch();
    console.log(data);
    if (data) {
      //useViewer = false;
      modelUrl = data.file;
      viewerUrl = data.viewerUrl;
    }
    if (modelUrl) {
      console.log(`3D model found (google-search): ${modelUrl}`);
    }
  }
  const GOOGLE_AC_HOST = 'artsandculture.google.com';
  if (!modelUrl && location.host === GOOGLE_AC_HOST) {
    console.log(`detect on ${GOOGLE_AC_HOST}`);
    modelUrl = getModelFromGoogleArtsAndCulture();
    if (modelUrl) {
      console.log(`3D model found (google arts & culture): ${modelUrl}`);
    }
  }
  const GOOGLE_POLY_HOST = 'poly.google.com';
  if (!modelUrl && location.host === GOOGLE_POLY_HOST) {
    console.log(`detect on ${GOOGLE_POLY_HOST}`);
    modelUrl = getModelFromGooglePoly();
    if (modelUrl) {
      console.log(`3D model found (google poly): ${modelUrl}`);
    }
  }
  const GITHUB_HOST = 'github.com';
  if (!modelUrl && location.host === GITHUB_HOST) {
    console.log(`detect on ${GITHUB_HOST}`);
    modelUrl = getModelFromGitHub();
    if (modelUrl) {
      console.log(`3D model found (github): ${modelUrl}`);
    }
  }
  const GITLAB_HOST = 'gitlab.com';
  if (!modelUrl && location.host === GITLAB_HOST) {
    console.log(`detect on ${GITLAB_HOST}`);
    modelUrl = getModelFromGitLab();
    if (modelUrl) {
      console.log(`3D model found (gitlab): ${modelUrl}`);
    }
  }

  if (modelUrl) {
    console.log('generating QR Code, adding to page');

    if (useViewer) {
      viewerUrl = VIEWER_BASE_URL+modelUrl;
    }

    generateQRCode(viewerUrl);
    qrEl.dataset.url = viewerUrl;

    document.body.appendChild(uiEl);
  } else {
    console.log('no 3D model found');
  }
}

load();


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
