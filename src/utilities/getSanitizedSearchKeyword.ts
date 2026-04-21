// Utility to sanitize search keyword so that if it matches the page name, returns empty string
export function getSanitizedSearchKeyword(pageName: string, searchParams: { get: (key: string) => string | null }) {
    let search = searchParams.get('search') || '';
    if (search.trim().toLowerCase() === pageName.trim().toLowerCase()) {
        return '';
    }
    return search;
}
