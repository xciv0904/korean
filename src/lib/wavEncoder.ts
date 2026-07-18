// 把錄音的 Blob(Chrome/Android 通常是 audio/webm;codecs=opus,Safari/iOS
// 通常是 audio/mp4;codecs=aac)轉成 Azure 語音服務要求的格式:
// 16kHz、單聲道、16-bit PCM WAV。
//
// 步驟:AudioContext.decodeAudioData 解碼原始音檔(瀏覽器內建解碼器,
// webm/opus、mp4/aac 都能吃)→ OfflineAudioContext 重新取樣成 16kHz 單聲道
// → 手動寫 44-byte WAV header + PCM 16-bit 資料。
//
// 這段全部在瀏覽器端執行,不需要任何額外套件或後端服務。
const TARGET_SAMPLE_RATE = 16000;

export async function blobToWav16kMono(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioContextCtor();

  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  const OfflineAudioContextCtor =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  const offlineCtx = new OfflineAudioContextCtor(
    1,
    Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
    TARGET_SAMPLE_RATE
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  // 接到單聲道的 destination,多聲道來源會由 Web Audio API 自動 down-mix。
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  const channelData = rendered.getChannelData(0);

  return encodeWavPCM16(channelData, TARGET_SAMPLE_RATE);
}

function encodeWavPCM16(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size (PCM)
  view.setUint16(20, 1, true); // audio format = 1 (PCM)
  view.setUint16(22, 1, true); // channels = 1
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
