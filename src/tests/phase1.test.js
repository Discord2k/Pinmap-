// Phase 1 Unit & Integration Tests: Scavenger Hunt Challenge Verification
// This file contains automated tests written to verify the challenge validation logic.

import assert from 'assert';

// 1. Mock DB data representing hunt_steps
const mockHuntSteps = [
  {
    id: "step-gps-1",
    type: "GPS",
    clue: "Go to the fountain",
    expected_answer: null,
    choices: null
  },
  {
    id: "step-qr-2",
    type: "QR_CODE",
    clue: "Scan the secret code on the tree sign",
    expected_answer: "pinmap-oak-tree-987",
    choices: null
  },
  {
    id: "step-trivia-3",
    type: "TRIVIA",
    clue: "What is the capital of France?",
    expected_answer: "Paris",
    choices: null
  },
  {
    id: "step-mcq-4",
    type: "MULTIPLE_CHOICE",
    clue: "Select the primary color",
    expected_answer: "Blue",
    choices: ["Green", "Blue", "Purple", "Orange"]
  }
];

// 2. Mock Implementation of verify_checkpoint_answer (mirroring Postgres RPC function logic)
function verifyCheckpointAnswerMock(stepId, userAnswer) {
  const step = mockHuntSteps.find(s => s.id === stepId);
  if (!step) {
    return false;
  }
  
  // GPS/standard check-in or empty answers are implicitly verified
  if (step.type === 'GPS' || !step.expected_answer) {
    return true;
  }
  
  if (!userAnswer) {
    return false;
  }
  
  // Case-insensitive, trimmed comparison
  return userAnswer.trim().toLowerCase() === step.expected_answer.trim().toLowerCase();
}

// 3. Test Suite
function runTests() {
  console.log("🚀 Starting Phase 1 Scavenger Hunt Challenge Verification Test Suite...");
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

  // --- GPS Step Tests ---
  test("GPS verification - should always pass without answer", () => {
    const result = verifyCheckpointAnswerMock("step-gps-1", null);
    assert.strictEqual(result, true);
  });

  // --- QR Code Step Tests ---
  test("QR Code verification - correct code matches", () => {
    const result = verifyCheckpointAnswerMock("step-qr-2", "pinmap-oak-tree-987");
    assert.strictEqual(result, true);
  });

  test("QR Code verification - incorrect code fails", () => {
    const result = verifyCheckpointAnswerMock("step-qr-2", "pinmap-wrong-code");
    assert.strictEqual(result, false);
  });

  test("QR Code verification - case-insensitive and trimmed spaces check", () => {
    const result = verifyCheckpointAnswerMock("step-qr-2", "  PINMAP-OAK-TREE-987  ");
    assert.strictEqual(result, true);
  });

  // --- Trivia Step Tests ---
  test("Trivia verification - correct answer matches", () => {
    const result = verifyCheckpointAnswerMock("step-trivia-3", "Paris");
    assert.strictEqual(result, true);
  });

  test("Trivia verification - case-insensitive correct answer matches", () => {
    const result = verifyCheckpointAnswerMock("step-trivia-3", "PARIS");
    assert.strictEqual(result, true);
  });

  test("Trivia verification - incorrect answer fails", () => {
    const result = verifyCheckpointAnswerMock("step-trivia-3", "London");
    assert.strictEqual(result, false);
  });

  // --- MCQ Step Tests ---
  test("MCQ verification - correct choice selection matches", () => {
    const result = verifyCheckpointAnswerMock("step-mcq-4", "Blue");
    assert.strictEqual(result, true);
  });

  test("MCQ verification - incorrect choice selection fails", () => {
    const result = verifyCheckpointAnswerMock("step-mcq-4", "Green");
    assert.strictEqual(result, false);
  });

  test("Non-existent step id verification - should fail", () => {
    const result = verifyCheckpointAnswerMock("invalid-step-id", "some answer");
    assert.strictEqual(result, false);
  });

  console.log("\n========================================");
  console.log(`Test suite finished. Passed: ${passed}, Failed: ${failed}`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
