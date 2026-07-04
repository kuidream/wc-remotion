import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { MatchSimVideo } from "./MatchSimVideo";
import { defaultMatchSimProps, matchSimSchema, type MatchSimProps } from "./schema";
import { MATCH_SIM_DURATION } from "./simulation";

const calculateMetadata: CalculateMetadataFunction<MatchSimProps> = async () => {
  return {
    defaultCodec: "prores",
    defaultVideoImageFormat: "png",
    defaultPixelFormat: "yuva444p10le",
    defaultProResProfile: "4444",
  };
};

export const MatchSimComposition = () => (
  <Composition
    id="MatchSim"
    component={MatchSimVideo}
    durationInFrames={MATCH_SIM_DURATION}
    fps={VIDEO_FPS}
    width={VIDEO_WIDTH}
    height={VIDEO_HEIGHT}
    schema={matchSimSchema}
    defaultProps={defaultMatchSimProps}
    calculateMetadata={calculateMetadata}
  />
);
