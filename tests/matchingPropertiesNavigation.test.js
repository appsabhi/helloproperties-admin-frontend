import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

function findVNodes(node, predicate, results = []) {
  if (!node) return results;
  if (Array.isArray(node)) {
    for (const item of node) findVNodes(item, predicate, results);
    return results;
  }
  if (typeof node !== 'object') return results;
  if (predicate(node)) results.push(node);
  const children = node.props?.children;
  if (children) {
    findVNodes(children, predicate, results);
  }
  return results;
}

test('matching properties on Requirement Saved screen render with correct details and buttons', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { renderMatchingPropertiesScreen } = await server.ssrLoadModule('/tests/fixtures/matchingProperties.jsx');
    const html = renderMatchingPropertiesScreen();

    // 1. Success header and matching properties section
    assert.match(html, /Requirement Saved Successfully!/);
    assert.match(html, /Saved to database and visible in Buyer Requirements\./);
    assert.match(html, /Matching Properties/);
    assert.match(html, /2 Found/);

    // 2. Property 1 details
    assert.match(html, /92% Match/);
    assert.match(html, /Seaside Villa with Beach View/);
    assert.match(html, /Marine Drive, Ernakulam · Rahul Menon · 9876543210/);
    assert.match(html, /aria-label="View property details for Seaside Villa with Beach View"/);

    // 3. Property 2 details
    assert.match(html, /84% Match/);
    assert.match(html, /Modern Highrise Apartment/);
    assert.match(html, /Kakkanad, Ernakulam · Deepa Nair · 9123456780/);
    assert.match(html, /aria-label="View property details for Modern Highrise Apartment"/);

    // 4. Clickability classes
    assert.match(html, /cursor-pointer/);
    assert.match(html, /hover:border-\[#B0004F\]\/40/);

    // 5. Done button unchanged
    assert.match(html, /Done — Back to Requirements/);
  } finally {
    await server.close();
  }
});

test('clicking matching property card or title triggers property-specific navigation', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { captureMatchingPropertiesVNodes, sampleMatchingProperties } =
      await server.ssrLoadModule('/tests/fixtures/matchingProperties.jsx');

    let navigatedPath = null;
    let navigatedState = null;
    const vdom = captureMatchingPropertiesVNodes({
      onNavigate: (path, options) => {
        navigatedPath = path;
        navigatedState = options?.state;
      }
    });
    assert.ok(vdom, 'Component VNode tree should be captured');

    // Find all matching property button cards
    const propertyCards = findVNodes(vdom, n =>
      n.type === 'button' &&
      n.props &&
      typeof n.props['aria-label'] === 'string' &&
      n.props['aria-label'].startsWith('View property details for')
    );

    assert.equal(propertyCards.length, 2, 'Should find 2 matching property cards');

    // 1. Verify clicking Card 1 navigates to /properties/42 with state
    const card1 = propertyCards[0];
    assert.equal(card1.props['aria-label'], 'View property details for Seaside Villa with Beach View');

    card1.props.onClick();
    assert.equal(navigatedPath, '/properties/42', 'Card 1 click must navigate to /properties/42');
    assert.equal(navigatedState?.fromTab, 'requirements', 'Navigation state must retain fromTab');
    assert.ok(navigatedState?.fromPath.includes('/properties/requirements'), 'Navigation state must retain fromPath');

    // Reset spy
    navigatedPath = null;

    // 2. Verify clicking Title 1 inside Card 1 navigates to /properties/42 and stops event propagation
    const title1 = findVNodes(card1, n => n.type === 'p' && n.props?.children === sampleMatchingProperties[0].title)[0];
    assert.ok(title1, 'Card 1 should contain its title element');

    let stoppedPropagation = false;
    title1.props.onClick({ stopPropagation: () => { stoppedPropagation = true; } });
    assert.equal(stoppedPropagation, true, 'Title click must stop event propagation');
    assert.equal(navigatedPath, '/properties/42', 'Title 1 click must navigate to /properties/42');

    // Reset spy
    navigatedPath = null;

    // 3. Verify clicking Card 2 navigates to /properties/108 (and NOT /properties/42)
    const card2 = propertyCards[1];
    assert.equal(card2.props['aria-label'], 'View property details for Modern Highrise Apartment');

    card2.props.onClick();
    assert.equal(navigatedPath, '/properties/108', 'Card 2 click must navigate to its own property id /properties/108');
    assert.notEqual(navigatedPath, '/properties/42', 'Card 2 must not open Card 1 details');

    // Reset spy
    navigatedPath = null;

    // 4. Verify clicking Title 2 navigates to /properties/108
    const title2 = findVNodes(card2, n => n.type === 'p' && n.props?.children === sampleMatchingProperties[1].title)[0];
    assert.ok(title2, 'Card 2 should contain its title element');

    title2.props.onClick({ stopPropagation: () => {} });
    assert.equal(navigatedPath, '/properties/108', 'Title 2 click must navigate to /properties/108');
  } finally {
    await server.close();
  }
});

test('property navigation routes to specific property id and handles propertyId fallback', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { captureMatchingPropertiesVNodes } = await server.ssrLoadModule('/tests/fixtures/matchingProperties.jsx');

    const fallbackMatches = [
      {
        propertyId: 'HP-FALLBACK-99',
        title: 'Commercial Land Strip',
        location: 'Edappally',
        district: 'Ernakulam',
        ownerName: 'George',
        phoneNumber: '9988776655',
        listingType: 'Sale',
        expectedPrice: 20000000,
        matchScore: 90
      }
    ];

    let navigatedPath = null;
    const vdom = captureMatchingPropertiesVNodes({
      initialAddRequirementResult: {
        success: true,
        matches: fallbackMatches
      },
      onNavigate: (path) => { navigatedPath = path; }
    });

    const propertyCards = findVNodes(vdom, n =>
      n.type === 'button' &&
      n.props &&
      typeof n.props['aria-label'] === 'string' &&
      n.props['aria-label'].includes('Commercial Land Strip')
    );

    assert.equal(propertyCards.length, 1);
    const card = propertyCards[0];
    assert.equal(card.props['aria-label'], 'View property details for Commercial Land Strip');

    card.props.onClick();
    assert.equal(navigatedPath, '/properties/HP-FALLBACK-99', 'Should route to fallback propertyId');
  } finally {
    await server.close();
  }
});
