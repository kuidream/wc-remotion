import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { AudioEvent } from "./types";

const GOAL_CHEER_URL =
  "https://actions.google.com/sounds/v1/crowds/battle_crowd_celebrate_stutter.ogg";

export const MatchSimAudio = ({ events }: { events: AudioEvent[] }) => {
  const { fps } = useVideoConfig();
  const hitDuration = Math.max(2, Math.round(0.1 * fps));
  const blockDuration = Math.max(3, Math.round(0.15 * fps));
  const goalDuration = Math.round(3 * fps);

  return (
    <>
      {events.map((event, index) => {
        if (event.type === "goal") {
          const fadeStart = 1.5 * fps;
          const fadeEnd = 2.3 * fps;
          return (
            <Sequence
              key={`goal-${event.frame}-${index}`}
              from={event.frame}
              durationInFrames={goalDuration}
              layout="none"
            >
              <Audio
                src={GOAL_CHEER_URL}
                volume={(f) => {
                  if (f < fadeStart) {
                    return 0.8;
                  }
                  if (f >= fadeEnd) {
                    return 0;
                  }
                  return interpolate(f, [fadeStart, fadeEnd], [0.8, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                }}
              />
            </Sequence>
          );
        }

        if (event.type === "block") {
          return (
            <Sequence
              key={`block-${event.frame}-${index}`}
              from={event.frame}
              durationInFrames={blockDuration}
              layout="none"
            >
              <Audio src={staticFile("sfx/block.wav")} volume={0.5} />
            </Sequence>
          );
        }

        const volume = event.intensity ?? 0.3;
        return (
          <Sequence
            key={`hit-${event.frame}-${index}`}
            from={event.frame}
            durationInFrames={hitDuration}
            layout="none"
          >
            <Audio src={staticFile("sfx/hit.wav")} volume={volume} />
          </Sequence>
        );
      })}
    </>
  );
};
