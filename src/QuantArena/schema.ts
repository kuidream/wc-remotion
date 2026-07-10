import { z } from "zod";

export const quantArenaSchema = z.object({
  assetAName: z.string(),
  assetBName: z.string(),
  assetASharpe: z.number(),
  assetBSharpe: z.number(),
  assetASortino: z.number(),
  assetBSortino: z.number(),
  assetARsq: z.number().min(0).max(100),
  assetBRsq: z.number().min(0).max(100),
  assetATtr: z.number().min(1),
  assetBTtr: z.number().min(1),
});

export type QuantArenaProps = z.infer<typeof quantArenaSchema>;

export const defaultQuantArenaProps: QuantArenaProps = {
  assetAName: "BTC",
  assetBName: "ETH",
  assetASharpe: 3.53,
  assetBSharpe: 3.87,
  assetASortino: 13.65,
  assetBSortino: 10.54,
  assetARsq: 51.9,
  assetBRsq: 51.0,
  assetATtr: 153,
  assetBTtr: 243,
};
