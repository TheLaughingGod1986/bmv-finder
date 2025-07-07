# Search After Pagination Implementation

This document explains the implementation of cursor-based pagination using Elasticsearch's `search_after` feature for the BMV Finder property search application.

## Overview

The application now uses **cursor-based pagination** instead of offset-based pagination to provide better performance and consistency when navigating through large result sets.

## Key Benefits

1. **Performance**: No need to skip records, making pagination faster for deep pages
2. **Consistency**: Results remain consistent even if new data is added between requests
3. **Scalability**: Works efficiently with large datasets
4. **No Duplicates**: Eliminates the issue of seeing the same properties on multiple pages

## Implementation Details

### Backend Changes (`src/app/api/property-es/route.ts`)

#### For Aggregated Searches (Postcodes)
- Uses **composite aggregation** with `after` parameter for pagination
- Returns `after_key` for next page navigation
- Includes `hasMore` flag to indicate if more results are available

#### For Non-Aggregated Searches (Towns/Cities)
- Uses **search_after** with sort criteria for pagination
- Returns sort values of the last hit for next page navigation
- Includes `hasMore` flag based on result count

### Frontend Changes (`src/app/page.tsx`)

#### State Management
```typescript
const [searchAfter, setSearchAfter] = useState<any>(null);
const [hasMore, setHasMore] = useState(false);
const [searchAfterHistory, setSearchAfterHistory] = useState<any[]>([]);
```

#### Navigation Logic
- **Next Page**: Uses current `searchAfter` cursor
- **Previous Page**: Uses `searchAfterHistory` to navigate backwards
- **New Search**: Resets all pagination state

#### API Request Structure
```typescript
{
  searchTerm: string,
  page: number,
  pageSize: number,
  searchAfter?: any // Cursor for pagination
}
```

#### API Response Structure
```typescript
{
  data: SoldPrice[],
  totalCount: number,
  nextSearchAfter?: any, // Cursor for next page
  hasMore: boolean // Whether more results are available
}
```

## Usage Examples

### Testing the Implementation

1. **Direct Elasticsearch Test**:
   ```bash
   node scripts/test-search-after.js
   ```

2. **API Endpoint Test**:
   ```bash
   node scripts/test-api-pagination.js
   ```

### Frontend Usage

The pagination automatically works when users:
1. Perform a search
2. Click "Next" to see more results
3. Click "Previous" to go back
4. Perform a new search (resets pagination)

## Technical Notes

### Cursor Structure

For **composite aggregations**:
```javascript
{
  address: "normalized_address_string"
}
```

For **search_after**:
```javascript
[dateOfTransfer_timestamp, document_id]
```

### Error Handling

- Invalid cursors are handled gracefully
- Network errors show appropriate user feedback
- Loading states prevent multiple simultaneous requests

### Performance Considerations

- Cursors are lightweight and efficient
- No need to calculate offsets
- Consistent performance regardless of page depth
- Memory usage scales with page size, not total results

## Migration from Offset Pagination

The implementation maintains backward compatibility:
- Page numbers are still tracked for UI display
- API accepts both old and new parameters
- Frontend gracefully handles both pagination types

## Future Enhancements

1. **Bidirectional Navigation**: Full support for jumping to specific pages
2. **Cursor Caching**: Store cursors in URL for bookmarkable pages
3. **Bulk Operations**: Support for fetching multiple pages at once
4. **Real-time Updates**: Handle data changes during pagination

## Troubleshooting

### Common Issues

1. **Empty Results on Page 2+**: Check if `searchAfter` is being passed correctly
2. **Duplicates Between Pages**: Verify cursor uniqueness and sorting
3. **Navigation Not Working**: Ensure `searchAfterHistory` is being maintained

### Debug Tools

- Browser Network tab to inspect API requests
- Console logs for cursor values
- Test scripts for validation

## Conclusion

The search_after pagination implementation provides a robust, scalable solution for navigating large property datasets while maintaining excellent user experience and performance. 