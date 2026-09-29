const https = require('https');

https.get('https://helloproperties-backend.vercel.app/api/buy-requirements', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Total reqs:', parsed.data ? parsed.data.length : 'none');
      if (parsed.data && parsed.data.length > 0) {
        const req = parsed.data.find(r => r.requirementTitle === 'test' || r.buyerName === 'test') || parsed.data[0];
        console.log(JSON.stringify(req, null, 2));
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (err) => console.error(err));
