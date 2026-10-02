'use client';

import { useState } from 'react';

export function useMessengerSessionChrome() {
  const [collectionName, setCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  return {
    collectionName,
    setCollectionName,
    creatingCollection,
    setCreatingCollection,
    bootError,
    setBootError,
  };
}
