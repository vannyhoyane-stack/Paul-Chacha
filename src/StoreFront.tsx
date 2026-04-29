import React, { useState, useEffect } from 'react';
import { ShoppingCart, Gamepad2, Film, Headphones, Menu, X, Star, ChevronRight, PlayCircle, Search, MonitorPlay, ExternalLink, ShieldCheck, LogIn, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';

export default function StoreFront({ products, user, isAdmin }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [previewVideo, setPreviewVideo] = useState(null); 
  const [purchaseModal, setPurchaseModal] = useState(null); // hold product user wants to buy
  const [transactionId, setTransactionId] = useState('');
  const [userPurchases, setUserPurchases] = useState([]);

  useEffect(() => {
    if (!user) {
      setUserPurchases([]);
      return;
    }
    const q = query(collection(db, 'purchases'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setUserPurchases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleRequestPurchase = async (e) => {
    e.preventDefault();
    if (!user) return alert('Tafadhali ingia (login) kwanza!');
    if (!transactionId) return alert('Tafadhali ingiza namba ya muamala/ID!');

    try {
      await addDoc(collection(db, 'purchases'), {
        productId: purchaseModal.id,
        userId: user.uid,
        userEmail: user.email,
        transactionId: transactionId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setPurchaseModal(null);
      setTransactionId('');
      alert('Maombi yako yametumwa kikamilifu. Tunasubiri kudhibitisha malipo!');
    } catch (err) {
      console.error(err);
      alert('Imeshindikana kutuma: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 to-zinc-950 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-8 flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-6">
             <MonitorPlay className="text-white w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 text-center">
            Vanny Gaming
          </h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">
            Tafadhali jisajili au ingia ili kuendelea
          </p>

          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={handleLogin} 
              className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Ingia na Google (Bure)
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs text-zinc-500 font-medium">AU</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <p className="text-xs text-zinc-500 text-center">
              Fikia michezo, filamu na vifaa vipya. Akaunti inahitajika kudhibitisha ununuzi.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredProducts = activeTab === 'All' 
    ? products 
    : products.filter(p => p.category === activeTab || (activeTab === 'Accessories' && p.category === 'Accessory'));

  const getProductPurchase = (productId) => {
    return userPurchases.find(p => p.productId === productId);
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm("Una uhakika unataka kufuta maombi haya ya ununuzi?")) return;
    try {
      await deleteDoc(doc(db, 'purchases', purchaseId));
      alert("Maombi yamefutwa kikamilifu.");
    } catch (err) {
      console.error(err);
      alert("Imeshindikana kufuta: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-purple-500/20">
                <MonitorPlay className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 leading-tight">
                  VANNY GAMING
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400">Store & Video</p>
              </div>
            </div>

      {/* Desktop Menu */}
            <div className="hidden md:flex flex-1 justify-center space-x-8">
              {[
                { id: 'All', name: 'Home' },
                { id: 'Game', name: 'Game' },
                { id: 'Accessory', name: 'Accessories' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium transition-colors hover:text-purple-400 ${
                    activeTab === item.id ? 'text-purple-400' : 'text-zinc-300'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Icons */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-zinc-400 hover:text-white transition">
                <Search className="w-5 h-5" />
              </button>
              {isAdmin && (
                <Link to="/admin" className="text-zinc-400 hover:text-white transition" title="Admin Panel">
                  Control Panel
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                   <div className="text-sm font-medium text-purple-400">{user.email}</div>
                   <button onClick={handleLogout} className="bg-white/10 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition flex items-center gap-2">
                     <LogOut className="w-4 h-4" /> Toka
                   </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="bg-white text-zinc-950 px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Ingia
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-zinc-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {[
                  { id: 'All', name: 'Home' },
                  { id: 'Game', name: 'Game' },
                  { id: 'Accessory', name: 'Accessories' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left text-base font-medium py-2 ${activeTab === item.id ? 'text-purple-400' : 'text-zinc-300 hover:text-purple-400'}`}
                  >
                    {item.name}
                  </button>
                ))}
                {isAdmin && (
                  <Link to="/admin" className="block w-full text-left text-base font-medium text-zinc-300 hover:text-purple-400">
                    Control Panel
                  </Link>
                )}
                <div className="pt-4 border-t border-white/10">
                  {user ? (
                    <>
                      <div className="text-sm font-medium text-purple-400 mb-4 truncate">{user.email}</div>
                      <button onClick={handleLogout} className="w-full bg-white/10 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-white/20 transition flex items-center justify-center gap-2">
                        <LogOut className="w-4 h-4" /> Toka
                      </button>
                    </>
                  ) : (
                    <button onClick={handleLogin} className="w-full bg-purple-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                       <LogIn className="w-4 h-4" /> Ingia na Google
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      {activeTab === 'All' && (
        <div className="relative pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-zinc-950 z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10 flex flex-col md:flex-row items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                  Gundua Mchezo <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                    Ambao Hausimami.
                  </span>
                </h1>
                <p className="text-lg text-zinc-400 mb-8">
                  Gundua ulimwengu mpya wa burudani kupitia Vanny Gaming Store & Video. Michezo ya PS5, Xbox, PC na filamu mpya kila siku.
                </p>
              </motion.div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[500px] ${activeTab !== 'All' ? 'pt-32' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            {activeTab === 'All' ? 'Home' : `${activeTab === 'Game' ? 'Games' : 'Accessories'}`}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
               const userPurchase = getProductPurchase(product.id);
               const accessStatus = userPurchase ? userPurchase.status : null;
               return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group bg-zinc-900 border border-white/5 rounded-2xl flex flex-col overflow-hidden hover:border-purple-500/50 transition-colors shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.tags?.[0] && (
                      <span className="bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium border border-white/10">
                        {product.tags[0]}
                      </span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                    {isAdmin && (
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             if(window.confirm("Una uhakika unataka kufuta bidhaa hii kikamilifu?")) {
                               deleteDoc(doc(db, 'products', product.id)).catch(err => alert("Kosa: " + err.message));
                             }
                          }}
                          className="bg-red-600/90 text-white p-3 rounded-full hover:bg-red-500 transition transform hover:scale-110 shadow-lg border border-red-500/50" 
                          title="Futa Bidhaa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    {product.videoUrl && (
                      <button 
                        onClick={() => setPreviewVideo(product)}
                        className="bg-zinc-800/90 text-white p-3 rounded-full hover:bg-zinc-700 transition transform hover:scale-110 shadow-lg border border-white/10" 
                        title="Watch Preview"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-400">{product.category}</span>
                    <div className="flex items-center text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current mr-1" />
                      {product.rating}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-purple-400 transition-colors" title={product.title}>{product.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xl font-extrabold text-white">
                       TSh. {product.price}
                    </div>
                  </div>

                  {/* Direct Download Link Logic */}
                  {product.downloadLink && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex">
                       {accessStatus === 'approved' ? (
                          <a href={product.downloadLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold py-3 rounded-xl text-sm transition">
                             <ShieldCheck className="w-4 h-4" /> Fungua / Pakua
                          </a>
                       ) : accessStatus === 'pending' ? (
                          <div className="w-full relative group">
                             <p className="w-full text-center text-amber-500 text-sm font-medium py-3 bg-amber-500/10 rounded-xl">Inasubiri Udhibitisho</p>
                             <button title="Futa Maombi" onClick={() => handleDeletePurchase(userPurchase.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-all scale-90 group-hover:scale-100 shadow-lg">
                                <Trash2 className="w-4 h-4"/>
                             </button>
                          </div>
                       ) : accessStatus === 'rejected' ? (
                          <p className="w-full text-center text-red-500 text-sm font-medium py-3 bg-red-500/10 rounded-xl">Malipo Yamekataliwa</p>
                       ) : (
                          <button onClick={() => {
                            if (!user) return alert("Log in kwanza ndipo ununue!");
                            setPurchaseModal(product);
                          }} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-purple-600/20">
                            Pata Link (Nunua)
                          </button>
                       )}
                    </div>
                  )}
                </div>
              </motion.div>
            )})}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-zinc-500">
                 Hakuna bidhaa zinazopatikana kwenye jamii hii bado.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <MonitorPlay className="text-white w-4 h-4" />
              </div>
              <span className="text-white font-bold tracking-tight">Vanny Gaming</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-400">
              <span className="cursor-pointer hover:text-white transition">Kuhusu Sisi</span>
              <span className="cursor-pointer hover:text-white transition">Mawasiliano</span>
              <span className="cursor-pointer hover:text-white transition">Sheria na Masharti</span>
            </div>
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} Vanny Gaming Store & Video. Haki zote zimehifadhiwa.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal for Purchase / Payment Process */}
      <AnimatePresence>
        {purchaseModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
             <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl relative">
                <button title="Funga" onClick={() => setPurchaseModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-white/5 p-2 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
                <div className="p-8">
                   <h3 className="text-2xl font-bold text-white mb-2">Lipia Bidhaa</h3>
                   <p className="text-zinc-400 mb-6 text-sm">Kwa sasa, unahitaji kulipa kwanza ili uweze kupata link husika.</p>
                   
                   <div className="bg-purple-900/20 border border-purple-500/20 p-5 rounded-xl mb-6">
                     <p className="font-semibold text-purple-200 mb-1">Bidhaa: <span className="text-white">{purchaseModal.title}</span></p>
                     <p className="font-bold text-2xl text-purple-400">TSh. {purchaseModal.price}</p>
                   </div>

                   <ul className="mb-8 space-y-3 text-sm text-zinc-300">
                     <li className="flex gap-3"><span className="text-purple-400 font-bold">1.</span> Tuma pesa kwa namba <strong className="text-white font-mono text-base px-2 bg-zinc-800 rounded">0781485848</strong></li>
                     <li className="flex gap-3"><span className="text-purple-400 font-bold">2.</span> Ingiza namba ya muamala (Transaction ID) hapa chini pindi utakapolipia.</li>
                     <li className="flex gap-3"><span className="text-purple-400 font-bold">3.</span> Tunasibitisha na kukupa link moja kwa moja!</li>
                   </ul>

                   <form onSubmit={handleRequestPurchase}>
                     <label className="block text-sm font-semibold text-zinc-400 mb-2">Transaction ID (Muamala)</label>
                     <input 
                       required 
                       placeholder="Mfano: RK45B12A..." 
                       value={transactionId}
                       onChange={e => setTransactionId(e.target.value)}
                       className="w-full bg-zinc-950 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition mb-6" 
                     />
                     <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg">
                       Thibitisha Malipo
                     </button>
                   </form>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Video Previews */}
      <AnimatePresence>
        {previewVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          >
             <button title="Close" onClick={() => setPreviewVideo(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition z-10">
                <X className="w-6 h-6" />
             </button>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl relative"
             >
                <div className="relative aspect-video bg-black">
                   <video src={previewVideo.videoUrl} controls autoPlay className="w-full h-full" />
                </div>
                <div className="p-6">
                   <h3 className="text-2xl font-bold text-white mb-2">{previewVideo.title}</h3>
                   <span className="text-purple-400 font-medium">{previewVideo.category}</span>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

