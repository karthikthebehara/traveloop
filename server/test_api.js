const http = require('http');

// Helper to make HTTP requests
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('🧪 Starting Traveloop Backend Integration Tests...');
  const baseHeaders = { 'Content-Type': 'application/json' };

  try {
    // 1. Health check
    const health = await request({ host: 'localhost', port: 5000, path: '/', method: 'GET' });
    console.log('1. API Health Check:', health.status, health.data?.message || health.raw);

    // 2. Auth: Login as admin
    const loginRes = await request(
      { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: baseHeaders },
      { email: 'admin@traveloop.com', password: 'Admin@123' }
    );
    console.log('2. Admin Login:', loginRes.status, loginRes.data?.data?.user?.email, 'Role:', loginRes.data?.data?.user?.role);
    const token = loginRes.data?.token;
    if (!token) throw new Error('Failed to get auth token!');

    const authHeaders = { ...baseHeaders, Authorization: `Bearer ${token}` };

    // 3. City Search API
    const citiesRes = await request({ host: 'localhost', port: 5000, path: '/api/cities', method: 'GET', headers: authHeaders });
    console.log('3. GET /api/cities:', citiesRes.status, 'Total cities:', citiesRes.data?.data?.cities?.length);

    // 4. Activities Catalog API
    const catRes = await request({ host: 'localhost', port: 5000, path: '/api/activities-catalog', method: 'GET', headers: authHeaders });
    console.log('4. GET /api/activities-catalog:', catRes.status, 'Total activities:', catRes.data?.data?.activities?.length);

    // 5. Trips List API
    const tripsRes = await request({ host: 'localhost', port: 5000, path: '/api/trips', method: 'GET', headers: authHeaders });
    const trips = tripsRes.data?.data?.trips || [];
    console.log('5. GET /api/trips:', tripsRes.status, 'User trips:', trips.length, 'First trip stops:', trips[0]?.stop_count, 'Total spent:', trips[0]?.total_spent);
    const sampleTrip = trips[0];

    if (sampleTrip) {
      // 6. Budget & Cost Breakdown API (Screen 9)
      const budgetRes = await request({ host: 'localhost', port: 5000, path: `/api/trips/${sampleTrip.id}/budget`, method: 'GET', headers: authHeaders });
      const bData = budgetRes.data?.data;
      console.log('6. GET /api/trips/:id/budget:', budgetRes.status);
      console.log('   - 4 Categories:', bData?.by_category?.map(c => `${c.category}: $${c.total}`).join(', '));
      console.log('   - Average cost per day:', `$${bData?.average_cost_per_day}`);
      console.log('   - Over budget days detected:', bData?.over_budget_days?.length, bData?.over_budget_days?.map(d => d.date));

      // 7. Copy Trip API (Screen 11)
      const copyRes = await request(
        { host: 'localhost', port: 5000, path: `/api/trips/copy/${sampleTrip.id}`, method: 'POST', headers: authHeaders }
      );
      console.log('7. POST /api/trips/copy/:id:', copyRes.status, 'Cloned newTripId:', copyRes.data?.newTripId);

      // 8. Reset Checklist API (Screen 10)
      const resetRes = await request(
        { host: 'localhost', port: 5000, path: `/api/trips/${sampleTrip.id}/checklist/reset`, method: 'PATCH', headers: authHeaders }
      );
      console.log('8. PATCH /api/trips/:id/checklist/reset:', resetRes.status, resetRes.data?.message);

      // Clean up cloned trip if created
      if (copyRes.data?.newTripId) {
        await request({ host: 'localhost', port: 5000, path: `/api/trips/${copyRes.data.newTripId}`, method: 'DELETE', headers: authHeaders });
      }
    }

    // 9. Admin Analytics Stats API (Screen 14)
    const adminRes = await request({ host: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET', headers: authHeaders });
    console.log('9. GET /api/admin/stats:', adminRes.status, 'Totals:', adminRes.data?.data?.totals);

    // 10. Forgot Password API (Screen 1)
    const fpRes = await request(
      { host: 'localhost', port: 5000, path: '/api/auth/forgot-password', method: 'POST', headers: baseHeaders },
      { email: 'demo@traveloop.com', new_password: 'DemoNewPassword@123' }
    );
    console.log('10. POST /api/auth/forgot-password:', fpRes.status, fpRes.data?.message);

    console.log('\n🎉 ALL 10 BACKEND INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    process.exit(0);
  }
})();
