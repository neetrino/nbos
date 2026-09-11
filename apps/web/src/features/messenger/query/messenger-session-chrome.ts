'use client';

import { useState } from 'react';

export function useMessengerSessionChrome() {
  const [sendBusy, setSendBusy] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  return {
    sendBusy,
    setSendBusy,
    collectionName,
    setCollectionName,
    creatingCollection,
    setCreatingCollection,
    bootError,
    setBootError,
  };
}
