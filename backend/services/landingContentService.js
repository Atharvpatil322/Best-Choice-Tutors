import Benefit from "../models/Benefit.js";
import PopularSearch from "../models/PopularSearch.js";
import {
  DEFAULT_BENEFITS,
  DEFAULT_POPULAR_SEARCHES,
} from "../data/defaultLandingContent.js";

export async function ensureDefaultBenefits() {
  const existingCount = await Benefit.estimatedDocumentCount();
  if (existingCount > 0) return;
  await Benefit.insertMany(DEFAULT_BENEFITS);
}

export async function ensureDefaultPopularSearches() {
  const existingCount = await PopularSearch.estimatedDocumentCount();
  if (existingCount > 0) return;
  await PopularSearch.insertMany(DEFAULT_POPULAR_SEARCHES);
}
