import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

function findVNodes(node, predicate, results = []) {
  if (!node || typeof node !== 'object') return results;
  if (predicate(node)) results.push(node);
  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) findVNodes(child, predicate, results);
  } else if (children && typeof children === 'object') {
    findVNodes(children, predicate, results);
  }
  return results;
}

test('BuyerRequirementPropertyTracking renders header, states and role restrictions', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { renderBuyerTrackingComponent } = await server.ssrLoadModule('/tests/fixtures/buyerTracking.jsx');

    // 1. Staff rendering has Link Property button
    const staffHtml = renderBuyerTrackingComponent({
      user: { userId: 'staff-1', role: 'Staff' }
    });
    assert.match(staffHtml, /Linked Properties &amp; Customer Journey/);
    assert.match(staffHtml, /Link Property/);

    // 2. Admin rendering has Link Property button
    const adminHtml = renderBuyerTrackingComponent({
      user: { userId: 'admin-1', role: 'Admin' }
    });
    assert.match(adminHtml, /Link Property/);

    // 3. Unauthorized user (Guest / viewer) cannot manage
    const guestHtml = renderBuyerTrackingComponent({
      user: { userId: 'guest-1', role: 'Guest' }
    });
    assert.match(guestHtml, /Linked Properties &amp; Customer Journey/);
    assert.doesNotMatch(guestHtml, />Link Property</);
  } finally {
    await server.close();
  }
});

test('property cards have clickable non-action area, obvious clickability styling, and helper label', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { renderBuyerTrackingComponent, sampleLinkedProperties, sampleTimelineData } =
      await server.ssrLoadModule('/tests/fixtures/buyerTracking.jsx');

    const html = renderBuyerTrackingComponent({
      initialLinkedProperties: sampleLinkedProperties,
      initialSelectedPropertyId: 10,
      initialTimelineData: sampleTimelineData,
      onNavigateToProperty: () => {}
    });

    // Requirement 3: helper label is present
    assert.match(html, /Click a property card to view its journey\./);

    // Requirement 2: redundant "Viewing Timeline" and "Select for Timeline" text links are removed
    assert.doesNotMatch(html, /Viewing Timeline/);
    assert.doesNotMatch(html, /Select for Timeline/);

    // Requirement 4: active card has pink selected border and "Timeline selected" badge
    assert.match(html, /border-\[#B0004F\]/);
    assert.match(html, /Timeline selected/);

    // Requirement 6: cards have role="button" and tabIndex
    assert.match(html, /role="button"/);
    assert.match(html, /tabindex="0"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /aria-pressed="false"/);

    // Requirement 3: cursor-pointer and hover transitions
    assert.match(html, /cursor-pointer/);
    assert.match(html, /hover:border-slate-300/);
    assert.match(html, /hover:bg-slate-50\/70/);
    assert.match(html, /focus-visible:ring-\[#B0004F\]/);
  } finally {
    await server.close();
  }
});

test('timeline switching displays selected property timeline without database mutations', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { renderBuyerTrackingComponent, sampleLinkedProperties, sampleTimelineData, sampleTimelineData2 } =
      await server.ssrLoadModule('/tests/fixtures/buyerTracking.jsx');

    // Render with property 10 selected
    const html1 = renderBuyerTrackingComponent({
      initialLinkedProperties: sampleLinkedProperties,
      initialSelectedPropertyId: 10,
      initialTimelineData: sampleTimelineData
    });
    assert.match(html1, /Customer Journey Timeline: Marine Drive Sea Villa/);
    assert.match(html1, /Initial Property Selection/);

    // Render with property 20 selected
    const html2 = renderBuyerTrackingComponent({
      initialLinkedProperties: sampleLinkedProperties,
      initialSelectedPropertyId: 20,
      initialTimelineData: sampleTimelineData2
    });
    assert.match(html2, /Customer Journey Timeline: Panampilly Nagar Apartment/);
    assert.match(html2, /Site Visit Arranged/);

    // Property 20 now holds the active badge
    assert.match(html2, /Timeline selected/);
  } finally {
    await server.close();
  }
});

test('keyboard accessibility: cards support Enter and Space activation with suitable focus styling', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { captureBuyerTrackingVNodes } = await server.ssrLoadModule('/tests/fixtures/buyerTracking.jsx');

    const vdom = captureBuyerTrackingVNodes();
    const cards = findVNodes(vdom, n => n.props && n.props.role === 'button');
    assert.equal(cards.length, 2, 'Should find 2 selectable property cards');

    const firstCard = cards[0];
    assert.equal(firstCard.props.tabIndex, 0);
    assert.equal(firstCard.props['aria-pressed'], true);
    assert.ok(firstCard.props.className.includes('cursor-pointer'));
    assert.ok(firstCard.props.className.includes('focus-visible:ring-[#B0004F]'));

    // Test Enter key activation
    let enterPrevented = false;
    firstCard.props.onKeyDown({
      key: 'Enter',
      preventDefault: () => { enterPrevented = true; }
    });
    assert.equal(enterPrevented, true, 'Enter key must trigger preventDefault and card selection');

    // Test Space key activation
    let spacePrevented = false;
    firstCard.props.onKeyDown({
      key: ' ',
      preventDefault: () => { spacePrevented = true; }
    });
    assert.equal(spacePrevented, true, 'Space key must trigger preventDefault and card selection');

    // Non-activation key (e.g. Tab) should not call preventDefault
    let tabPrevented = false;
    firstCard.props.onKeyDown({
      key: 'Tab',
      preventDefault: () => { tabPrevented = true; }
    });
    assert.equal(tabPrevented, false, 'Tab key must not call preventDefault');
  } finally {
    await server.close();
  }
});

test('action controls function independently and prevent event propagation to card selection', async () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

  try {
    const { captureBuyerTrackingVNodes } = await server.ssrLoadModule('/tests/fixtures/buyerTracking.jsx');

    let navigatedPropertyId = null;
    const vdom = captureBuyerTrackingVNodes({
      onNavigateToProperty: (id) => { navigatedPropertyId = id; }
    });

    // 1. Actions container stops click and keydown propagation
    const actionContainers = findVNodes(vdom, n => n.props && typeof n.props.className === 'string' && n.props.className.includes('ml-auto'));
    assert.ok(actionContainers.length >= 1, 'Should find actions container');
    const actionContainer = actionContainers[0];

    let containerClickStopped = false;
    actionContainer.props.onClick({ stopPropagation: () => { containerClickStopped = true; } });
    assert.equal(containerClickStopped, true, 'Actions container must stop click propagation');

    let containerKeyStopped = false;
    actionContainer.props.onKeyDown({ stopPropagation: () => { containerKeyStopped = true; } });
    assert.equal(containerKeyStopped, true, 'Actions container must stop keydown propagation');

    // 2. Buttons inside action container
    const buttons = findVNodes(actionContainer, n => n.type === 'button');
    assert.ok(buttons.length >= 3, 'Should find navigate, update stage, and unlink buttons');

    // External link button
    const navBtn = buttons.find(b => b.props.title === 'View property details');
    assert.ok(navBtn, 'Should find external details button');
    let navStopped = false;
    navBtn.props.onClick({ stopPropagation: () => { navStopped = true; } });
    assert.equal(navStopped, true, 'Nav button must stop event propagation');
    assert.equal(navigatedPropertyId, 10, 'Nav button must invoke onNavigateToProperty with propId');

    // Update Stage button
    const updateBtn = buttons.find(b => b.props.children && JSON.stringify(b.props.children).includes('Update Stage'));
    assert.ok(updateBtn, 'Should find Update Stage button');
    let updateStopped = false;
    updateBtn.props.onClick({ stopPropagation: () => { updateStopped = true; } });
    assert.equal(updateStopped, true, 'Update Stage button must stop event propagation');

    // Unlink button
    const unlinkBtn = buttons.find(b => b.props.title === 'Unlink property');
    assert.ok(unlinkBtn, 'Should find unlink property button');
    let unlinkStopped = false;
    unlinkBtn.props.onClick({ stopPropagation: () => { unlinkStopped = true; } });
    assert.equal(unlinkStopped, true, 'Unlink button must stop event propagation');
  } finally {
    await server.close();
  }
});
