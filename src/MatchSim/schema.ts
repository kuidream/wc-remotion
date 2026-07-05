import { z } from "zod";

const percent = z.number().min(0).max(100);

export const matchSimSchema = z.object({
  teamAName: z.string(),
  teamBName: z.string(),
  teamAOffense: percent,
  teamBOffense: percent,
  teamADefense: percent,
  teamBDefense: percent,
  teamAStarQuality: percent,
  teamBStarQuality: percent,
});

export type MatchSimProps = z.infer<typeof matchSimSchema>;

export const defaultMatchSimProps: MatchSimProps = {
  teamAName: "墨西哥",
  teamBName: "英格兰",
  teamAOffense: 29.4,
  teamBOffense: 70.6,
  teamADefense: 46,
  teamBDefense: 54,
  teamAStarQuality: 61,
  teamBStarQuality: 50,
};

export const balancedMatchSimProps: MatchSimProps = {
  teamAName: "墨西哥",
  teamBName: "英格兰",
  teamAOffense: 50,
  teamBOffense: 50,
  teamADefense: 50,
  teamBDefense: 50,
  teamAStarQuality: 50,
  teamBStarQuality: 50,
};
