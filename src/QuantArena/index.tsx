import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { QuantArenaVideo } from "./QuantArenaVideo";
import {
  defaultQuantArenaProps,
  quantArenaSchema,
  type QuantArenaProps,
} from "./schema";
import { QUANT_ARENA_DURATION } from "./simulation";

const calculateMetadata: CalculateMetadataFunction<QuantArenaProps> = async () => {
  return {
    defaultCodec: "prores",
    defaultVideoImageFormat: "png",
    defaultPixelFormat: "yuva444p10le",
    defaultProResProfile: "4444",
  };
};

export const QuantArenaComposition = () => (
  <Composition
    id="QuantArena"
    component={QuantArenaVideo}
    durationInFrames={QUANT_ARENA_DURATION}
    fps={VIDEO_FPS}
    width={VIDEO_WIDTH}
    height={VIDEO_HEIGHT}
    schema={quantArenaSchema}
    defaultProps={defaultQuantArenaProps}
    calculateMetadata={calculateMetadata}
  />
);
