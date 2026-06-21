// Phase 2 Unit & Integration Tests: Scavenger Hunt Social Engine & Photostream
// This file contains automated tests written to verify the Photostream social feed and spoiler protection rules.

import assert from 'assert';

// 1. Spoiler Blurring Helper under test (pure logic extracted from PhotostreamTab rendering)
function checkShouldBlurPhoto({ 
  hideSpoilers, 
  userCompleted, 
  stepSequenceOrder, 
  activeStepSequenceOrder 
}) {
  const isCompleted = userCompleted === true;
  const isSpoiler = hideSpoilers && !isCompleted && stepSequenceOrder >= activeStepSequenceOrder;
  return isSpoiler;
}

// 2. Likes Helper under test (logic extracted from handleLikeSubmission)
function toggleLikeArray(likesArray, username) {
  const hasLiked = likesArray.includes(username);
  if (hasLiked) {
    return likesArray.filter(u => u !== username);
  } else {
    return [...likesArray, username];
  }
}

// 3. Comments Helper under test
function addCommentToArray(commentsArray, username, text) {
  const newComment = {
    username: username,
    body: text,
    created_at: new Date().toISOString()
  };
  return [...commentsArray, newComment];
}

// 4. Test Suite
function runTests() {
  console.log("🚀 Starting Phase 2 Scavenger Hunt Social Engine Test Suite...");
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ Passed: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Failed: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // --- Spoiler Detection Rules ---
  test("Spoiler: Should NOT blur if hideSpoilers is false", () => {
    const shouldBlur = checkShouldBlurPhoto({
      hideSpoilers: false,
      userCompleted: false,
      stepSequenceOrder: 3,
      activeStepSequenceOrder: 1
    });
    assert.strictEqual(shouldBlur, false);
  });

  test("Spoiler: Should NOT blur if user has completed the scavenger hunt", () => {
    const shouldBlur = checkShouldBlurPhoto({
      hideSpoilers: true,
      userCompleted: true,
      stepSequenceOrder: 3,
      activeStepSequenceOrder: 1
    });
    assert.strictEqual(shouldBlur, false);
  });

  test("Spoiler: Should NOT blur if photo corresponds to a completed past step", () => {
    const shouldBlur = checkShouldBlurPhoto({
      hideSpoilers: true,
      userCompleted: false,
      stepSequenceOrder: 1,
      activeStepSequenceOrder: 2
    });
    assert.strictEqual(shouldBlur, false);
  });

  test("Spoiler: Should blur if photo corresponds to the current active locked step", () => {
    const shouldBlur = checkShouldBlurPhoto({
      hideSpoilers: true,
      userCompleted: false,
      stepSequenceOrder: 2,
      activeStepSequenceOrder: 2
    });
    assert.strictEqual(shouldBlur, true);
  });

  test("Spoiler: Should blur if photo corresponds to a locked future step", () => {
    const shouldBlur = checkShouldBlurPhoto({
      hideSpoilers: true,
      userCompleted: false,
      stepSequenceOrder: 3,
      activeStepSequenceOrder: 2
    });
    assert.strictEqual(shouldBlur, true);
  });

  // --- Social Likes ---
  test("Likes: Adding a like when username does not exist in likes array", () => {
    const initialLikes = ["alice", "bob"];
    const updated = toggleLikeArray(initialLikes, "charlie");
    assert.deepStrictEqual(updated, ["alice", "bob", "charlie"]);
  });

  test("Likes: Removing a like when username already exists in likes array", () => {
    const initialLikes = ["alice", "bob", "charlie"];
    const updated = toggleLikeArray(initialLikes, "bob");
    assert.deepStrictEqual(updated, ["alice", "charlie"]);
  });

  // --- Social Comments ---
  test("Comments: Adding a comment inserts comment object with username and body", () => {
    const initialComments = [
      { username: "alice", body: "Nice place!", created_at: "2026-06-20T20:00:00Z" }
    ];
    const updated = addCommentToArray(initialComments, "bob", "Looks fun!");
    assert.strictEqual(updated.length, 2);
    assert.strictEqual(updated[1].username, "bob");
    assert.strictEqual(updated[1].body, "Looks fun!");
    assert.ok(updated[1].created_at);
  });

  console.log("\n========================================");
  console.log(`Test suite finished. Passed: ${passed}, Failed: ${failed}`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
