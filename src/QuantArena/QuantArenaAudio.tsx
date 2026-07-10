import { Audio } from "@remotion/media";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import type { AudioEvent } from "./types";

export const QuantArenaAudio = ({ events }: { events: AudioEvent[] }) => {
  const { fps } = useVideoConfig();
  const hitDuration = Math.max(2, Math.round(0.1 * fps));
  const collectDuration = Math.max(3, Math.round(0.12 * fps));
  const hazardDuration = Math.max(3, Math.round(0.18 * fps));

  return (
    <>
      {events.map((event, index) => {
        if (event.type === "collect") {
          return (
            <Sequence
              key={`collect-${event.frame}-${index}`}
              from={event.frame}
              durationInFrames={collectDuration}
              layout="none"
            >
              <Audio
                src={staticFile("sfx/hit.wav")}
                volume={event.intensity ?? 0.4}
              />
            </Sequence>
          );
        }

        if (event.type === "hazard") {
          return (
            <Sequence
              key={`hazard-${event.frame}-${index}`}
              from={event.frame}
              durationInFrames={hazardDuration}
              layout="none"
            >
              <Audio
                src={staticFile("sfx/block.wav")}
                volume={event.intensity ?? 0.55}
              />
            </Sequence>
          );
        }

        return (
          <Sequence
            key={`hit-${event.frame}-${index}`}
            from={event.frame}
            durationInFrames={hitDuration}
            layout="none"
          >
            <Audio
              src={staticFile("sfx/hit.wav")}
              volume={event.intensity ?? 0.3}
            />
          </Sequence>
        );
      })}
    </>
  );
};
