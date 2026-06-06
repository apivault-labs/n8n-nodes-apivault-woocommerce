# Changelog

## 0.1.0

- Initial release.
- `WooCommerce Product Scraper` node: scrape any WooCommerce catalog via the
  public Store API (store domain, product URL or bare domain).
- Fields: title, price, regular/sale price, discount %, SKU, description, short
  description, images, categories, tags, attributes, stock, rating, variations.
- Variant enrichment + "one row per variant", optional review text, product
  intelligence score, optional FX-converted price.
- Export formats: default JSON, Shopify CSV (migration), Google Merchant feed,
  custom CSV, catalog snapshot.
- Limits & filters: max products, per-page, only in-stock, category slug.
- `Apify API` credentials with token test against `/users/me`.
- Calls the `apivault_labs/woocommerce-product-scraper` actor via
  `run-sync-get-dataset-items`.
