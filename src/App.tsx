import {
  useRef,
  useState,
  MutableRefObject,
  useEffect,
  LegacyRef,
} from "react";
import "./styles.css";
import WaveForm from "./components/WaveForm";
import { appWindow } from "@tauri-apps/api/window";
import MinimizeIcon from "./assets/mdi_window-minimize.svg";
import MaximizeIcon from "./assets/mdi_window-maximize.svg";
import CloseIcon from "./assets/mdi_close.svg";

declare global {
  interface Window {
    __TAURI__: any;
  }
}

export interface AnalyzerData {
  analyzer: AnalyserNode | { getByteFrequencyData: (arg0: number[]) => void };
  bufferLength: number;
  dataArray: Uint8Array | number[];
}

interface CustomHtmlAudioElement extends HTMLElement {
  play: () => Promise<void>;
  pause: () => void;
  volumeUp?: () => void;
  volumeDown?: () => void;
  volume: number;
}

export default function App() {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [analyzerData, setAnalyzerData] = useState<AnalyzerData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const audioElmRef: MutableRefObject<HTMLMediaElement | undefined> = useRef();
  const audioRef = useRef<CustomHtmlAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false)
  const [firstPlay, setFirstPlay] = useState(true)


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
  });

  const audioAnalyzer = () => {
    try {
      const audioCtx = new (window.AudioContext || window.AudioContext)();
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 2048;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio();
      audio.src = audioUrl;
      audio.autoplay = firstPlay ? false : true;
      audio.controls = false;
      audio.crossOrigin = "anonymous";
      audio.loop = false;
      audio.preload = "auto";

      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyzer);
      source.connect(audioCtx.destination);

      audioRef.current = audio as HTMLAudioElement;

      audioRef.current && setAnalyzerData({ analyzer, bufferLength, dataArray });
    } catch (e) {
      console.error(e);
      alert(
        "Something went wrong, could not process the Audio File\nPlease try again"
      );
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(JSON.stringify(file?.name));
    const url = URL.createObjectURL(file);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAudioUrl(url);
  };

  useEffect(() => {
    if (audioElmRef.current) {
      audioElmRef.current.addEventListener("loadedmetadata", () => {
        audioAnalyzer();
      });
    }
  }, [audioUrl]);

  function volumeUp() {
    if (audioRef.current && audioRef.current.volume < 1) {
      audioRef.current.volume += 0.1;
    }
  }

  function volumeDown() {
    if (audioRef.current && audioRef.current.volume > 0.1) {
      audioRef.current.volume -= 0.1;
    }
  }

  useEffect(() => {
    const audioElement = document.getElementById(
      "player"
    ) as CustomHtmlAudioElement;
    if (audioElement) {
      audioRef.current = audioElement;
    }
  }, []);

  return (
    <div>
      {window.__TAURI__ && (
        <div data-tauri-drag-region className="titlebar">
          <div className="titlebar-button" id="titlebar-minimize">
            <img src={MinimizeIcon} alt="minimize" />
          </div>
          <div className="titlebar-button" id="titlebar-maximize">
            <img src={MaximizeIcon} alt="maximize" />
          </div>
          <div className="titlebar-button" id="titlebar-close">
            <img src={CloseIcon} alt="close" />
          </div>
        </div>
      )}
      <h1 className="mt-16 text-3xl">LeAudio</h1>
      <div className="flex items-center justify-center w-screen">
        <div className="w-7/12 h-7/12">
          {audioUrl && (
            <>{(analyzerData && audioRef.current) &&  <WaveForm analyzerData={analyzerData} />}</>
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
            <div className="flex flex-col items-center justify-center">
              {!isPlaying && firstPlay && <p className="animate-pulse">Press Play to Start the Track</p>}
              {isPlaying ? <p>Currently Playing: {fileName}</p> : <p>Currently Paused: {fileName}</p>}
            </div>
            <audio
              id="player"
              src={audioUrl}
              controls={false}
              ref={audioElmRef as LegacyRef<HTMLMediaElement>}
            />
            <div>
              <button onClick={() => {audioRef.current!.play(); setIsPlaying(true); setFirstPlay(false)}}>Play</button>
              <button onClick={() => {audioRef.current?.pause(); setIsPlaying(false)}}>Pause</button>
              <button onClick={() => volumeDown()}>Volume Down</button>
              <button onClick={() => volumeUp()}>Volume Up</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
