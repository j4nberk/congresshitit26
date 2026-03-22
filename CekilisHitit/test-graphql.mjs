// Direct GraphQL comment scraper test
// Uses the known query hash for edge_media_to_parent_comment

const QUERY_HASH = '97b41c52301f77ce508f55e66d17620e';
const SHORTCODE = 'DU03rCfiuag';
const SESSION_COOKIE = 'sessionid=80006303056%3A0jYxELSNLOUpyr%3A14%3AAYi9RQQHc_s2H66KRkMocDWXgUg10gnRoTIVUEk3Kg';

(async () => {
    try {
        const variables = JSON.stringify({ shortcode: SHORTCODE, first: 50 });
        const url = `https://www.instagram.com/graphql/query/?query_hash=${QUERY_HASH}&variables=${encodeURIComponent(variables)}`;

        console.log('Fetching:', url.substring(0, 100) + '...');

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Requested-With': 'XMLHttpRequest',
                'X-IG-App-ID': '936619743392459',
                'Referer': `https://www.instagram.com/p/${SHORTCODE}/`,
                'Cookie': SESSION_COOKIE
            }
        });

        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));

        const text = await res.text();

        if (res.status !== 200) {
            console.log('Response (first 500 chars):', text.substring(0, 500));
            return;
        }

        try {
            const data = JSON.parse(text);
            const media = data?.data?.shortcode_media;
            if (!media) {
                console.log('No shortcode_media found. Keys:', Object.keys(data?.data || data || {}));
                console.log('Full response (first 500):', text.substring(0, 500));
                return;
            }

            const comments = media.edge_media_to_parent_comment;
            console.log('Total comment count:', comments?.count);
            console.log('Edges count:', comments?.edges?.length);
            console.log('Has next page:', comments?.page_info?.has_next_page);

            if (comments?.edges?.length > 0) {
                const first = comments.edges[0].node;
                console.log('First comment:', {
                    username: first.owner?.username,
                    text: first.text?.substring(0, 50)
                });
            }
        } catch (parseErr) {
            console.log('JSON parse error:', parseErr.message);
            console.log('Response (first 500):', text.substring(0, 500));
        }

    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
})();
