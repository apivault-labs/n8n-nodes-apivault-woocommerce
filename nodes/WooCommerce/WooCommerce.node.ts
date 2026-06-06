import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Apify actor that does the real work (runs server-side, billed pay-per-event).
const ACTOR_ID = 'apivault_labs~woocommerce-product-scraper';

export class WooCommerce implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WooCommerce Product Scraper',
		name: 'wooCommerce',
		icon: 'file:woocommerce.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["storeUrls"]}}',
		description:
			'Scrape any WooCommerce catalog via the public Store API: variant prices, reviews text, related products, discount %, intelligence score. Export to Shopify CSV or Google Merchant feed.',
		defaults: {
			name: 'WooCommerce Product Scraper',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'apifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'WooCommerce Store or Product URLs',
				name: 'storeUrls',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				required: true,
				placeholder: 'https://woocommerce.com',
				description:
					'Store domain (pulls entire catalog), product URL, or bare domain. Mix them freely. Separate multiple with a new line or comma.',
			},
			{
				displayName: 'Export Format',
				name: 'exportFormat',
				type: 'options',
				options: [
					{ name: 'Default JSON (full structured fields)', value: 'default' },
					{ name: 'Default + Shopify CSV Columns (migration)', value: 'shopify-csv' },
					{ name: 'Shopify CSV Only (clean migration export)', value: 'shopify-csv-only' },
					{ name: 'Default + Google Merchant Feed', value: 'google-merchant' },
					{ name: 'Google Merchant Only (clean ad feed)', value: 'google-merchant-only' },
					{ name: 'Custom CSV (specify columns)', value: 'custom-csv' },
					{ name: 'Catalog Snapshot (one aggregate record per store)', value: 'catalog-snapshot' },
				],
				default: 'default',
				description: 'Output format for each product record',
			},
			{
				displayName: 'Custom CSV Columns',
				name: 'customColumns',
				type: 'string',
				default: '',
				placeholder: 'productId,title,price,brand,inStock,averageRating',
				description:
					'Comma-separated column names. Only used when Export Format is "Custom CSV". Available: productId, productUrl, slug, title, price, regularPrice, salePrice, currency, discountPct, sku, brand, autoCategory, categories, tags, inStock, averageRating, reviewCount, popularityRank, isNewArrival, productIntelligenceScore, mainImage, images, variationsCount.',
				displayOptions: {
					show: {
						exportFormat: ['custom-csv'],
					},
				},
			},
			{
				displayName: 'Limits & Filters',
				name: 'limits',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Products per Store',
						name: 'maxProducts',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 10000 },
						default: 250,
						description: 'Limit per store (0 = unlimited)',
					},
					{
						displayName: 'Products per Page',
						name: 'perPage',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 100 },
						default: 100,
						description: 'Products per API page (WooCommerce max 100)',
					},
					{
						displayName: 'Only In-Stock Products',
						name: 'onlyInStock',
						type: 'boolean',
						default: false,
						description: 'Whether to skip out-of-stock products',
					},
					{
						displayName: 'Filter by Category Slug',
						name: 'category',
						type: 'string',
						default: '',
						placeholder: 'hoodies',
						description: 'Only fetch products from this category slug',
					},
					{
						displayName: 'Convert Prices to Currency',
						name: 'convertToCurrency',
						type: 'string',
						default: '',
						placeholder: 'USD',
						description:
							'Optional ISO currency code (USD, EUR, GBP). Adds an FX-converted price field when the store currency differs.',
					},
				],
			},
			{
				displayName: 'Variants & Reviews',
				name: 'variantsReviews',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'One Row per Variant',
						name: 'flattenVariants',
						type: 'boolean',
						default: false,
						description:
							'Whether to output one row per variant (size/color) with full variant prices and stock. Auto-enables Enrich Variants.',
					},
					{
						displayName: 'Enrich Variants (Full Data)',
						name: 'enrichVariants',
						type: 'boolean',
						default: false,
						description:
							'Whether to make a second API call per product for full variant prices, stock, attributes, related_ids and cross-sells. Slower but richer.',
					},
					{
						displayName: 'Extract Review Text',
						name: 'extractReviewsText',
						type: 'boolean',
						default: false,
						description:
							'Whether to pull actual review text + reviewer info per product. Adds 1 extra API call per product.',
					},
					{
						displayName: 'Reviews per Product',
						name: 'reviewsPerProduct',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 50 },
						default: 5,
						description: 'How many recent reviews to fetch per product when Extract Review Text is on',
					},
				],
			},
			{
				displayName: 'Fields to Extract',
				name: 'fields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				description: 'Toggle which product fields to extract. All on by default.',
				options: [
					{ displayName: 'Product Title', name: 'extractTitle', type: 'boolean', default: true, description: 'Whether to extract the product name' },
					{ displayName: 'Price', name: 'extractPrice', type: 'boolean', default: true, description: 'Whether to extract the current price' },
					{ displayName: 'Regular Price', name: 'extractRegularPrice', type: 'boolean', default: true, description: 'Whether to extract the regular (non-sale) price' },
					{ displayName: 'Sale Price', name: 'extractSalePrice', type: 'boolean', default: true, description: 'Whether to extract the sale price' },
					{ displayName: 'SKU', name: 'extractSku', type: 'boolean', default: true, description: 'Whether to extract SKU codes' },
					{ displayName: 'Description', name: 'extractDescription', type: 'boolean', default: true, description: 'Whether to extract the full description (HTML stripped)' },
					{ displayName: 'Short Description', name: 'extractShortDescription', type: 'boolean', default: true, description: 'Whether to extract the short description' },
					{ displayName: 'Images', name: 'extractImages', type: 'boolean', default: true, description: 'Whether to extract all image URLs' },
					{ displayName: 'Categories', name: 'extractCategories', type: 'boolean', default: true, description: 'Whether to extract the category list' },
					{ displayName: 'Tags', name: 'extractTags', type: 'boolean', default: true, description: 'Whether to extract product tags' },
					{ displayName: 'Attributes', name: 'extractAttributes', type: 'boolean', default: true, description: 'Whether to extract product attributes (brand, material, etc.)' },
					{ displayName: 'Stock / Availability', name: 'extractStock', type: 'boolean', default: true, description: 'Whether to extract stock status and low-stock count' },
					{ displayName: 'Rating', name: 'extractRating', type: 'boolean', default: true, description: 'Whether to extract average rating and review count' },
					{ displayName: 'Variations', name: 'extractVariations', type: 'boolean', default: true, description: 'Whether to extract variation IDs (when not flattening)' },
				],
			},
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Concurrency',
						name: 'maxConcurrency',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 10 },
						default: 3,
						description: 'Parallel store fetches',
					},
					{
						displayName: 'Timeout per Request (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 10, maxValue: 120 },
						default: 30,
						description: 'HTTP timeout per API call',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const rawUrls = this.getNodeParameter('storeUrls', i) as string;
				const storeUrls = rawUrls
					.split(/[\n,]+/)
					.map((u) => u.trim())
					.filter((u) => u.length > 0);

				if (storeUrls.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one WooCommerce store or product URL is required',
						{ itemIndex: i },
					);
				}

				const exportFormat = this.getNodeParameter('exportFormat', i, 'default') as string;
				const customColumns = this.getNodeParameter('customColumns', i, '') as string;
				const limits = this.getNodeParameter('limits', i, {}) as {
					maxProducts?: number;
					perPage?: number;
					onlyInStock?: boolean;
					category?: string;
					convertToCurrency?: string;
				};
				const variantsReviews = this.getNodeParameter('variantsReviews', i, {}) as {
					flattenVariants?: boolean;
					enrichVariants?: boolean;
					extractReviewsText?: boolean;
					reviewsPerProduct?: number;
				};
				const fields = this.getNodeParameter('fields', i, {}) as Record<string, boolean>;
				const advanced = this.getNodeParameter('advancedOptions', i, {}) as {
					maxConcurrency?: number;
					timeout?: number;
				};

				const body: Record<string, unknown> = {
					storeUrls,
					exportFormat,
					customColumns,
					maxProducts: limits.maxProducts ?? 250,
					perPage: limits.perPage ?? 100,
					onlyInStock: limits.onlyInStock ?? false,
					category: limits.category ?? '',
					convertToCurrency: limits.convertToCurrency ?? '',
					flattenVariants: variantsReviews.flattenVariants ?? false,
					enrichVariants: variantsReviews.enrichVariants ?? false,
					extractReviewsText: variantsReviews.extractReviewsText ?? false,
					reviewsPerProduct: variantsReviews.reviewsPerProduct ?? 5,
					// field toggles (defaults match the actor's input schema)
					extractTitle: fields.extractTitle ?? true,
					extractPrice: fields.extractPrice ?? true,
					extractRegularPrice: fields.extractRegularPrice ?? true,
					extractSalePrice: fields.extractSalePrice ?? true,
					extractSku: fields.extractSku ?? true,
					extractDescription: fields.extractDescription ?? true,
					extractShortDescription: fields.extractShortDescription ?? true,
					extractImages: fields.extractImages ?? true,
					extractCategories: fields.extractCategories ?? true,
					extractTags: fields.extractTags ?? true,
					extractAttributes: fields.extractAttributes ?? true,
					extractStock: fields.extractStock ?? true,
					extractRating: fields.extractRating ?? true,
					extractVariations: fields.extractVariations ?? true,
					// advanced
					maxConcurrency: advanced.maxConcurrency ?? 3,
					timeout: advanced.timeout ?? 30,
				};

				const options: IRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`,
					body,
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'apifyApi',
					options,
				);

				const results = Array.isArray(response) ? response : [response];
				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
