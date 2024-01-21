import { useRef, useEffect, MutableRefObject, LegacyRef } from "react";
import useSize from "../hooks/useSize";
import { AnalyzerData } from "../App";

function animateBars(
  analyser: { getByteFrequencyData: (arg0: number[]) => void },
  canvas: HTMLCanvasElement,
  canvasCtx:
    | {
        fillStyle: string;
        fillRect: (
          arg0: number,
          arg1: number,
          arg2: number,
          arg3: number
        ) => void;
      }
    | CanvasRenderingContext2D,
  dataArray: number[],
  bufferLength: number
) {
  analyser.getByteFrequencyData(dataArray);

  canvasCtx.fillStyle = "#000";

  const HEIGHT = canvas.height / 2;

  var barWidth = Math.ceil(canvas.width / bufferLength) * 2.5;

  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    if(dataArray[i] !== 0) {
      barHeight = (dataArray[i] / 255) * HEIGHT;
      const blueShade = Math.floor((dataArray[i] / 255) * 5);
      const blueHex = ["#61dafb", "#61dafb", "#61dafb", "#61dafb", "#61dafb"][
        blueShade
      ]; //@NOTE maybe make them change via params in the UI
      canvasCtx.fillStyle = blueHex;
      canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }
}

const WaveForm = ({ analyzerData }: { analyzerData: AnalyzerData }) => {
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> =
    useRef<HTMLCanvasElement | null>(null);
  const { dataArray, analyzer, bufferLength } = analyzerData;
  const [width, height] = useSize();

  const draw = (
    dataArray: number[],
    analyzer: { getByteFrequencyData: (arg0: number[]) => void },
    bufferLength: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzer) return;
    const canvasCtx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const animate = () => {
      requestAnimationFrame(animate);
      canvas.width = canvas.width;
      canvasCtx.translate(0, canvas.offsetHeight / 2 - 115);
      animateBars(analyzer, canvas, canvasCtx, dataArray, bufferLength);
    };

    animate();
  };

  useEffect(() => {
    draw(
      dataArray as number[],
      analyzer as { getByteFrequencyData: (arg0: number[]) => void },
      bufferLength
    );
  }, [dataArray, analyzer, bufferLength]);

  return (
    <canvas className="w-full" ref={canvasRef} width={width} height={height} />
  );
};

export default WaveForm;
