const TEST_EPOCH = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

export function messengerTestCheckpoint(checkpoint = '0') {
  return { checkpoint, authorizationEpoch: TEST_EPOCH, recoveryMode: 'DELTA' as const };
}

export function messengerTestFullRecovery() {
  return { recoveryMode: 'FULL' as const, checkpoint: null, authorizationEpoch: null };
}
