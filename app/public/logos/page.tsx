'use client';

export default function LogosTest() {
  const logos = ['amazon.png', 'ebay.png', 'shopify.png', 'default.png'];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Logo Test</h1>
      {logos.map((logo) => (
        <div key={logo} style={{ margin: '10px 0' }}>
          <img src={`/logos/${logo}`} alt={logo} width={100} />
          <p>{logo}</p>
        </div>
      ))}
    </div>
  );
}
