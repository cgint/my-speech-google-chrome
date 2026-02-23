/* global LanguageModel */

const btnRecord = document.getElementById('btnRecord');
const btnStopTts = document.getElementById('btnStopTts');
const elStatus = document.getElementById('status');
const elTranscript = document.getElementById('transcript');
const elResponse = document.getElementById('response');

let mediaStream = null;
let recorder = null;
let chunks = [];

let sttSession = null; // expectedInputs: audio
let chatSession = null; // text-only

// Chrome currently asks for an explicit output language for best quality/safety.
// Supported codes (as of the error message seen in Chrome 145): en, es, ja
const OUTPUT_LANGUAGE = 'en';

function setStatus(text) {
  elStatus.textContent = text;
}

function appendStatus(text) {
  elStatus.textContent = (elStatus.textContent ? elStatus.textContent + '\n' : '') + text;
}

function resetOutputs() {
  elTranscript.textContent = '';
  elResponse.textContent = '';
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

  // In practice LanguageModel.create() will fail unless availability is "available".
  if (availability !== 'available') {
    throw new Error(promptApiHelpText(availability));
  }

  const paramsWithLanguage = {
    ...params,
    // Newer Chrome builds warn/error if output language isn't specified.
    outputLanguage: OUTPUT_LANGUAGE
  };

  try {
    return await LanguageModel.create(paramsWithLanguage);
  } catch (e) {
    const name = e?.name ? `${e.name}: ` : '';
    const message = String(e?.message || e);
    // Common cause here for multimodal audio: missing Origin Trial token for
    // AIPromptAPIMultimodalInput (see Google's audio-scribe sample manifest).
    throw new Error(
      `${name}${message}\n\nDetails: availability=${availability}, outputLanguage=${OUTPUT_LANGUAGE}.\n` +
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
    elTranscript.textContent = transcript;
  }
  return transcript.trim();
}

async function generateResponse(transcript) {
  const session = await getChatSession();

  const stream = session.promptStreaming(
    `User said (transcript):\n${transcript}\n\nRespond:`
  );

  let response = '';
  for await (const chunk of stream) {
    response += chunk;
    elResponse.textContent = response;
  }
  return response.trim();
}

async function speak(text) {
  if (!chrome?.tts) {
    throw new Error('chrome.tts is not available (missing permission or unsupported context).');
  }

  btnStopTts.removeAttribute('disabled');

  return new Promise((resolve, reject) => {
    try {
      chrome.tts.speak(text, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        onEvent: (event) => {
          if (event.type === 'end') {
            btnStopTts.setAttribute('disabled', '');
            resolve();
          }
          if (event.type === 'error') {
            btnStopTts.setAttribute('disabled', '');
            reject(new Error(event.errorMessage || 'TTS error'));
          }
          if (
            event.type === 'interrupted' ||
            event.type === 'cancelled'
          ) {
            btnStopTts.setAttribute('disabled', '');
            resolve();
          }
        }
      });
    } catch (e) {
      btnStopTts.setAttribute('disabled', '');
      reject(e);
    }
  });
}

function stopSpeaking() {
  try {
    chrome.tts.stop();
  } finally {
    btnStopTts.setAttribute('disabled', '');
  }
}

async function startRecording() {
  if (recorder?.state === 'recording') return;

  resetOutputs();
  setStatus('Requesting microphone permission...');

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];

  const mimeType = pickAudioMimeType();
  recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = (evt) => {
    if (evt.data && evt.data.size > 0) chunks.push(evt.data);
  };

  recorder.start();
  setStatus(`Recording... (mimeType: ${recorder.mimeType || 'default'})`);
  btnRecord.textContent = 'Stop recording';
}

async function stopRecordingAndRunLoop() {
  if (!recorder || recorder.state !== 'recording') return;

  setStatus('Stopping recording...');

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
    setStatus('No audio captured. Try again.');
    return;
  }

  setStatus(`Captured audio (${Math.round(audioBlob.size / 1024)} KB). Transcribing...`);

  try {
    const transcript = await transcribeAudio(audioBlob);
    if (!transcript) {
      setStatus('Empty transcript. Try again.');
      return;
    }

    appendStatus('Generating response...');
    const response = await generateResponse(transcript);

    appendStatus('Speaking...');
    await speak(response);
    appendStatus('Done.');
  } catch (e) {
    const msg = String(e?.message || e);
    // Don't overwrite previously appended help text (e.g. Prompt API "downloadable").
    if (elStatus.textContent) {
      appendStatus(`\nERROR: ${msg}`);
    } else {
      setStatus(msg);
    }
  } finally {
    btnRecord.textContent = 'Start recording';
  }
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
    if (elStatus.textContent) {
      appendStatus(`\nERROR: ${msg}`);
    } else {
      setStatus(msg);
    }
    btnRecord.textContent = 'Start recording';
  }
});

btnStopTts.addEventListener('click', () => {
  stopSpeaking();
});

setStatus('Ready. Click “Start recording”.');
