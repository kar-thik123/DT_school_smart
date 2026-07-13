async function run() {
  const res = await fetch('http://localhost:4200/index.html');
  console.log('Status:', res.status);
  console.log('Text:', (await res.text()).substring(0, 1000));
}
run().catch(console.error);
