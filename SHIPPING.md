# Shipping quotes

The quote route is prepared but is not active until a live carrier connection and verified parcel profiles are supplied. It never buys labels or places orders.

Set Worker secrets SHIPPO_API_TOKEN (live only), SHIPPO_ORIGIN_JSON (verified full U.S. prep address), and SHIPPO_PARCEL_PROFILES_JSON. Do not put credentials, private source costs, or addresses in browser code. Profiles are keyed by retail SKU and exact quantity, e.g. SKU -> "1" -> {"verified":true,"parcel":{"length":measured_inches,"width":measured_inches,"height":measured_inches,"weight":packed_pounds,"distance_unit":"in","mass_unit":"lb"}}. These measurements must describe the packed shipping carton, not the manufacturer box. Unconfigured quantities return a manual shipping confirmation message.

ZIP quotes are estimates. Confirm complete recipient address, tax, final charges, stock, and payment before purchase. Test tokens/rates and zero rates are rejected. API errors return a customer-safe response. No label purchase endpoint is called.

Three supplier assortments remain unpublished until individual contents/photos are verified: HSF3711B, HSG1532A, FU95839A. Four verified assortments were split into 15 individual retail SKUs; all supplier case parents were removed from customer listings. Original manufacturer retail sets remain one packaged retail item.
