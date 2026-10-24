const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resData) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        const isJson = (res.headers['content-type'] || '').includes('json');
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          contentDisposition: res.headers['content-disposition'],
          data: isJson ? JSON.parse(resData) : resData
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Logging in as Admin...');
  const login = await post('/api/v1/auth/login', {
    email: 'admin@store.com',
    password: 'Admin@123'
  });
  console.log('Login status:', login.status, 'Success:', login.data.success);
  const token = login.data.token;

  console.log('\n--- 1. Testing GET /api/v1/reports/sales-summary ---');
  const salesSummary = await get('/api/v1/reports/sales-summary?period=weekly', token);
  console.log('Sales summary status:', salesSummary.status);
  console.log('Totals:', salesSummary.data.totals);
  console.log('Daily count:', salesSummary.data.summary?.length);

  console.log('\n--- 2. Testing GET /api/v1/reports/top-products ---');
  const topProducts = await get('/api/v1/reports/top-products?limit=5', token);
  console.log('Top products status:', topProducts.status);
  console.log('Top products count:', topProducts.data.products?.length);
  if (topProducts.data.products?.length > 0) {
    console.log('First top product:', topProducts.data.products[0]);
  }

  console.log('\n--- 3. Testing GET /api/v1/reports/inventory-valuation ---');
  const valuation = await get('/api/v1/reports/inventory-valuation', token);
  console.log('Valuation status:', valuation.status);
  console.log('Valuation totals:', valuation.data.valuation);
  console.log('Category breakdown count:', valuation.data.category_breakdown?.length);

  console.log('\n--- 4. Testing GET /api/v1/reports/export-csv?type=sales ---');
  const exportCsv = await get('/api/v1/reports/export-csv?type=sales', token);
  console.log('Export CSV status:', exportCsv.status);
  console.log('Content-Type:', exportCsv.contentType);
  console.log('Content-Disposition:', exportCsv.contentDisposition);
  console.log('First 120 chars of CSV:', exportCsv.data.slice(0, 120));

  console.log('\n--- 5. Testing GET /api/v1/reports/export-csv?type=inventory ---');
  const invCsv = await get('/api/v1/reports/export-csv?type=inventory', token);
  console.log('Inv CSV status:', invCsv.status);
  console.log('First 120 chars of Inv CSV:', invCsv.data.slice(0, 120));
}

run().catch(console.error);
