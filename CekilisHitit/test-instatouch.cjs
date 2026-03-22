// Quick test of instatouch comments method
const instaTouch = require('instatouch');

(async () => {
    try {
        console.log('Testing instatouch.comments...');
        const options = {
            count: 100,
            timeout: 200,
            filetype: 'na',
            session: 'sessionid=80006303056%3A0jYxELSNLOUpyr%3A14%3AAYi9RQQHc_s2H66KRkMocDWXgUg10gnRoTIVUEk3Kg'
        };
        console.log('Options:', JSON.stringify(options, null, 2));

        const result = await instaTouch.comments('DU03rCfiuag', options);
        console.log('Result keys:', Object.keys(result));
        console.log('Collector length:', result.collector?.length);
        if (result.collector?.length > 0) {
            console.log('First comment:', JSON.stringify(result.collector[0], null, 2));
        } else {
            console.log('FULL RESULT:', JSON.stringify(result, null, 2));
        }
    } catch (err) {
        console.error('ERROR:', err.message || err);
        console.error('Stack:', err.stack);
    }
})();
