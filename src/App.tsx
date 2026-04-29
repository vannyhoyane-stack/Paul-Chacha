import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import StoreFront from './StoreFront';
import AdminPanel from './AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
    }, (error) => {
      console.error('Firestore Error:', error);
    });
    return unsubscribe;
  }, []);

  if (!authReady) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  const isAdmin = user?.email?.toLowerCase() === 'chachapaul721@gmail.com';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StoreFront products={products} user={user} isAdmin={isAdmin} />} />
        <Route 
          path="/admin" 
          element={
            isAdmin ? 
              <AdminPanel products={products} /> 
            : 
              <Navigate to="/" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}


