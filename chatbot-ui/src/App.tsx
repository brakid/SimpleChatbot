import React, { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

interface Message {
  sender: string,
  content: string,
  timestamp: number,
}

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    if (!socket) {
      const socket = io('http://localhost:5000/');

      socket.on('connect', () => {
        console.log(`Connected: ${socket.id}`);
      });
      
      socket.on('disconnect', () => {
        console.log(socket.id); // undefined
      });

      socket.on('response', (message, ack) => {
        setMessages(messages => {
          try {
            const mess = [...messages];
            const lastMessage = mess.pop();
            if (lastMessage && lastMessage.sender == 'chatbot') {
              if (!lastMessage.content.endsWith(message)) {
                lastMessage.content += message;
              } else {
                console.log('Skipping');
              }
              return [...mess, lastMessage];
            } else {
              return [...messages, { sender: 'chatbot', content: message, timestamp: Date.now()}];
            }
          } finally {
            ack();
          }
        });
      })

      setSocket(() => socket);
    }
  }, [socket]);

  const sendMessage = (message: string) => {
    socket?.emit('request', message);
    setMessages(messages => [...messages, { sender: 'client', content: message, timestamp: Date.now()}]);
    setMessage('');
  }

  return (
    <div className='container'>
      <ul>
        { messages.map((message, index) => (
          <li key={index} className={ message.sender }><b>{ message.sender }</b>: { message.content }</li>
        )) }
      </ul>
      <div>
        <input type='text' value={ message } onChange={ (e) => setMessage(() => e.target.value) } onKeyDown={ (e) => { if (e.keyCode == 13) { e.preventDefault(); sendMessage(message); }}} placeholder='Your message' />
        <div className='align-right'>
          <button className={ message.length == 0 ? 'disabled' : '' } disabled={ message.length == 0 } onClick={ (e) => { e.preventDefault(); sendMessage(message); }}>Send</button>
        </div>
      </div>
    </div>
  )
};

export default App;