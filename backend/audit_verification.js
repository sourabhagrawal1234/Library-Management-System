const http = require('http');

const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

async function runAudit() {
  console.log('========================================================');
  console.log('🧪 RUNNING LMS FULL FUNCTIONALITY & API AUDIT');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title} ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('GET', '/health');
    assert('API Health Check', health.status === 200 && health.body.status === 'online');

    // 2. Books Catalog & Filters
    const booksRes = await request('GET', '/books?limit=10');
    assert('Fetch Books Catalog', booksRes.status === 200 && booksRes.body.books.length > 0, `Count: ${booksRes.body.books?.length}`);

    const searchRes = await request('GET', '/books?search=Clean%20Code');
    assert('Search Books by Title', searchRes.status === 200 && searchRes.body.books.some(b => b.title.includes('Clean Code')));

    const authorRes = await request('GET', '/books?author=Robert');
    assert('Filter Books by Author', authorRes.status === 200 && authorRes.body.books.length > 0);

    const catRes = await request('GET', '/categories');
    assert('Fetch Categories', catRes.status === 200 && catRes.body.categories.length >= 8);

    // 3. User Authentication
    const studentLogin = await request('POST', '/auth/login', {
      email: 'student@library.com',
      password: 'Student@123'
    });
    assert('Student Login', studentLogin.status === 200 && studentLogin.body.token);
    const studentToken = studentLogin.body.token;

    const staffLogin = await request('POST', '/auth/login', {
      email: 'staff@library.com',
      password: 'Staff@123'
    });
    assert('Staff Login', staffLogin.status === 200 && staffLogin.body.token);
    const staffToken = staffLogin.body.token;

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@library.com',
      password: 'Admin@123'
    });
    assert('Admin Login', adminLogin.status === 200 && adminLogin.body.token);
    const adminToken = adminLogin.body.token;

    // 4. Student Dashboard & Records
    const userDash = await request('GET', '/reports/user-dashboard', null, studentToken);
    assert('Student Dashboard Stats', userDash.status === 200 && userDash.body.stats);

    const myBooks = await request('GET', '/issues/my', null, studentToken);
    assert('Student My Books Records', myBooks.status === 200 && Array.isArray(myBooks.body.issues));

    // Overdue student login with fines
    const overdueStudent = await request('POST', '/auth/login', {
      email: 'rahul@college.edu',
      password: 'Student@123'
    });
    const overdueToken = overdueStudent.body.token;

    const myFines = await request('GET', '/fines/my', null, overdueToken);
    assert('Student My Fines Query', myFines.status === 200 && myFines.body.fines.length > 0, `Fines: ${myFines.body.fines?.length}`);

    // 5. Public Registration Security & End-to-End Fine/Payment Cycle
    const auditUserEmail = `audit_${Date.now()}@college.edu`;
    const regRes = await request('POST', '/auth/register', {
      name: 'Audit Test Student',
      email: auditUserEmail,
      phone: '+91 99999 11111',
      password: 'Student@123',
      confirmPassword: 'Student@123'
    });
    assert('Register Member Account (Public Role restricted to User/Student)', regRes.status === 201 && regRes.body.user?.role === 'user');
    const auditToken = regRes.body?.token;

    // Direct issue overdue book and return to dynamically create fine
    const bookToIssue = booksRes.body.books[0]._id;
    const issueRes = await request('POST', '/issues/direct-issue', {
      userEmail: auditUserEmail,
      bookId: bookToIssue,
      days: -4
    }, staffToken);

    if (issueRes.body?.issue?._id) {
      const returnRes = await request('PUT', `/issues/${issueRes.body.issue._id}/return`, {}, staffToken);
      const auditFine = returnRes.body?.fine;
      assert('Automatic Server Overdue Fine Calculation on Return', [200, 201].includes(returnRes.status) && auditFine && auditFine.totalFine > 0);

      if (auditFine) {
        // Test 5a: Missing UTR should fail
        const missingUtrRes = await request('POST', '/payments/process', {
          fineId: auditFine._id,
          paymentMethod: 'UPI'
        }, auditToken);
        assert('Reject Payment with Missing UTR (400)', missingUtrRes.status === 400);

        // Test 5b: Short UTR (e.g. "123") should fail
        const shortUtrRes = await request('POST', '/payments/process', {
          fineId: auditFine._id,
          paymentMethod: 'UPI',
          utrNumber: '123'
        }, auditToken);
        assert('Reject Payment with Short UTR (e.g. 123) (400)', shortUtrRes.status === 400);

        // Test 5c: Repeating dummy UTR (e.g. "000000000000") should fail
        const repeatingUtrRes = await request('POST', '/payments/process', {
          fineId: auditFine._id,
          paymentMethod: 'UPI',
          utrNumber: '000000000000'
        }, auditToken);
        assert('Reject Payment with Repeating Dummy UTR (400)', repeatingUtrRes.status === 400);

        // Test 5d: Sequential dummy UTR (e.g. "123456789012") should fail
        const seqUtrRes = await request('POST', '/payments/process', {
          fineId: auditFine._id,
          paymentMethod: 'UPI',
          utrNumber: '123456789012'
        }, auditToken);
        assert('Reject Payment with Sequential Dummy UTR (400)', seqUtrRes.status === 400);

        // Test 5e: Valid 12-Digit NPCI UTR (e.g. 4257 + 8 random digits) should succeed
        const validUtr = '4257' + Math.floor(10000000 + Math.random() * 90000000).toString();
        const validPayRes = await request('POST', '/payments/process', {
          fineId: auditFine._id,
          paymentMethod: 'UPI',
          utrNumber: validUtr
        }, auditToken);
        assert('Accept Payment with Valid 12-Digit PhonePe UTR (201)', [200, 201].includes(validPayRes.status) && validPayRes.body.success);

        // Test 5f: Duplicate UTR should be rejected
        if (validPayRes.body.payment) {
          const dupRes = await request('POST', '/payments/process', {
            fineId: auditFine._id,
            paymentMethod: 'UPI',
            utrNumber: validUtr
          }, auditToken);
          assert('Reject Payment with Duplicate UTR (Anti-Fraud Check) (400)', dupRes.status === 400);

          // Test 5g: Payment Receipt
          const receiptRes = await request('GET', `/payments/${validPayRes.body.payment._id}/receipt`, null, auditToken);
          assert('Generate Official Payment Receipt with UTR', [200, 201].includes(receiptRes.status) && receiptRes.body.receipt.utrNumber === validUtr);

          // Test 5h: Admin Toggle Verification Status
          const toggleRes = await request('PUT', `/payments/${validPayRes.body.payment._id}/verify`, {
            verificationStatus: 'flagged'
          }, adminToken);
          assert('Admin Update Verification Status', toggleRes.status === 200 && toggleRes.body.payment.verificationStatus === 'flagged');
        }
      }
    }

    // 6. Staff Dashboard & Circulation Operations
    const staffDash = await request('GET', '/reports/staff-dashboard', null, staffToken);
    assert('Staff Dashboard Metrics', staffDash.status === 200 && staffDash.body.stats.totalBooks > 0);

    // Book Request and Staff Approval (pick a book with no active issue for student)
    const issuedBookIds = (myBooks.body.issues || []).map(i => i.book?._id);
    const availableBook = booksRes.body.books.find(b => !issuedBookIds.includes(b._id) && b.availableCopies > 0) || booksRes.body.books[5];
    const reqBook = await request('POST', '/issues/request', { bookId: availableBook._id }, studentToken);
    assert('Student Request Book', [200, 201].includes(reqBook.status) && reqBook.body.success, `Msg: ${reqBook.body.message}`);

    if (reqBook.body.issue?._id) {
      const approveRes = await request('PUT', `/issues/${reqBook.body.issue._id}/approve`, {}, staffToken);
      assert('Staff Approve Book Request', [200, 201].includes(approveRes.status) && approveRes.body.success);
    }

    // 7. Admin Dashboard & Analytics
    const adminDash = await request('GET', '/reports/admin-dashboard', null, adminToken);
    assert('Admin Dashboard Stats', adminDash.status === 200 && adminDash.body.stats.totalUsers > 0 && adminDash.body.stats.totalBooks > 0);
    assert('Admin Category Distribution Chart Data', adminDash.body.categoryDistribution && adminDash.body.categoryDistribution.length > 0);

    const detailedReports = await request('GET', '/reports/detailed?timeRange=all', null, adminToken);
    assert('Admin Detailed Analytics Reports', detailedReports.status === 200 && detailedReports.body.summary);

  } catch (err) {
    console.error('Audit encountered unexpected error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runAudit();
