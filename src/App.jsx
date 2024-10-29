import React from 'react';
// import { io } from 'socket.io-client';
import './App.css';
import './style/style.css'
// import NameModal from './Components/NameModal';
import Home from './Components/Home';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotificationHandler from './Components/NotificationHandler';


function App() {
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/slips-game' element={<Home />} />
          {/* <Route path='/notifications' element={<NotificationHandler />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
