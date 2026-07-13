async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/uploads/logos/logo-1783924502961-564905881.png');
    console.log('Status:', res.status);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
