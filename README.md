# Google Photos Bulk Delete

A browser-console script that repeatedly selects available Google Photos items and moves them to the bin.

It automatically clicks the bin confirmation for each batch. It does not empty the bin or permanently delete items.

## Usage

1. Open Google Photos in your browser and check that you are in the correct account and view. The script acts on available items in that view; it has no date or album filter of its own.
2. Clear any existing selection and close any confirmation dialogue.
3. Open the browser developer tools and select the Console.
4. Open [google-photos-bulk-delete.js](google-photos-bulk-delete.js), copy its complete contents, then paste and run it in the Console.
5. Keep the page stationary. Do not scroll, navigate, refresh or close the tab while it runs. Keep the computer awake.

Only run code you have reviewed and understand. This script changes your Google Photos library.

## Stop

Run this in the same tab's Console:

```javascript
photoDeleter.stop();
```

The script stops at its next stop check. A batch already submitted may still complete. Any selected items from an unfinished batch can remain selected.

Before restarting, clear the selection and close any confirmation dialogue. Each run starts its counter at zero.

## Configuration

The CONFIG object near the top of the script contains the timings, batch size and selectors.

- Batch size is a maximum of 100 available checkboxes, not a guarantee of 100 items per batch.
- General timeout: 30 seconds.
- Selection timeout: 10 seconds.
- Delay between batches: 1.5 seconds.
- The script matches the UK interface wording, **Move to bin**. For a different interface wording, amend both deleteButton and confirmationText.

## Progress and limitations

- The total counts visible selected checkboxes submitted through the bin confirmation. It is not a server-verified deletion total.
- Google Photos dynamically replaces thumbnails. Manual scrolling during selection can cause a timeout.
- Background tabs may be throttled or suspended by the browser. Keeping the page visible is preferable.
- A timeout finding selectable items does not prove the library is empty. Inspect the page before restarting.
- The script does not automatically scroll or guarantee that every item in the library will be processed.
- If selected thumbnail elements are recycled instead of removed, verification may time out even after a bin request.
- Duplicate photo labels cannot uniquely identify replacement checkbox elements, so selection verification may stop.
- Google Photos can change its page structure or selectors, causing the script to stop working.
- No automatic retry click is used, to avoid toggling a delayed selection back off.

## Validation

The author reported consecutive successful batches using this version with the page stationary. Earlier runs encountered selection timeouts, including after manual scrolling. This is limited manual validation, not a guarantee across accounts, browsers or future Google Photos versions.

An unofficial utility, not affiliated with or endorsed by Google.
