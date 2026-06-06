# n8n-nodes-apivault-woocommerce

An [n8n](https://n8n.io) community node for the **WooCommerce Product Scraper** — scrape any WooCommerce catalog via the public Store API.

No login. Pay-as-you-go, no monthly subscription. The catalog crawl and enrichment run server-side on [Apify](https://apify.com); this node is a thin connector you drive with your own Apify API token.

Built by **[apivault_labs](https://apify.com/apivault_labs)** — see [all our actors](https://apify.com/apivault_labs).

## What you get per product

- **Core**: title, price, regular/sale price, discount %, SKU, description, short description, currency
- **Catalog**: categories, tags, attributes (brand, material…), images
- **Stock & rating**: in-stock status, low-stock count, average rating, review count
- **Variants**: variation IDs, or full per-variant prices/stock with "one row per variant"
- **Reviews text** (optional): actual review text + reviewer info
- **Intelligence**: discount %, popularity rank, new-arrival flag, product intelligence score
- **FX**: optional converted price (USD/EUR/GBP) via live rates

## Export formats

- **Default JSON** — full structured fields
- **Shopify CSV** / **Shopify CSV only** — WooCommerce → Shopify migration
- **Google Merchant** / **Google Merchant only** — Google Shopping ad feed
- **Custom CSV** — your own columns
- **Catalog Snapshot** — one aggregate record per store

## Installation

In your n8n instance:

1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-apivault-woocommerce`
4. Confirm and install

## Credentials

This node uses an **Apify API token**:

1. Create a free account at [apify.com](https://apify.com)
2. Go to **Apify Console → Settings → Integrations** and copy your **API token**
3. In n8n, create new **Apify API** credentials and paste the token

A free Apify account includes monthly usage credits.

## Usage

- **WooCommerce Store or Product URLs** — store domain (whole catalog), product URL, or bare domain. One per line, or comma-separated.
- **Export Format** — JSON / Shopify CSV / Google Merchant / Custom CSV / Catalog Snapshot
- **Limits & Filters** — max products, per-page, only in-stock, category slug, FX currency
- **Variants & Reviews** — flatten variants, enrich variants, review text
- **Fields to Extract** — toggle any of the 14 product fields
- **Advanced** — concurrency, timeout

## Pricing

Billed per product through Apify (pay-per-event): **$0.90 / 1,000 products** ($0.0009 each).

## Use cases

- **Shopify migration** — export any WooCommerce catalog to Shopify CSV
- **Price monitoring** — track competitor prices and discounts
- **Google Shopping** — generate a Merchant feed from any store
- **Dropshipping research** — sample catalogs, ratings and intelligence scores

## Resources

- [WooCommerce Product Scraper actor on Apify](https://apify.com/apivault_labs/woocommerce-product-scraper)
- [All actors by apivault_labs](https://apify.com/apivault_labs)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)

## Keywords

`woocommerce-scraper` `product-scraper` `ecommerce` `price-monitoring` `shopify-migration` `google-merchant` `dropshipping` `catalog-export` `n8n` `apify`
