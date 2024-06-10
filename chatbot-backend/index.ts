import express  from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.get('/ping', (req, res) => {
  res.send('Ping');
});

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on('request', async (message) => {
    const response = await ollama.chat({
      model: 'qwen2:1.5b',
      stream: true,
      messages: [{ role: 'system', content: 'Your task is to answer the user\'s questions. Answer them in a polite manner and ensure that your answer satisfies the users by asking them.' }, { role: 'user', content: message }],
    });

    const buffer = [];

    for await (const part of response) {
      const len = buffer.push(part.message.content);
      if (len == 5) {
        await socket.emitWithAck('response', buffer.join(''));
        buffer.length = 0;
      }
    }
    if (buffer.length > 0) {
      await socket.emitWithAck('response', buffer.join(''));
      buffer.length = 0;
    }
  });
});

server.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});