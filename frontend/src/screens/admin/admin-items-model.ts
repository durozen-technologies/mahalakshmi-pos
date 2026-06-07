export { ItemScope, PriceStatus } from "@/types/api";

export enum AdminItemWorkspace {
  Catalogue = "catalogue",
  Assumption = "assumption",
  Shop = "shop",
  Prices = "prices",
}

export enum AdminItemFilter {
  All = "all",
  Allocated = "allocated",
  Available = "available",
  Catalogue = "catalogue",
  Shop = "shop",
  Priced = "priced",
  NeedsPrice = "needs_price",
  StalePrice = "stale_price",
  Paused = "paused",
}

export enum AdminItemFormScope {
  Catalogue = "catalogue",
  Shop = "shop",
}

export enum AdminItemEditorMode {
  Create = "create",
  Edit = "edit",
  Customize = "customize",
}

export type ManageableItemWorkspace = AdminItemWorkspace.Catalogue | AdminItemWorkspace.Shop;
