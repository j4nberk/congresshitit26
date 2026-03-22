import fetch from 'node-fetch'; // Vite environments often support fetch natively, but we'll use a standard script

async function testIG() {
    const token = process.argv[2];
    const userId = process.argv[3];
    const shortcode = process.argv[4];

    if (!token || !userId || !shortcode) {
        console.log("Usage: node test-ig.js <token> <user_id> <shortcode>");
        return;
    }

    console.log("Testing Page Check...");
    try {
        const pageCheckRes = await fetch(`https://graph.facebook.com/v20.0/${userId}?fields=instagram_business_account&access_token=${token}`);
        const pageCheckData = await pageCheckRes.json();
        console.log("Page Check Result:", JSON.stringify(pageCheckData, null, 2));

        let activeIgUserId = userId;
        if (pageCheckData && pageCheckData.instagram_business_account && pageCheckData.instagram_business_account.id) {
            activeIgUserId = pageCheckData.instagram_business_account.id;
        }

        console.log("Using IG User ID:", activeIgUserId);

        console.log("\nTesting Media Fetch (Edge)...");
        const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${activeIgUserId}/media?limit=5&access_token=${token}`);
        const mediaData = await mediaRes.json();
        console.log("Media Fetch Result:", JSON.stringify(mediaData, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

testIG();
