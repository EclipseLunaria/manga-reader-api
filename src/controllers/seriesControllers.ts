import { Request, Response } from "express";
import { extractPageHtml, getMangaUrl } from "../utils";
import { parseField, parseFields } from "../services/parsing";
import { seriesParsingConfig } from "../config/parsingConfig";
import {
  fetchSeriesField,
  getSeriesInfo,
  storeSeriesInfo,
} from "../services/storage";

/**
 * Parses the series information using the mangaId parameter from the request.
 * @param req - The request object.
 * @param res - The response object.
 * @returns The parsed series information or an error response.
 */
const seriesInfoController = async (req: Request, res: Response) => {
  const { mangaId } = req.params;

  // Check if the series information is already stored in the database
  const seriesPrefetched = await getSeriesInfo(mangaId);
  if (seriesPrefetched) {
    res.status(200).json(seriesPrefetched);
    console.log("Series info fetched from database");
    return;
  }

  const seriesUrl = getMangaUrl(mangaId);
  try {
    const $ = await extractPageHtml(seriesUrl);
    if (!$) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    const seriesInfo = {
      mangaId: mangaId,
      ...(await parseFields($, seriesParsingConfig)),
    };
    storeSeriesInfo(seriesInfo);
    res.status(200).json(seriesInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return res;
  }
};

const fieldController = async (req: Request, res: Response) => {
  const { mangaId, field } = req.params;

  // Check if the field is already stored in the database
  const seriesPrefetched = await fetchSeriesField(mangaId, field);
  if (seriesPrefetched) {
    res.status(200).json(seriesPrefetched);
    console.log("Field fetched from database");
    return;
  }
  const seriesUrl = getMangaUrl(mangaId);
  try {
    const $ = await extractPageHtml(seriesUrl);
    if (!$) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    const seriesInfo = await parseField($, seriesParsingConfig, field);
    await storeSeriesInfo(seriesInfo);
    if (!seriesInfo) {
      res.status(404).json({ error: "Field not found" });
    }
    res.status(200).json(seriesInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return res;
  }
};

export { seriesInfoController, fieldController };
