/** Fired after cart or wishlist changes so the header can refetch counts. */
export const SHOP_BADGES_EVENT = "jewellery:shop-badges-refresh";

export function refreshShopBadges() {
  window.dispatchEvent(new CustomEvent(SHOP_BADGES_EVENT));
}
