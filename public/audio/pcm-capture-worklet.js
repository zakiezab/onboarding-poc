// Runs on the audio rendering thread. The AudioContext that registers this
// module must itself be created at 16000 Hz (ElevenLabs' required input rate
// for user_audio_chunk) — this processor does not resample, it only converts
// whatever Float32 samples the context gives it into 16-bit PCM.
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const floatSamples = input[0];
      const pcm16 = new Int16Array(floatSamples.length);
      for (let i = 0; i < floatSamples.length; i++) {
        const s = Math.max(-1, Math.min(1, floatSamples[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
