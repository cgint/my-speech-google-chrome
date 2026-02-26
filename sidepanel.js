/* global LanguageModel */

const btnRecord = document.getElementById('btnRecord');
const btnReadSelection = document.getElementById('btnReadSelection');
const btnStopTtsLoop = document.getElementById('btnStopTtsLoop');
const btnStopTtsSelection = document.getElementById('btnStopTtsSelection');
const outputLanguageSelect = document.getElementById('outputLanguageSelect');

const elStatusLoop = document.getElementById('statusLoop');
const elTranscriptLoop = document.getElementById('transcriptLoop');
const elResponseLoop = document.getElementById('responseLoop');

const elStatusSelection = document.getElementById('statusSelection');
const elSelectedTextOutput = document.getElementById('selectedTextOutput');

const STORAGE_KEY_OUTPUT_LANGUAGE = 'outputLanguage';
const SUPPORTED_OUTPUT_LANGUAGES = ['en', 'de'];

let mediaStream = null;
let recorder = null;
let chunks = [];

let sttSession = null; // expectedInputs: audio
let chatSession = null; // text-only
let currentOutputLanguage = 'en';

function setLoopStatus(text) {
  elStatusLoop.textContent = text;
}

function appendLoopStatus(text) {
  elStatusLoop.textContent = (elStatusLoop.textContent ? `${elStatusLoop.textContent}\n` : '') + text;
}

function setSelectionStatus(text) {
  elStatusSelection.textContent = text;
}

function appendSelectionStatus(text) {
  elStatusSelection.textContent =
    (elStatusSelection.textContent ? `${elStatusSelection.textContent}\n` : '') + text;
}

function resetLoopOutputs() {
  elTranscriptLoop.textContent = '';
  elResponseLoop.textContent = '';
}

function disableAllStopButtons() {
  btnStopTtsLoop.setAttribute('disabled', '');
  btnStopTtsSelection.setAttribute('disabled', '');
}

function pickAudioMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function extensionOrigin() {
  try {
    if (chrome?.runtime?.id) return `chrome-extension://${chrome.runtime.id}`;
  } catch (_) {
    // ignore
  }
  return 'chrome-extension://<extension-id>';
}

function promptApiHelpText(availability) {
  const lines = [];
  lines.push(`Prompt API availability: ${availability}`);
  lines.push('');
  lines.push('This extension requires Chrome built-in AI (Gemini Nano / Prompt API).');

  if (availability === 'downloadable') {
    lines.push('Chrome has not downloaded the on-device model yet. Try:');
  } else if (availability === 'downloading') {
    lines.push('Chrome is currently downloading the on-device model. Wait until it finishes.');
  } else {
    lines.push('Prompt API is not ready.');
  }

  lines.push('- Keep Chrome open; you may see a download/permission prompt in the browser UI.');
  lines.push('- Open Chrome Settings and look for “AI” / “Built-in AI” / “Gemini Nano” download.');
  lines.push('  (Some builds expose this at chrome://settings/ai)');
  lines.push('- Check chrome://components → “Optimization Guide On Device Model” should become Up-to-date.');
  lines.push('');
  lines.push('After download completes, click “Start recording” again.');
  lines.push('');
  lines.push('If text prompts work but audio prompts fail, you likely need an Origin Trial token:');
  lines.push('- Feature: AIPromptAPIMultimodalInput');
  lines.push(`- Origin: ${extensionOrigin()}`);
  return lines.join('\n');
}

async function ensurePromptApiPresent() {
  if (!('LanguageModel' in self)) {
    throw new Error(
      'LanguageModel is not available in this context. This typically means your browser does not expose the Prompt API for extensions. Try Google Chrome (not Brave) and ensure built-in AI is enabled.'
    );
  }
}

async function createLanguageModel(params) {
  await ensurePromptApiPresent();

  const availability = await LanguageModel.availability();

  if (availability !== 'available') {
    throw new Error(promptApiHelpText(availability));
  }

  const paramsWithLanguage = {
    ...params,
    outputLanguage: currentOutputLanguage
  };

  try {
    return await LanguageModel.create(paramsWithLanguage);
  } catch (e) {
    const name = e?.name ? `${e.name}: ` : '';
    const message = String(e?.message || e);
    throw new Error(
      `${name}${message}\n\nDetails: availability=${availability}, outputLanguage=${currentOutputLanguage}.\n` +
        'If this is a multimodal-audio error, you may need an Origin Trial token (AIPromptAPIMultimodalInput) in manifest.json.'
    );
  }
}

async function getSttSession() {
  if (sttSession) return sttSession;
  sttSession = await createLanguageModel({
    temperature: 0,
    topK: 1,
    expectedInputs: [{ type: 'audio' }]
  });
  return sttSession;
}

async function getChatSession() {
  if (chatSession) return chatSession;
  chatSession = await createLanguageModel({
    temperature: 0.7,
    topK: 3,
    initialPrompts: [
      {
        role: 'system',
        content:
          'You are a concise, helpful assistant. Answer in 1-3 short sentences unless asked otherwise.'
      }
    ]
  });
  return chatSession;
}

async function transcribeAudio(audioBlob) {
  const session = await getSttSession();

  const stream = session.promptStreaming([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'transcribe this audio' },
        { type: 'audio', value: audioBlob }
      ]
    }
  ]);

  let transcript = '';
  for await (const chunk of stream) {
    transcript += chunk;
    elTranscriptLoop.textContent = transcript;
  }
  return transcript.trim();
}

async function generateResponse(transcript) {
  const session = await getChatSession();

  const stream = session.promptStreaming(`User said (transcript):\n${transcript}\n\nRespond:`);

  let response = '';
  for await (const chunk of stream) {
    response += chunk;
    elResponseLoop.textContent = response;
  }
  return response.trim();
}

async function speak(text, stopButton) {
  if (!chrome?.tts) {
    throw new Error('chrome.tts is not available (missing permission or unsupported context).');
  }

  disableAllStopButtons();
  stopButton.removeAttribute('disabled');

  return new Promise((resolve, reject) => {
    try {
      chrome.tts.speak(text, {
        lang: currentOutputLanguage,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        onEvent: (event) => {
          if (event.type === 'end') {
            disableAllStopButtons();
            resolve();
          }
          if (event.type === 'error') {
            disableAllStopButtons();
            reject(new Error(event.errorMessage || 'TTS error'));
          }
          if (event.type === 'interrupted' || event.type === 'cancelled') {
            disableAllStopButtons();
            resolve();
          }
        }
      });
    } catch (e) {
      disableAllStopButtons();
      reject(e);
    }
  });
}

function stopSpeaking() {
  try {
    chrome.tts.stop();
  } finally {
    disableAllStopButtons();
  }
}

async function ensureSelectionPermissionGranted() {
  if (!chrome?.permissions) {
    throw new Error('Permissions API is not available in this context.');
  }

  const origins = ['http://*/*', 'https://*/*'];
  const hasAccess = await chrome.permissions.contains({ origins });
  if (hasAccess) return;

  const granted = await chrome.permissions.request({ origins });
  if (!granted) {
    throw new Error('Permission to access website pages was not granted.');
  }
}

async function getSelectedTextFromActiveTab() {
  if (!chrome?.tabs || !chrome?.scripting) {
    throw new Error('Tab selection access is not available in this context.');
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error('No active tab found.');
  }

  await ensureSelectionPermissionGranted();

  const results = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => window.getSelection?.().toString() || ''
  });

  const rawText = results?.[0]?.result;
  return typeof rawText === 'string' ? rawText.trim() : '';
}

async function readSelectedTextAndSpeak() {
  btnReadSelection.setAttribute('disabled', '');
  setSelectionStatus('Reading selected text from active tab...');

  try {
    const selectedText = await getSelectedTextFromActiveTab();

    if (!selectedText) {
      elSelectedTextOutput.textContent = '';
      const noSelectionSpeech =
        currentOutputLanguage === 'de' ? 'Es wurde kein Text markiert' : 'No text selected';
      setSelectionStatus('There is no text selected. Select text on the page and try again.');
      await speak(noSelectionSpeech, btnStopTtsSelection);
      appendSelectionStatus(`Spoken: ${noSelectionSpeech}`);
      return;
    }

    elSelectedTextOutput.textContent = selectedText;
    setSelectionStatus('Speaking selected text...');
    await speak(selectedText, btnStopTtsSelection);
    appendSelectionStatus('Done.');
  } catch (e) {
    const detail = String(e?.message || e);
    setSelectionStatus(
      'Could not read selected text. Use a regular website tab, allow site access when prompted, and ensure text is selected.'
    );
    appendSelectionStatus(`Details: ${detail}`);
  } finally {
    btnReadSelection.removeAttribute('disabled');
  }
}

async function startRecording() {
  if (recorder?.state === 'recording') return;

  resetLoopOutputs();
  setLoopStatus('Requesting microphone permission...');

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];

  const mimeType = pickAudioMimeType();
  recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = (evt) => {
    if (evt.data && evt.data.size > 0) chunks.push(evt.data);
  };

  recorder.start();
  setLoopStatus(`Recording... (mimeType: ${recorder.mimeType || 'default'})`);
  btnRecord.textContent = 'Stop recording';
}

async function stopRecordingAndRunLoop() {
  if (!recorder || recorder.state !== 'recording') return;

  setLoopStatus('Stopping recording...');

  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  recorder.stop();
  await stopped;

  mediaStream?.getTracks()?.forEach((t) => t.stop());
  mediaStream = null;

  const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
  recorder = null;

  if (!audioBlob.size) {
    setLoopStatus('No audio captured. Try again.');
    return;
  }

  setLoopStatus(`Captured audio (${Math.round(audioBlob.size / 1024)} KB). Transcribing...`);

  try {
    const transcript = await transcribeAudio(audioBlob);
    if (!transcript) {
      setLoopStatus('Empty transcript. Try again.');
      return;
    }

    appendLoopStatus('Generating response...');
    const response = await generateResponse(transcript);

    appendLoopStatus('Speaking...');
    await speak(response, btnStopTtsLoop);
    appendLoopStatus('Done.');
  } catch (e) {
    const msg = String(e?.message || e);
    if (elStatusLoop.textContent) {
      appendLoopStatus(`\nERROR: ${msg}`);
    } else {
      setLoopStatus(msg);
    }
  } finally {
    btnRecord.textContent = 'Start recording';
  }
}

async function loadOutputLanguage() {
  if (!chrome?.storage?.local) {
    return 'en';
  }

  const stored = await chrome.storage.local.get(STORAGE_KEY_OUTPUT_LANGUAGE);
  const value = stored?.[STORAGE_KEY_OUTPUT_LANGUAGE];
  return SUPPORTED_OUTPUT_LANGUAGES.includes(value) ? value : 'en';
}

async function saveOutputLanguage(lang) {
  if (!chrome?.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEY_OUTPUT_LANGUAGE]: lang });
}

async function applyOutputLanguage(lang) {
  currentOutputLanguage = SUPPORTED_OUTPUT_LANGUAGES.includes(lang) ? lang : 'en';
  outputLanguageSelect.value = currentOutputLanguage;

  // Recreate sessions on next use so output language changes take effect.
  sttSession = null;
  chatSession = null;

  appendLoopStatus(`Output language set to: ${currentOutputLanguage}`);
  appendSelectionStatus(`Output language set to: ${currentOutputLanguage}`);
}

btnRecord.addEventListener('click', async () => {
  try {
    if (recorder?.state === 'recording') {
      await stopRecordingAndRunLoop();
    } else {
      await startRecording();
    }
  } catch (e) {
    const msg = String(e?.message || e);
    if (elStatusLoop.textContent) {
      appendLoopStatus(`\nERROR: ${msg}`);
    } else {
      setLoopStatus(msg);
    }
    btnRecord.textContent = 'Start recording';
  }
});

btnReadSelection.addEventListener('click', async () => {
  await readSelectedTextAndSpeak();
});

btnStopTtsLoop.addEventListener('click', () => {
  stopSpeaking();
});

btnStopTtsSelection.addEventListener('click', () => {
  stopSpeaking();
});

outputLanguageSelect.addEventListener('change', async () => {
  const selected = outputLanguageSelect.value;
  await applyOutputLanguage(selected);
  await saveOutputLanguage(selected);
});

async function init() {
  disableAllStopButtons();
  setLoopStatus('Ready. Click “Start recording”.');
  setSelectionStatus('Ready. Select text on a webpage, then click “Read selected text”.');

  const initialLanguage = await loadOutputLanguage();
  await applyOutputLanguage(initialLanguage);
}

init().catch((e) => {
  const msg = String(e?.message || e);
  setLoopStatus(`Initialization error: ${msg}`);
  setSelectionStatus(`Initialization error: ${msg}`);
});
