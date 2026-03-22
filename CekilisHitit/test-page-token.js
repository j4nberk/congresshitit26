const TOKEN = 'EAA8FOiMAqhABQz0X49yGaGoKySIoIx1eOI4gvTXRyCtvx5rHdGvn2lXxnaono9Q9arJ36GEjiqGgssDWSS3l8sNVctBjsezyMTGBKpJtu0YcAnI8l2pZAjzQE5tzjEw5uUrLfXD31fjzuDvtqAf9ZCzydgy6EZAfUvk1jqJSHX2qzXWh2BLw7gCfvCbCTU3BZBVXY8rvxvPMW448C57sZB7ZBInldjCzgkVvpA5rpDp4xZCq0IIrKdjQ6e2Jjuk32ZAgZCuFWExhs92jzp6s8ZARhTAaQ5qNEY5crZCUwZDZD';

async function test() {
    console.log('Step 1: Getting IG Business Account...');
    const r1 = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name,instagram_business_account&access_token=${TOKEN}`);
    const d1 = await r1.json();
    console.log('Result:', JSON.stringify(d1, null, 2));

    if (d1.instagram_business_account) {
        const igId = d1.instagram_business_account.id;
        console.log('\nStep 2: Getting media for IG ID:', igId);
        const r2 = await fetch(`https://graph.facebook.com/v20.0/${igId}/media?fields=id,shortcode&limit=5&access_token=${TOKEN}`);
        const d2 = await r2.json();
        console.log('Media:', JSON.stringify(d2, null, 2));

        // Try comments on the known media ID
        console.log('\nStep 3: Fetching comments for media 18005372591699191...');
        const r3 = await fetch(`https://graph.facebook.com/v20.0/18005372591699191/comments?fields=text,username&limit=5&access_token=${TOKEN}`);
        const d3 = await r3.json();
        console.log('Comments:', JSON.stringify(d3, null, 2));
    }
}

test().catch(console.error);
