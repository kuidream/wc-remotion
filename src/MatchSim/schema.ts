import { z } from "zod";

const percent = z.number().min(0).max(100);

export const matchSimSchema = z.object({
  teamAName: z.string(),
  teamBName: z.string(),
  teamAOffense: percent,
  teamBOffense: percent,
  teamADefense: percent,
  teamBDefense: percent,
});

export type MatchSimProps = z.infer<typeof matchSimSchema>;

export const defaultMatchSimProps: MatchSimProps = {
  teamAName: "巴拉圭",
  teamBName: "法国",
  teamAOffense: 20.2,
  teamBOffense: 79.8,
  teamADefense: 33.2,
  teamBDefense: 66.8,
};

export const balancedMatchSimProps: MatchSimProps = {
  teamAName: "巴拉圭",
  teamBName: "法国",
  teamAOffense: 50,
  teamBOffense: 50,
  teamADefense: 50,
  teamBDefense: 50,
};
