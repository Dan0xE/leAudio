import { useRef, useState, MutableRefObject, useEffect } from "react";
import "./styles.css";
import WaveForm from "./components/WaveForm";
import { appWindow } from "@tauri-apps/api/window";

export interface AnalyzerData {
  analyzer: AnalyserNode | { getByteFrequencyData: (arg0: number[]) => void };
  bufferLength: number;
  dataArray: Uint8Array | number[];
}

export default function App() {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [analyzerData, setAnalyzerData] = useState<AnalyzerData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const audioElmRef: MutableRefObject<HTMLMediaElement | undefined> = useRef();

  useEffect(() => {
    const minimizeBtn = document.getElementById("titlebar-minimize");
    const maximizeBtn = document.getElementById("titlebar-maximize");
    const closeBtn = document.getElementById("titlebar-close");

    minimizeBtn?.addEventListener("click", () => appWindow.minimize());
    maximizeBtn?.addEventListener("click", () => appWindow.toggleMaximize());
    closeBtn?.addEventListener("click", () => appWindow.close());

    return () => {
      minimizeBtn?.removeEventListener("click", () => appWindow.minimize());
      maximizeBtn?.removeEventListener("click", () =>
        appWindow.toggleMaximize()
      );
      closeBtn?.removeEventListener("click", () => appWindow.close());
    };
  }, []);

  const audioAnalyzer = () => {
    try {
      const audioCtx = new (window.AudioContext || window.AudioContext)();
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 2048;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioCtx.createMediaElementSource(audioElmRef.current!);
      source.connect(analyzer);
      source.connect(audioCtx.destination);
      //@ts-ignore | Type is AudioSourceNode
      source.onended = () => {
        source.disconnect();
      };

      setAnalyzerData({ analyzer, bufferLength, dataArray });
    } catch (e) {
      console.error(e);
      alert(
        "Something went wrong, could not process the Audio File\nPlease try again"
      );
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(JSON.stringify(file?.name));
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (audioElmRef.current) {
      audioElmRef.current.addEventListener("loadedmetadata", () => {
        audioAnalyzer();
      });
    }
  }, [audioUrl]);

  return (
    <div>
      <h1 className="mt-16 text-3xl">LeAudio</h1>
      <div className="flex items-center justify-center w-screen">
        <div className="w-7/12 h-7/12">
          {audioUrl && (
            <>{analyzerData && <WaveForm analyzerData={analyzerData!} />}</>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center h-32 space-y-6">
        <label
          className="p-4 mt-10 cursor-pointer rounded-xl bg-gray-950"
          htmlFor="audio-file"
        >
          Choose Audio File
        </label>
        <input
          id="audio-file"
          className="hidden"
          type="file"
          accept="audio/*"
          onChange={onFileChange}
        />
        {audioUrl && (
          <>
            <div className="">
              <p>Currently Playing: {fileName}</p>
            </div>
            <audio
              id="player"
              src={audioUrl}
              controls={false}
              ref={audioElmRef}
            />
            <div>
              <button onClick={() => document.getElementById("player")!.play()}>
                Play
              </button>
              <button
                onClick={() => document.getElementById("player")!.pause()}
              >
                Pause
              </button>
              <button
                onClick={() =>
                  (document.getElementById("player")!.volume += 0.1)
                }
              >
                Vol +
              </button>
              <button
                onClick={() =>
                  (document.getElementById("player")!.volume -= 0.1)
                }
              >
                Vol -
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
